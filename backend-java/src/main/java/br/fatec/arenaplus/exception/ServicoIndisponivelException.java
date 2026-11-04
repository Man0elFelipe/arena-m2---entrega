package br.fatec.arenaplus.exception;

/** Resulta em HTTP 503: dependência externa indisponível ou não configurada. */
public class ServicoIndisponivelException extends RuntimeException {
    public ServicoIndisponivelException(String mensagem) {
        super(mensagem);
    }
}
