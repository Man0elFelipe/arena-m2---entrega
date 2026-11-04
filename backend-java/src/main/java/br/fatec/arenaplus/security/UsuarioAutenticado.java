package br.fatec.arenaplus.security;

import br.fatec.arenaplus.entity.TipoPerfil;

/** Identidade do usuário autenticado, extraída do token no backend (nunca do corpo da requisição). */
public record UsuarioAutenticado(Long id, String nome, TipoPerfil tipoPerfil, Long sessaoId) {

    public boolean admin() {
        return tipoPerfil == TipoPerfil.ADMINISTRADOR;
    }

    public boolean mesmoQue(Long outroId) {
        return id.equals(outroId);
    }
}
