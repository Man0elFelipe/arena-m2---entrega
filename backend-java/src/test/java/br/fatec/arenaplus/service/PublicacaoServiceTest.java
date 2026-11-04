package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.PublicacaoRequest;
import br.fatec.arenaplus.dto.PublicacaoResponse;
import br.fatec.arenaplus.entity.Comunidade;
import br.fatec.arenaplus.entity.Publicacao;
import br.fatec.arenaplus.entity.TipoMidia;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.ComentarioRepository;
import br.fatec.arenaplus.repository.CurtidaRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Testes unitários das regras de publicação (mídia e participação em comunidade). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PublicacaoServiceTest {

    @Mock PublicacaoRepository publicacoes;
    @Mock ComentarioRepository comentarios;
    @Mock CurtidaRepository curtidas;
    @Mock UsuarioService usuarioService;
    @Mock ComunidadeService comunidadeService;
    @Mock MembroComunidadeService membroService;
    @Mock MidiaService midiaService;
    @Mock br.fatec.arenaplus.repository.PublicacaoSalvaRepository salvos;

    @InjectMocks
    PublicacaoService service;

    @BeforeEach
    void setUp() {
        Usuario autor = new Usuario();
        autor.setId(1L);
        autor.setNome("Autor");
        when(usuarioService.obterAtivo(1L)).thenReturn(autor);
        when(publicacoes.save(any(Publicacao.class))).thenAnswer(inv -> {
            Publicacao p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });
    }

    @ParameterizedTest
    @CsvSource({
            "img/foto.jpeg, IMAGEM",
            "https://exemplo.com/video.MP4, VIDEO",
            "https://exemplo.com/clip.webm?t=3, VIDEO",
            "img/animacao.gif, IMAGEM"
    })
    void infereTipoDeMidiaPelaExtensao(String url, TipoMidia esperado) {
        PublicacaoResponse r = service.criar(1L, new PublicacaoRequest(null, "Treino", url, null));
        assertThat(r.tipoMidia()).isEqualTo(esperado);
        assertThat(r.midiaUrl()).isEqualTo(url);
    }

    @Test
    void tipoInformadoPrevaleceSobreExtensao() {
        PublicacaoResponse r = service.criar(1L, new PublicacaoRequest(null, "Treino", "midia/arquivo", TipoMidia.VIDEO));
        assertThat(r.tipoMidia()).isEqualTo(TipoMidia.VIDEO);
    }

    @Test
    void tipoMidiaSemUrlEhInvalido() {
        assertThatThrownBy(() -> service.criar(1L, new PublicacaoRequest(null, "Treino", "  ", TipoMidia.IMAGEM)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("tipoMidia");
        verify(publicacoes, never()).save(any());
    }

    @Test
    void textoEhNormalizadoESemMidiaFicaNulo() {
        PublicacaoResponse r = service.criar(1L, new PublicacaoRequest(null, "  Bom treino!  ", "", null));
        assertThat(r.texto()).isEqualTo("Bom treino!");
        assertThat(r.midiaUrl()).isNull();
        assertThat(r.tipoMidia()).isNull();
    }

    @Test
    void naoMembroNaoPublicaNaComunidade() {
        Comunidade c = new Comunidade();
        c.setId(5L);
        when(comunidadeService.obter(5L)).thenReturn(c);
        when(membroService.participa(1L, 5L)).thenReturn(false);

        assertThatThrownBy(() -> service.criar(1L, new PublicacaoRequest(5L, "Oi", null, null)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("participar");
        verify(publicacoes, never()).save(any());
    }
}
