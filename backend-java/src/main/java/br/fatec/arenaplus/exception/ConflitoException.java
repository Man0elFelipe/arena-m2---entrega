package br.fatec.arenaplus.exception;

/** Resulta em HTTP 409 (duplicidade). */
public class ConflitoException extends RuntimeException {
    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
