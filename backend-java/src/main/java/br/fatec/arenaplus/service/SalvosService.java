package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.PaginaResponse;
import br.fatec.arenaplus.dto.PublicacaoResponse;
import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.PublicacaoSalva;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.repository.PublicacaoSalvaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coleção privada de publicações salvas: todas as operações usam o usuário autenticado. */
@Service
@Transactional
public class SalvosService {

    private final PublicacaoSalvaRepository salvos;
    private final PublicacaoService publicacaoService;
    private final UsuarioService usuarioService;

    public SalvosService(PublicacaoSalvaRepository salvos, PublicacaoService publicacaoService, UsuarioService usuarioService) {
        this.salvos = salvos;
        this.publicacaoService = publicacaoService;
        this.usuarioService = usuarioService;
    }

    public PublicacaoResponse salvar(Long usuarioId, Long publicacaoId) {
        Publicacao p = publicacaoService.obter(publicacaoId);
        if (salvos.existsByUsuarioIdAndPublicacaoId(usuarioId, publicacaoId)) {
            throw new ConflitoException("Esta publicação já está nos seus salvos.");
        }
        PublicacaoSalva s = new PublicacaoSalva();
        s.setUsuario(usuarioService.obterAtivo(usuarioId));
        s.setPublicacao(p);
        salvos.save(s);
        return publicacaoService.toResponse(p, usuarioId);
    }

    public void remover(Long usuarioId, Long publicacaoId) {
        salvos.delete(salvos.findByUsuarioIdAndPublicacaoId(usuarioId, publicacaoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Esta publicação não está nos seus salvos.")));
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PublicacaoResponse> listar(Long usuarioId, Pageable pageable) {
        return PaginaResponse.of(salvos.publicacoesSalvas(usuarioId, pageable), p -> publicacaoService.toResponse(p, usuarioId));
    }
}
