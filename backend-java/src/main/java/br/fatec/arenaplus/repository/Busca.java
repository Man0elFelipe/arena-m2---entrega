package br.fatec.arenaplus.repository;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Apoio à busca sem diferenciar acentos ("volei" encontra "Vôlei").
 * O termo é normalizado em Java e as colunas são normalizadas no SQL com TRANSLATE,
 * usando as constantes abaixo via SpEL nas consultas (:#{T(...).COM_ACENTO}).
 */
public final class Busca {

    public static final String COM_ACENTO = "ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç";
    public static final String SEM_ACENTO = "AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc";

    private Busca() {
    }

    /** Remove acentos, espaços nas pontas e converte para minúsculas; texto vazio vira null. */
    public static String normalizar(String termo) {
        if (termo == null || termo.isBlank()) return null;
        String semAcento = Normalizer.normalize(termo.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT);
    }
}
