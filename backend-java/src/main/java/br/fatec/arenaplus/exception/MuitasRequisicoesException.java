package br.fatec.arenaplus.exception;

/** Resulta em HTTP 429: limite de requisições excedido. */
public class MuitasRequisicoesException extends RuntimeException {
    public MuitasRequisicoesException(String mensagem) {
        super(mensagem);
    }
}
