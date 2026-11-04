package br.fatec.arenaplus.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Converte parâmetros pagina/tamanho em Pageable com limites seguros. */
final class Paginas {

    static final int TAMANHO_MAXIMO = 50;

    private Paginas() {
    }

    static Pageable of(int pagina, int tamanho, Sort sort) {
        int p = Math.max(pagina, 0);
        int t = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO);
        return PageRequest.of(p, t, sort);
    }
}
