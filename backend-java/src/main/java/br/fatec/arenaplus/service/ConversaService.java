package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.ConversaResponse;
import br.fatec.arenaplus.dto.MensagemRequest;
import br.fatec.arenaplus.dto.MensagemResponse;
import br.fatec.arenaplus.dto.UsuarioResumo;
import br.fatec.arenaplus.entity.Conversa;
import br.fatec.arenaplus.entity.Mensagem;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.AcessoNegadoException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.ConversaRepository;
import br.fatec.arenaplus.repository.MensagemRepository;
import br.fatec.arenaplus.security.LimiteRequisicoes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Chat privado. Regra central de privacidade: só os DOIS participantes leem ou escrevem em uma conversa;
 * qualquer outro usuário (inclusive administrador) recebe 403.
 */
@Service
@Transactional
public class ConversaService {

    private static final int ABERTURA = 100;
    private static final int ATUALIZACAO = 200;

    private final ConversaRepository conversas;
    private final MensagemRepository mensagens;
    private final UsuarioService usuarioService;
    private final LimiteRequisicoes limites;
    private final int limitePorMinuto;

    public ConversaService(ConversaRepository conversas, MensagemRepository mensagens, UsuarioService usuarioService,
                           LimiteRequisicoes limites, @Value("${arenaplus.chat.mensagens-por-minuto:60}") int limitePorMinuto) {
        this.conversas = conversas;
        this.mensagens = mensagens;
        this.usuarioService = usuarioService;
        this.limites = limites;
        this.limitePorMinuto = limitePorMinuto;
    }

    /** Devolve a conversa existente com o usuário ou cria uma nova (idempotente). */
    public ConversaResponse iniciar(Long meuId, Long outroId) {
        if (meuId.equals(outroId)) throw new RegraNegocioException("Você não pode iniciar uma conversa consigo mesmo.");
        Usuario eu = usuarioService.obterAtivo(meuId);
        Usuario outro = usuarioService.obterAtivo(outroId);
        Usuario a = eu.getId() < outro.getId() ? eu : outro;
        Usuario b = a == eu ? outro : eu;
        Conversa c = conversas.findByUsuarioAIdAndUsuarioBId(a.getId(), b.getId()).orElseGet(() -> {
            Conversa nova = new Conversa();
            nova.setUsuarioA(a);
            nova.setUsuarioB(b);
            return conversas.save(nova);
        });
        return toResponse(c, meuId);
    }

    @Transactional(readOnly = true)
    public List<ConversaResponse> listar(Long meuId) {
        return conversas.doUsuario(meuId).stream().map(c -> toResponse(c, meuId)).toList();
    }

    @Transactional(readOnly = true)
    public long totalNaoLidas(Long meuId) {
        return mensagens.totalNaoLidas(meuId);
    }

    /**
     * Mensagens da conversa em ordem cronológica. Sem {@code apos}: as últimas mensagens; com {@code apos}: só as novas.
     * Abrir a conversa marca como lidas as mensagens recebidas.
     */
    public List<MensagemResponse> mensagens(Long conversaId, Long apos, Long meuId) {
        Conversa c = obterDoParticipante(conversaId, meuId);
        mensagens.marcarComoLidas(c.getId(), meuId);
        List<Mensagem> lista;
        if (apos == null) {
            lista = new ArrayList<>(mensagens.findByConversaIdOrderByIdDesc(c.getId(), PageRequest.of(0, ABERTURA, Sort.unsorted())));
            Collections.reverse(lista);
        } else {
            lista = mensagens.findByConversaIdAndIdGreaterThanOrderByIdAsc(c.getId(), apos, PageRequest.of(0, ATUALIZACAO));
        }
        return lista.stream().map(MensagemResponse::from).toList();
    }

    public MensagemResponse enviar(Long conversaId, MensagemRequest req, Long meuId) {
        limites.registrar("msg:" + meuId, limitePorMinuto, 60);
        Conversa c = obterDoParticipante(conversaId, meuId);
        Usuario eu = usuarioService.obterAtivo(meuId);
        Usuario outro = c.outro(meuId);
        if (!Boolean.TRUE.equals(outro.getAtivo())) {
            throw new RegraNegocioException("Este usuário desativou a conta e não pode receber mensagens.");
        }
        Mensagem m = new Mensagem();
        m.setConversa(c);
        m.setRemetente(eu);
        m.setTexto(req.texto().trim());
        mensagens.save(m);
        c.setUltimaAtividade(LocalDateTime.now());
        return MensagemResponse.from(m);
    }

    private Conversa obterDoParticipante(Long conversaId, Long meuId) {
        Conversa c = conversas.findById(conversaId).orElseThrow(() -> new RecursoNaoEncontradoException("Conversa", conversaId));
        if (!c.participa(meuId)) throw new AcessoNegadoException("Você não participa desta conversa.");
        return c;
    }

    private ConversaResponse toResponse(Conversa c, Long meuId) {
        MensagemResponse ultima = mensagens.findFirstByConversaIdOrderByIdDesc(c.getId()).map(MensagemResponse::from).orElse(null);
        return new ConversaResponse(c.getId(), UsuarioResumo.from(c.outro(meuId)), ultima,
                mensagens.naoLidasNaConversa(c.getId(), meuId), c.getUltimaAtividade());
    }
}
