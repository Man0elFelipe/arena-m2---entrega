package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.SeguimentoRequest;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.SeguimentoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Testes unitários das regras de seguimento, sem Spring nem banco. */
@ExtendWith(MockitoExtension.class)
class SeguimentoServiceTest {

    @Mock
    SeguimentoRepository seguimentos;

    @Mock
    UsuarioService usuarioService;

    @InjectMocks
    SeguimentoService service;

    private static Usuario usuario(long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNome("U" + id);
        return u;
    }

    @Test
    void naoPermiteSeguirASiMesmoSemConsultarOBanco() {
        assertThatThrownBy(() -> service.seguir(new SeguimentoRequest(1L, 1L)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("si mesmo");
        verifyNoInteractions(seguimentos, usuarioService);
    }

    @Test
    void seguimentoDuplicadoLancaConflitoENaoSalva() {
        when(usuarioService.obterAtivo(1L)).thenReturn(usuario(1));
        when(usuarioService.obterAtivo(2L)).thenReturn(usuario(2));
        when(seguimentos.existsBySeguidorIdAndSeguidoId(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> service.seguir(new SeguimentoRequest(1L, 2L)))
                .isInstanceOf(ConflitoException.class);
        verify(seguimentos, never()).save(any());
    }

    @Test
    void seguidoDesativadoImpedeSeguimento() {
        when(usuarioService.obterAtivo(1L)).thenReturn(usuario(1));
        when(usuarioService.obterAtivo(2L)).thenThrow(new RegraNegocioException("Usuário 2 está desativado."));

        assertThatThrownBy(() -> service.seguir(new SeguimentoRequest(1L, 2L)))
                .isInstanceOf(RegraNegocioException.class);
        verify(seguimentos, never()).save(any());
    }
}
