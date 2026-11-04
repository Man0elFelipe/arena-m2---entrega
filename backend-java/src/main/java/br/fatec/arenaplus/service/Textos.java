package br.fatec.arenaplus.service;

/** Normalização de campos de texto opcionais vindos da API. */
final class Textos {

    private Textos() {
    }

    /** Remove espaços nas pontas e converte texto vazio em null. */
    static String limpar(String valor) {
        if (valor == null) return null;
        String t = valor.trim();
        return t.isEmpty() ? null : t;
    }
}
