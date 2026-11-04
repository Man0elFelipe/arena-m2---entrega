package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.Usuario;

/** Dados mínimos de um usuário para exibição junto de publicações, comentários etc. */
public record UsuarioResumo(Long id, String nome, String fotoPerfilUrl, String esportePrincipal) {

    public static UsuarioResumo from(Usuario u) {
        return new UsuarioResumo(u.getId(), u.getNome(), u.getFotoPerfilUrl(), u.getEsportePrincipal());
    }
}
