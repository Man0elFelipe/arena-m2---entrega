package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.Comunidade;
import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.TipoMidia;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
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

    public PublicacaoService(PublicacaoRepository publicacoes, ComentarioRepository comentarios,
                             CurtidaRepository curtidas, UsuarioService usuarioService,
                             ComunidadeService comunidadeService, MembroComunidadeService membroService) {
        this.publicacoes = publicacoes;
        this.comentarios = comentarios;
        this.curtidas = curtidas;
        this.usuarioService = usuarioService;
        this.comunidadeService = comunidadeService;
        this.membroService = membroService;
    }

    public PublicacaoResponse criar(PublicacaoRequest req) {
        Usuario autor = usuarioService.obterAtivo(req.usuarioId());
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
        aplicarMidia(p, req.midiaUrl(), req.tipoMidia());
        return toResponse(publicacoes.save(p), null);
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

    public PublicacaoResponse atualizar(Long id, PublicacaoUpdateRequest req) {
        Publicacao p = obter(id);
        p.setTexto(req.texto().trim());
        aplicarMidia(p, req.midiaUrl(), req.tipoMidia());
        p.setDataEdicao(LocalDateTime.now());
        return toResponse(p, null);
    }

    /** Exclui a publicação junto com seus comentários e curtidas. */
    public void excluir(Long id) {
        Publicacao p = obter(id);
        comentarios.deleteByPublicacaoId(id);
        curtidas.deleteByPublicacaoId(id);
        publicacoes.delete(p);
    }

    @Transactional(readOnly = true)
    public Publicacao obter(Long id) {
        return publicacoes.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Publicação", id));
    }

    /** No máximo uma mídia por publicação; tipoMidia sem midiaUrl é inválido e o tipo é inferido se ausente. */
    private static void aplicarMidia(Publicacao p, String midiaUrl, TipoMidia tipoMidia) {
        String url = Textos.limpar(midiaUrl);
        if (url == null) {
            if (tipoMidia != null) {
                throw new RegraNegocioException("tipoMidia informado sem midiaUrl.");
            }
            p.setMidiaUrl(null);
            p.setTipoMidia(null);
            return;
        }
        p.setMidiaUrl(url);
        p.setTipoMidia(tipoMidia != null ? tipoMidia
                : EXTENSAO_VIDEO.matcher(url.toLowerCase(Locale.ROOT)).matches() ? TipoMidia.VIDEO : TipoMidia.IMAGEM);
    }

    private PublicacaoResponse toResponse(Publicacao p, Long viewerId) {
        Comunidade c = p.getComunidade();
        Boolean curtida = viewerId == null ? null : curtidas.existsByUsuarioIdAndPublicacaoId(viewerId, p.getId());
        return new PublicacaoResponse(p.getId(), p.getUsuario().getId(), UsuarioResumo.from(p.getUsuario()),
                c == null ? null : c.getId(), c == null ? null : c.getNome(),
                p.getTexto(), p.getMidiaUrl(), p.getTipoMidia(), p.getDataPublicacao(), p.getDataEdicao(),
                curtidas.countByPublicacaoId(p.getId()), comentarios.countByPublicacaoId(p.getId()), curtida);
    }
}
