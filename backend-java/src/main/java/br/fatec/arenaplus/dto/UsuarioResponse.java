package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.TipoPerfil;
import br.fatec.arenaplus.entity.Usuario;

import java.time.LocalDateTime;

/** Representação pública do usuário: nunca inclui senha nem hash. */
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        String fotoPerfilUrl,
        String biografia,
        String cidade,
        String esportePrincipal,
        TipoPerfil tipoPerfil,
        Boolean ativo,
        LocalDateTime dataCadastro) {

    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getFotoPerfilUrl(), u.getBiografia(),
                u.getCidade(), u.getEsportePrincipal(), u.getTipoPerfil(), u.getAtivo(), u.getDataCadastro());
    }
}
