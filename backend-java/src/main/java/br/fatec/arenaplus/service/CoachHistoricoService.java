package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.CoachMensagemResponse;
import br.fatec.arenaplus.entity.MensagemCoach;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.repository.MembroComunidadeRepository;
import br.fatec.arenaplus.repository.MensagemCoachRepository;
import br.fatec.arenaplus.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Parte transacional do Arena Coach: histórico por usuário e contexto enviado ao modelo.
 * Fica separada do {@link CoachService} para que a chamada HTTP ao provedor nunca segure uma transação aberta.
 */
@Service
@Transactional
public class CoachHistoricoService {

    /** Uma fala anterior da conversa, no formato esperado pelo provedor ("user" ou "assistant"). */
    public record Turno(String papel, String texto) {
    }

    /** O que o {@link CoachService} precisa para montar a requisição ao provedor. */
    public record Preparo(String contextoDoUsuario, List<Turno> recentes) {
    }

    private final MensagemCoachRepository mensagens;
    private final UsuarioRepository usuarios;
    private final MembroComunidadeRepository membros;

    public CoachHistoricoService(MensagemCoachRepository mensagens, UsuarioRepository usuarios, MembroComunidadeRepository membros) {
        this.mensagens = mensagens;
        this.usuarios = usuarios;
        this.membros = membros;
    }

    /** Últimas falas da conversa + resumo do perfil esportivo do próprio usuário (esporte, nível e comunidades). */
    @Transactional(readOnly = true)
    public Preparo preparar(Long usuarioId) {
        List<MensagemCoach> recentes = new ArrayList<>(mensagens.findTop12ByUsuarioIdOrderByIdDesc(usuarioId));
        Collections.reverse(recentes);
        List<Turno> turnos = recentes.stream()
                .map(m -> new Turno(m.getPapel() == MensagemCoach.Papel.PERGUNTA ? "user" : "assistant", m.getTexto()))
                .toList();
        return new Preparo(contexto(usuarioId), turnos);
    }

    /** Grava a pergunta e a resposta juntas (só chega aqui se o provedor respondeu). */
    public CoachMensagemResponse registrar(Long usuarioId, String pergunta, String resposta) {
        Usuario usuario = usuarios.getReferenceById(usuarioId);
        mensagens.save(new MensagemCoach(usuario, MensagemCoach.Papel.PERGUNTA, pergunta));
        return CoachMensagemResponse.from(mensagens.save(new MensagemCoach(usuario, MensagemCoach.Papel.RESPOSTA, resposta)));
    }

    @Transactional(readOnly = true)
    public List<CoachMensagemResponse> historico(Long usuarioId) {
        List<MensagemCoach> lista = new ArrayList<>(mensagens.findTop100ByUsuarioIdOrderByIdDesc(usuarioId));
        Collections.reverse(lista);
        return lista.stream().map(CoachMensagemResponse::from).toList();
    }

    public void limpar(Long usuarioId) {
        mensagens.deleteByUsuarioId(usuarioId);
    }

    private String contexto(Long usuarioId) {
        List<String> partes = new ArrayList<>();
        usuarios.findById(usuarioId).ifPresent(u -> {
            if (u.getEsportePrincipal() != null) partes.add("esporte principal: " + u.getEsportePrincipal());
            if (u.getNivelExperiencia() != null) partes.add("nível: " + u.getNivelExperiencia().name().toLowerCase());
        });
        String comunidades = membros.findByUsuarioIdOrderByDataEntradaDesc(usuarioId).stream()
                .limit(5).map(m -> m.getComunidade().getNome()).collect(Collectors.joining(", "));
        if (!comunidades.isBlank()) partes.add("comunidades: " + comunidades);
        return partes.isEmpty() ? "" : String.join("; ", partes);
    }
}
