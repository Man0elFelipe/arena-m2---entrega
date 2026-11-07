package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.ComunidadeRequest;
import br.fatec.arenaplus.dto.ComunidadeResponse;
import br.fatec.arenaplus.dto.ComunidadeUpdateRequest;
import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.entity.Comunidade;
import br.fatec.arenaplus.entity.MembroComunidade;
import br.fatec.arenaplus.entity.PapelMembro;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.AcessoNegadoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.repository.Busca;
import br.fatec.arenaplus.repository.ComunidadeRepository;
import br.fatec.arenaplus.repository.MembroComunidadeRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ComunidadeService {

    private final ComunidadeRepository comunidades;
    private final MembroComunidadeRepository membros;
    private final PublicacaoRepository publicacoes;
    private final UsuarioService usuarioService;
    private final MidiaService midiaService;

    public ComunidadeService(ComunidadeRepository comunidades, MembroComunidadeRepository membros,
                             PublicacaoRepository publicacoes, UsuarioService usuarioService, MidiaService midiaService) {
        this.midiaService = midiaService;
        this.comunidades = comunidades;
        this.membros = membros;
        this.publicacoes = publicacoes;
        this.usuarioService = usuarioService;
    }

    /** Cria a comunidade e registra o criador como MODERADOR. */
    public ComunidadeResponse criar(Long criadorId, ComunidadeRequest req) {
        Usuario criador = usuarioService.obterAtivo(criadorId);
        Comunidade c = new Comunidade();
        c.setNome(req.nome().trim());
        c.setDescricao(req.descricao().trim());
        c.setEsporte(req.esporte().trim());
        c.setImagemUrl(midiaService.validarCapa(req.imagemUrl(), criadorId));
        c.setCriador(criador);
        comunidades.save(c);

        MembroComunidade m = new MembroComunidade();
        m.setUsuario(criador);
        m.setComunidade(c);
        m.setPapel(PapelMembro.MODERADOR);
        membros.save(m);
        return toResponse(c);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ComunidadeResponse> listar(String busca, String esporte, Pageable pageable) {
        return PaginaResponse.of(comunidades.buscar(Busca.normalizar(busca), Busca.normalizar(esporte), pageable), this::toResponse);
    }

    @Transactional(readOnly = true)
    public ComunidadeResponse buscar(Long id) {
        return toResponse(obter(id));
    }

    public ComunidadeResponse atualizar(Long id, ComunidadeUpdateRequest req, UsuarioAutenticado atual) {
        Comunidade c = obter(id);
        exigirModerador(c, atual);
        c.setNome(req.nome().trim());
        c.setDescricao(req.descricao().trim());
        c.setEsporte(req.esporte().trim());
        String antiga = c.getImagemUrl();
        String nova = Textos.limpar(req.imagemUrl());
        if (!java.util.Objects.equals(nova, antiga)) { // só valida se a capa mudou (outro moderador pode reenviar a mesma)
            c.setImagemUrl(midiaService.validarCapa(nova, atual.id()));
            comunidades.flush();
            midiaService.liberarSeOrfa(antiga);
        }
        return toResponse(c);
    }

    /**
     * Remove a comunidade e os vínculos de membros.
     * As publicações são preservadas e passam a aparecer apenas no feed geral (comunidadeId = null).
     */
    public void excluir(Long id, UsuarioAutenticado atual) {
        Comunidade c = obter(id);
        exigirModerador(c, atual);
        publicacoes.desvincularDaComunidade(id);
        membros.deleteByComunidadeId(id);
        comunidades.delete(c);
    }

    @Transactional(readOnly = true)
    public Comunidade obter(Long id) {
        return comunidades.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Comunidade", id));
    }

    /** Apenas moderadores da comunidade (ou administradores) podem editá-la ou excluí-la. */
    private void exigirModerador(Comunidade c, UsuarioAutenticado atual) {
        boolean moderador = membros.findByUsuarioIdAndComunidadeId(atual.id(), c.getId())
                .map(m -> m.getPapel() == PapelMembro.MODERADOR).orElse(false);
        if (!moderador && !atual.admin()) {
            throw new AcessoNegadoException("Apenas moderadores da comunidade podem fazer isso.");
        }
    }

    ComunidadeResponse toResponse(Comunidade c) {
        return new ComunidadeResponse(c.getId(), c.getNome(), c.getDescricao(), c.getEsporte(), c.getImagemUrl(),
                c.getCriador().getId(), c.getCriador().getNome(), c.getDataCriacao(),
                membros.countByComunidadeId(c.getId()), publicacoes.countByComunidadeId(c.getId()));
    }
}
