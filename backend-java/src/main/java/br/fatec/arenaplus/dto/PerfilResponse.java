package br.fatec.arenaplus.dto;

/** Perfil com estatísticas sociais do usuário. */
public record PerfilResponse(
        UsuarioResponse usuario,
        long totalPublicacoes,
        long totalSeguidores,
        long totalSeguindo,
        long totalComunidades) {
}
