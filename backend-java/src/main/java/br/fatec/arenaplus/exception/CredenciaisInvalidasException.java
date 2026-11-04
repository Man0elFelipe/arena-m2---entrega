package br.fatec.arenaplus.exception;

/** Resulta em HTTP 401. */
public class CredenciaisInvalidasException extends RuntimeException {
    public CredenciaisInvalidasException() {
        super("Email ou senha inválidos.");
    }
}
