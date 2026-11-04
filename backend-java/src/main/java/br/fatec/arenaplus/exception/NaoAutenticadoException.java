package br.fatec.arenaplus.exception;

/** Resulta em HTTP 401: falta token válido. */
public class NaoAutenticadoException extends RuntimeException {
    public NaoAutenticadoException() {
        super("Faça login para continuar (token ausente, inválido ou expirado).");
    }
}
