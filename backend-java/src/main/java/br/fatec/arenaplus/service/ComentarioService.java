package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.ComentarioRequest;
import br.fatec.arenaplus.dto.ComentarioResponse;
import br.fatec.arenaplus.dto.ComentarioUpdateRequest;
import br.fatec.arenaplus.entity.Comentario;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.repository.ComentarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ComentarioService {

    private final ComentarioRepository comentarios;
    private final UsuarioService usuarioService;
    private final PublicacaoService publicacaoService;

    public ComentarioService(ComentarioRepository comentarios, UsuarioService usuarioService,
                             PublicacaoService publicacaoService) {
        this.comentarios = comentarios;
        this.usuarioService = usuarioService;
        this.publicacaoService = publicacaoService;
    }

    public ComentarioResponse comentar(ComentarioRequest req) {
        Comentario c = new Comentario();
        c.setUsuario(usuarioService.obterAtivo(req.usuarioId()));
        c.setPublicacao(publicacaoService.obter(req.publicacaoId()));
        c.setTexto(req.texto().trim());
        return ComentarioResponse.from(comentarios.save(c));
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponse> listarPorPublicacao(Long publicacaoId) {
        publicacaoService.obter(publicacaoId);
        return comentarios.findByPublicacaoIdOrderByDataComentarioAsc(publicacaoId).stream()
                .map(ComentarioResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ComentarioResponse buscar(Long id) {
        return ComentarioResponse.from(obter(id));
    }

    public ComentarioResponse atualizar(Long id, ComentarioUpdateRequest req) {
        Comentario c = obter(id);
        c.setTexto(req.texto().trim());
        return ComentarioResponse.from(c);
    }

    public void excluir(Long id) {
        comentarios.delete(obter(id));
    }

    private Comentario obter(Long id) {
        return comentarios.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Comentário", id));
    }
}
