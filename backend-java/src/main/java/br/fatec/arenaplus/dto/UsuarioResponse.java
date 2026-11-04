package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.NivelExperiencia;
import br.fatec.arenaplus.entity.TipoPerfil;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.security.UsuarioAutenticado;

import java.time.LocalDateTime;

/**
 * Representação do usuário: nunca inclui senha nem hash.
 * Email, disponibilidade (sem consentimento) e flags de privacidade só aparecem para o próprio usuário ou administrador.
 */
public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        String fotoPerfilUrl,
        String biografia,
        String cidade,
        String esportePrincipal,
        String modalidadesFavoritas,
        NivelExperiencia nivelExperiencia,
        String objetivos,
        String disponibilidade,
        String conquistas,
        Boolean procuraParceiros,
        Boolean mostrarDisponibilidade,
        TipoPerfil tipoPerfil,
        Boolean ativo,
        LocalDateTime dataCadastro) {

    /** Visão completa (dono da conta). */
    public static UsuarioResponse completo(Usuario u) {
        return montar(u, true);
    }

    /** Visão de quem está autenticado: completa para si mesmo/admin, pública para os demais. */
    public static UsuarioResponse para(Usuario u, UsuarioAutenticado atual) {
        return montar(u, atual != null && (atual.mesmoQue(u.getId()) || atual.admin()));
    }

    private static UsuarioResponse montar(Usuario u, boolean completo) {
        boolean mostraDisp = completo || Boolean.TRUE.equals(u.getMostrarDisponibilidade());
        return new UsuarioResponse(u.getId(), u.getNome(), completo ? u.getEmail() : null, u.getFotoPerfilUrl(),
                u.getBiografia(), u.getCidade(), u.getEsportePrincipal(), u.getModalidadesFavoritas(),
                u.getNivelExperiencia(), u.getObjetivos(), mostraDisp ? u.getDisponibilidade() : null,
                u.getConquistas(), completo ? u.getProcuraParceiros() : null,
                completo ? u.getMostrarDisponibilidade() : null, u.getTipoPerfil(), u.getAtivo(), u.getDataCadastro());
    }
}
