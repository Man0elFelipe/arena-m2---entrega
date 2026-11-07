package br.fatec.arenaplus.exception;

/** Resulta em HTTP 502: o serviço externo (IA) falhou, estourou o tempo ou recusou a chamada. */
public class ProvedorIndisponivelException extends RuntimeException {
    public ProvedorIndisponivelException(String mensagem) {
        super(mensagem);
    }
}
