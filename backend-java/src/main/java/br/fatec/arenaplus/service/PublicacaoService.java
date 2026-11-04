package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.Comunidade;
import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.TipoMidia;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.AcessoNegadoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.repository.PublicacaoSalvaRepository;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.ComentarioRepository;
import br.fatec.arenaplus.repository.CurtidaRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@Transactional
public class PublicacaoService {

    private static final Pattern EXTENSAO_VIDEO = Pattern.compile(".*\\.(mp4|webm|mov|m4v|ogg)(\\?.*)?$");

    private final PublicacaoRepository publicacoes;
    private final ComentarioRepository comentarios;
    private final CurtidaRepository curtidas;
    private final UsuarioService usuarioService;
    private final ComunidadeService comunidadeService;
    private final MembroComunidadeService membroService;
    private final MidiaService midiaService;
    private final PublicacaoSalvaRepository salvos;

    public PublicacaoService(PublicacaoRepository publicacoes, ComentarioRepository comentarios,
                             CurtidaRepository curtidas, UsuarioService usuarioService,
                             ComunidadeService comunidadeService, MembroComunidadeService membroService,
                             MidiaService midiaService, PublicacaoSalvaRepository salvos) {
        this.midiaService = midiaService;
        this.salvos = salvos;
        this.publicacoes = publicacoes;
        this.comentarios = comentarios;
        this.curtidas = curtidas;
        this.usuarioService = usuarioService;
        this.comunidadeService = comunidadeService;
        this.membroService = membroService;
    }

    public PublicacaoResponse criar(Long autorId, PublicacaoRequest req) {
        Usuario autor = usuarioService.obterAtivo(autorId);
        Comunidade comunidade = null;
        if (req.comunidadeId() != null) {
            comunidade = comunidadeService.obter(req.comunidadeId());
            if (!membroService.participa(autor.getId(), comunidade.getId())) {
                throw new RegraNegocioException("Usuário precisa participar da comunidade para publicar nela.");
            }
        }
        Publicacao p = new Publicacao();
        p.setUsuario(autor);
        p.setComunidade(comunidade);
        p.setTexto(req.texto().trim());
        aplicarMidia(p, req.midiaUrl(), req.tipoMidia(), autor.getId());
        return toResponse(publicacoes.save(p), autorId);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PublicacaoResponse> listar(Long usuarioId, Long comunidadeId, Long viewerId, Pageable pageable) {
        return PaginaResponse.of(publicacoes.buscar(usuarioId, comunidadeId, pageable), p -> toResponse(p, viewerId));
    }

    /** Publicações do próprio usuário e de quem ele segue. */
    @Transactional(readOnly = true)
    public PaginaResponse<PublicacaoResponse> feed(Long usuarioId, Pageable pageable) {
        usuarioService.obter(usuarioId);
        return PaginaResponse.of(publicacoes.feedDoUsuario(usuarioId, pageable), p -> toResponse(p, usuarioId));
    }

    @Transactional(readOnly = true)
    public PublicacaoResponse buscar(Long id, Long viewerId) {
        return toResponse(obter(id), viewerId);
    }

    public PublicacaoResponse atualizar(Long id, PublicacaoUpdateRequest req, UsuarioAutenticado atual) {
        Publicacao p = obter(id);
        exigirAutorOuAdmin(p, atual, "Você só pode editar as suas próprias publicações.");
        String midiaAnterior = p.getMidiaUrl();
        p.setTexto(req.texto().trim());
        aplicarMidia(p, req.midiaUrl(), req.tipoMidia(), p.getUsuario().getId());
        p.setDataEdicao(LocalDateTime.now());
        publicacoes.flush();
        if (midiaAnterior != null && !midiaAnterior.equals(p.getMidiaUrl())) midiaService.liberarSeOrfa(midiaAnterior);
        return toResponse(p, atual.id());
    }

    /** Exclui a publicação junto com seus comentários e curtidas. */
    public void excluir(Long id, UsuarioAutenticado atual) {
        Publicacao p = obter(id);
        exigirAutorOuAdmin(p, atual, "Você só pode excluir as suas próprias publicações.");
        String midia = p.getMidiaUrl();
        comentarios.deleteByPublicacaoId(id);
        curtidas.deleteByPublicacaoId(id);
        salvos.deleteByPublicacaoId(id);
        publicacoes.delete(p);
        publicacoes.flush();
        midiaService.liberarSeOrfa(midia); // apaga o arquivo se nenhuma outra publicação o usa
    }

    @Transactional(readOnly = true)
    public Publicacao obter(Long id) {
        return publicacoes.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Publicação", id));
    }

    /** No máximo uma mídia por publicação; tipoMidia sem midiaUrl é inválido e o tipo é inferido se ausente. */
    private static void exigirAutorOuAdmin(Publicacao p, UsuarioAutenticado atual, String mensagem) {
        if (!p.getUsuario().getId().equals(atual.id()) && !atual.admin()) throw new AcessoNegadoException(mensagem);
    }

    private void aplicarMidia(Publicacao p, String midiaUrl, TipoMidia tipoMidia, Long autorId) {
        String url = Textos.limpar(midiaUrl);
        if (url == null) {
            if (tipoMidia != null) {
                throw new RegraNegocioException("tipoMidia informado sem midiaUrl.");
            }
            p.setMidiaUrl(null);
            p.setTipoMidia(null);
            return;
        }
        TipoMidia tipoEnviado = midiaService.validarReferencia(url, autorId); // mídia enviada: existe e é do autor
        p.setMidiaUrl(url);
        p.setTipoMidia(tipoEnviado != null ? tipoEnviado : tipoMidia != null ? tipoMidia
                : EXTENSAO_VIDEO.matcher(url.toLowerCase(Locale.ROOT)).matches() ? TipoMidia.VIDEO : TipoMidia.IMAGEM);
    }

    PublicacaoResponse toResponse(Publicacao p, Long viewerId) {
        Comunidade c = p.getComunidade();
        Boolean curtida = viewerId == null ? null : curtidas.existsByUsuarioIdAndPublicacaoId(viewerId, p.getId());
        Boolean salva = viewerId == null ? null : salvos.existsByUsuarioIdAndPublicacaoId(viewerId, p.getId());
        return new PublicacaoResponse(p.getId(), p.getUsuario().getId(), UsuarioResumo.from(p.getUsuario()),
                c == null ? null : c.getId(), c == null ? null : c.getNome(),
                p.getTexto(), p.getMidiaUrl(), p.getTipoMidia(), p.getDataPublicacao(), p.getDataEdicao(),
                curtidas.countByPublicacaoId(p.getId()), comentarios.countByPublicacaoId(p.getId()), curtida, salva);
    }
}
