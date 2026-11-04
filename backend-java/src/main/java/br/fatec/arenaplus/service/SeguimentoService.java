package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.SeguimentoRequest;
import br.fatec.arenaplus.dto.SeguimentoResponse;
import br.fatec.arenaplus.entity.Seguimento;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.SeguimentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SeguimentoService {

    private final SeguimentoRepository seguimentos;
    private final UsuarioService usuarioService;

    public SeguimentoService(SeguimentoRepository seguimentos, UsuarioService usuarioService) {
        this.seguimentos = seguimentos;
        this.usuarioService = usuarioService;
    }

    public SeguimentoResponse seguir(SeguimentoRequest req) {
        if (req.seguidorId().equals(req.seguidoId())) {
            throw new RegraNegocioException("Um usuário não pode seguir a si mesmo.");
        }
        Usuario seguidor = usuarioService.obterAtivo(req.seguidorId());
        Usuario seguido = usuarioService.obterAtivo(req.seguidoId());
        if (seguimentos.existsBySeguidorIdAndSeguidoId(seguidor.getId(), seguido.getId())) {
            throw new ConflitoException("Usuário já segue este perfil.");
        }
        Seguimento s = new Seguimento();
        s.setSeguidor(seguidor);
        s.setSeguido(seguido);
        return SeguimentoResponse.from(seguimentos.save(s));
    }

    @Transactional(readOnly = true)
    public List<SeguimentoResponse> seguidores(Long usuarioId) {
        usuarioService.obter(usuarioId);
        return seguimentos.findBySeguidoIdOrderByDataSeguimentoDesc(usuarioId).stream()
                .map(SeguimentoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SeguimentoResponse> seguindo(Long usuarioId) {
        usuarioService.obter(usuarioId);
        return seguimentos.findBySeguidorIdOrderByDataSeguimentoDesc(usuarioId).stream()
                .map(SeguimentoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public boolean segue(Long seguidorId, Long seguidoId) {
        return seguimentos.existsBySeguidorIdAndSeguidoId(seguidorId, seguidoId);
    }

    @Transactional(readOnly = true)
    public SeguimentoResponse buscar(Long id) {
        return SeguimentoResponse.from(seguimentos.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Seguimento", id)));
    }

    public void remover(Long id) {
        seguimentos.delete(seguimentos.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Seguimento", id)));
    }

    public void deixarDeSeguir(Long seguidorId, Long seguidoId) {
        seguimentos.delete(seguimentos.findBySeguidorIdAndSeguidoId(seguidorId, seguidoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário " + seguidorId + " não segue o usuário " + seguidoId + ".")));
    }
}
