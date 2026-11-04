package br.fatec.arenaplus.security;

import br.fatec.arenaplus.exception.MuitasRequisicoesException;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/** Limitador de janela fixa em memória (suficiente para uma instância única, como na demonstração). */
@Component
public class LimiteRequisicoes {

    private record Janela(long inicioMs, int contagem) {
    }

    private final ConcurrentHashMap<String, Janela> janelas = new ConcurrentHashMap<>();

    /** Registra uma tentativa; lança 429 se passar de {@code limite} dentro de {@code janelaSegundos}. */
    public void registrar(String chave, int limite, int janelaSegundos) {
        long agora = System.currentTimeMillis();
        long duracaoMs = janelaSegundos * 1000L;
        if (janelas.size() > 20_000) {
            janelas.entrySet().removeIf(e -> agora - e.getValue().inicioMs() > duracaoMs);
        }
        Janela j = janelas.merge(chave, new Janela(agora, 1),
                (atual, novo) -> agora - atual.inicioMs() >= duracaoMs ? novo : new Janela(atual.inicioMs(), atual.contagem() + 1));
        if (j.contagem() > limite) {
            long restante = Math.max(1, (j.inicioMs() + duracaoMs - agora) / 1000);
            throw new MuitasRequisicoesException("Muitas requisições. Tente novamente em " + restante + " s.");
        }
    }
}
