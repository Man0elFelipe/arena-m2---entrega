package br.fatec.arenaplus.exception;

/** Resulta em HTTP 403: autenticado, mas sem permissão para o recurso. */
public class AcessoNegadoException extends RuntimeException {
    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}
