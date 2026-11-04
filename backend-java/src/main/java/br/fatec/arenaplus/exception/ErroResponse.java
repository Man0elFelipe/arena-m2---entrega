package br.fatec.arenaplus.exception;

import java.time.LocalDateTime;
import java.util.Map;

/** Formato padronizado de erro devolvido pela API. */
public record ErroResponse(
        LocalDateTime timestamp,
        int status,
        String erro,
        String mensagem,
        String caminho,
        Map<String, String> campos) {
}
