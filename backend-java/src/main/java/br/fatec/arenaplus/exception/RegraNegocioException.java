package br.fatec.arenaplus.exception;

/** Resulta em HTTP 400 (regra de negócio violada). */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
