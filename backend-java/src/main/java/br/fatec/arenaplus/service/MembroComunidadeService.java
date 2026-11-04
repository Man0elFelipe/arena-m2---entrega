package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.MembroComunidadeRequest;
import br.fatec.arenaplus.dto.MembroComunidadeResponse;
import br.fatec.arenaplus.entity.Comunidade;
import br.fatec.arenaplus.entity.MembroComunidade;
import br.fatec.arenaplus.entity.PapelMembro;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.AcessoNegadoException;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.MembroComunidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MembroComunidadeService {

    private final MembroComunidadeRepository membros;
    private final UsuarioService usuarioService;
    private final ComunidadeService comunidadeService;

    public MembroComunidadeService(MembroComunidadeRepository membros, UsuarioService usuarioService,
                                   ComunidadeService comunidadeService) {
        this.membros = membros;
        this.usuarioService = usuarioService;
        this.comunidadeService = comunidadeService;
    }

    public MembroComunidadeResponse entrar(Long usuarioId, MembroComunidadeRequest req) {
        Usuario usuario = usuarioService.obterAtivo(usuarioId);
        Comunidade comunidade = comunidadeService.obter(req.comunidadeId());
        if (membros.existsByUsuarioIdAndComunidadeId(usuario.getId(), comunidade.getId())) {
            throw new ConflitoException("Usuário já participa desta comunidade.");
        }
        MembroComunidade m = new MembroComunidade();
        m.setUsuario(usuario);
        m.setComunidade(comunidade);
        m.setPapel(PapelMembro.MEMBRO); // ninguém escolhe o próprio papel
        return MembroComunidadeResponse.from(membros.save(m));
    }

    @Transactional(readOnly = true)
    public List<MembroComunidadeResponse> listar(Long comunidadeId, Long usuarioId) {
        if (comunidadeId == null && usuarioId == null) {
            throw new RegraNegocioException("Informe comunidadeId e/ou usuarioId.");
        }
        if (comunidadeId != null && usuarioId != null) {
            return membros.findByUsuarioIdAndComunidadeId(usuarioId, comunidadeId)
                    .map(MembroComunidadeResponse::from).stream().toList();
        }
        if (comunidadeId != null) {
            comunidadeService.obter(comunidadeId);
            return membros.findByComunidadeIdOrderByDataEntradaAsc(comunidadeId).stream()
                    .map(MembroComunidadeResponse::from).toList();
        }
        usuarioService.obter(usuarioId);
        return membros.findByUsuarioIdOrderByDataEntradaDesc(usuarioId).stream()
                .map(MembroComunidadeResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MembroComunidadeResponse buscar(Long id) {
        return MembroComunidadeResponse.from(obter(id));
    }

    public MembroComunidadeResponse alterarPapel(Long id, PapelMembro papel, UsuarioAutenticado atual) {
        MembroComunidade m = obter(id);
        exigirModerador(m.getComunidade().getId(), atual);
        if (m.getUsuario().getId().equals(m.getComunidade().getCriador().getId())) {
            throw new RegraNegocioException("O criador da comunidade permanece moderador.");
        }
        m.setPapel(papel);
        return MembroComunidadeResponse.from(m);
    }

    /** O próprio membro, um moderador da comunidade ou um administrador podem remover a participação. */
    public void sair(Long id, UsuarioAutenticado atual) {
        MembroComunidade m = obter(id);
        if (!m.getUsuario().getId().equals(atual.id())) exigirModerador(m.getComunidade().getId(), atual);
        membros.delete(m);
    }

    public void sair(Long usuarioId, Long comunidadeId) {
        MembroComunidade m = membros.findByUsuarioIdAndComunidadeId(usuarioId, comunidadeId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário " + usuarioId
                        + " não participa da comunidade " + comunidadeId + "."));
        membros.delete(m);
    }

    @Transactional(readOnly = true)
    public boolean participa(Long usuarioId, Long comunidadeId) {
        return membros.existsByUsuarioIdAndComunidadeId(usuarioId, comunidadeId);
    }

    private void exigirModerador(Long comunidadeId, UsuarioAutenticado atual) {
        boolean moderador = membros.findByUsuarioIdAndComunidadeId(atual.id(), comunidadeId)
                .map(x -> x.getPapel() == PapelMembro.MODERADOR).orElse(false);
        if (!moderador && !atual.admin()) {
            throw new AcessoNegadoException("Apenas moderadores da comunidade podem fazer isso.");
        }
    }

    private MembroComunidade obter(Long id) {
        return membros.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Participação", id));
    }
}
