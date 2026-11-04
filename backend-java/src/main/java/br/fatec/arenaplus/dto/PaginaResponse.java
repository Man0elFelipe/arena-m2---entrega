package br.fatec.arenaplus.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Envelope de paginação simples e estável para o frontend. */
public record PaginaResponse<T>(
        List<T> conteudo,
        int pagina,
        int tamanho,
        long totalElementos,
        int totalPaginas,
        boolean ultima) {

    public static <E, T> PaginaResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PaginaResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(),
                page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
