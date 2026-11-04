package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.ContagemResponse;
import br.fatec.arenaplus.dto.CurtidaRequest;
import br.fatec.arenaplus.dto.CurtidaResponse;
import br.fatec.arenaplus.entity.Curtida;
import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.repository.CurtidaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CurtidaService {

    private final CurtidaRepository curtidas;
    private final UsuarioService usuarioService;
    private final PublicacaoService publicacaoService;

    public CurtidaService(CurtidaRepository curtidas, UsuarioService usuarioService, PublicacaoService publicacaoService) {
        this.curtidas = curtidas;
        this.usuarioService = usuarioService;
        this.publicacaoService = publicacaoService;
    }

    public CurtidaResponse curtir(CurtidaRequest req) {
        Usuario usuario = usuarioService.obterAtivo(req.usuarioId());
        Publicacao publicacao = publicacaoService.obter(req.publicacaoId());
        if (curtidas.existsByUsuarioIdAndPublicacaoId(usuario.getId(), publicacao.getId())) {
            throw new ConflitoException("Usuário já curtiu esta publicação.");
        }
        Curtida c = new Curtida();
        c.setUsuario(usuario);
        c.setPublicacao(publicacao);
        return CurtidaResponse.from(curtidas.save(c));
    }

    @Transactional(readOnly = true)
    public List<CurtidaResponse> listarPorPublicacao(Long publicacaoId) {
        publicacaoService.obter(publicacaoId);
        return curtidas.findByPublicacaoIdOrderByDataCurtidaDesc(publicacaoId).stream()
                .map(CurtidaResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ContagemResponse contar(Long publicacaoId) {
        publicacaoService.obter(publicacaoId);
        return new ContagemResponse(publicacaoId, curtidas.countByPublicacaoId(publicacaoId));
    }

    public void remover(Long id) {
        curtidas.delete(curtidas.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Curtida", id)));
    }

    /** Descurtir pelo par usuário/publicação (usado pelo frontend). */
    public void descurtir(Long usuarioId, Long publicacaoId) {
        curtidas.delete(curtidas.findByUsuarioIdAndPublicacaoId(usuarioId, publicacaoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário " + usuarioId + " não curtiu a publicação " + publicacaoId + ".")));
    }
}
