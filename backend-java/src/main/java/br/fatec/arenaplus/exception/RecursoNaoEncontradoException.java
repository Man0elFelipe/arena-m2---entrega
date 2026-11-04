package br.fatec.arenaplus.exception;

/** Resulta em HTTP 404. */
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String recurso, Long id) {
        super(recurso + " com id " + id + " não encontrado(a).");
    }

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
