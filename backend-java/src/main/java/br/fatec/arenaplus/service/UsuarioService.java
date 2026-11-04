package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.TipoPerfil;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.*;
import br.fatec.arenaplus.repository.Busca;
import br.fatec.arenaplus.repository.MembroComunidadeRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import br.fatec.arenaplus.repository.SeguimentoRepository;
import br.fatec.arenaplus.repository.UsuarioRepository;
import br.fatec.arenaplus.security.TokenService;
import br.fatec.arenaplus.security.UsuarioAutenticado;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final PublicacaoRepository publicacoes;
    private final SeguimentoRepository seguimentos;
    private final MembroComunidadeRepository membros;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;

    public UsuarioService(UsuarioRepository usuarios, PublicacaoRepository publicacoes,
                          SeguimentoRepository seguimentos, MembroComunidadeRepository membros,
                          PasswordEncoder passwordEncoder, TokenService tokens) {
        this.usuarios = usuarios;
        this.publicacoes = publicacoes;
        this.seguimentos = seguimentos;
        this.membros = membros;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
    }

    public UsuarioResponse cadastrar(UsuarioCreateRequest req) {
        String email = normalizarEmail(req.email());
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um usuário cadastrado com este email.");
        }
        Usuario u = new Usuario();
        u.setNome(req.nome().trim());
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(req.senha()));
        u.setFotoPerfilUrl(Textos.limpar(req.fotoPerfilUrl()));
        u.setBiografia(Textos.limpar(req.biografia()));
        u.setCidade(Textos.limpar(req.cidade()));
        u.setEsportePrincipal(Textos.limpar(req.esportePrincipal()));
        u.setTipoPerfil(TipoPerfil.COMUM); // administrador nunca é definido pela API pública
        u.setAtivo(true);
        return UsuarioResponse.completo(usuarios.save(u));
    }

    /** Valida email e senha e emite um token de sessão. Contas desativadas recebem a mesma resposta genérica. */
    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmailIgnoreCase(normalizarEmail(req.email()))
                .orElseThrow(CredenciaisInvalidasException::new);
        if (!Boolean.TRUE.equals(u.getAtivo()) || !passwordEncoder.matches(req.senha(), u.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }
        TokenService.TokenEmitido t = tokens.emitir(u);
        return new LoginResponse(t.token(), t.expiraEm(), UsuarioResponse.completo(u));
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> listar(String busca, String esporte, String cidade, boolean incluirInativos,
                                                  UsuarioAutenticado atual, Pageable pageable) {
        boolean inativos = incluirInativos && atual.admin(); // só admin vê contas desativadas
        return PaginaResponse.of(usuarios.buscar(Busca.normalizar(busca), Busca.normalizar(esporte),
                Busca.normalizar(cidade), inativos, pageable), u -> UsuarioResponse.para(u, atual));
    }

    /** "Encontrar parceiros": só quem consentiu (procuraParceiros) aparece. */
    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> parceiros(String modalidade, String cidade, br.fatec.arenaplus.entity.NivelExperiencia nivel,
                                                     UsuarioAutenticado atual, Pageable pageable) {
        return PaginaResponse.of(usuarios.buscarParceiros(Busca.normalizar(modalidade), Busca.normalizar(cidade),
                nivel, atual.id(), pageable), u -> UsuarioResponse.para(u, atual));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscar(Long id, UsuarioAutenticado atual) {
        return UsuarioResponse.para(obter(id), atual);
    }

    @Transactional(readOnly = true)
    public PerfilResponse perfil(Long id, UsuarioAutenticado atual) {
        Usuario u = obter(id);
        return new PerfilResponse(UsuarioResponse.para(u, atual),
                publicacoes.countByUsuarioId(id),
                seguimentos.countBySeguidoId(id),
                seguimentos.countBySeguidorId(id),
                membros.findByUsuarioIdOrderByDataEntradaDesc(id).size());
    }

    public UsuarioResponse atualizar(Long id, UsuarioUpdateRequest req, UsuarioAutenticado atual) {
        exigirDonoOuAdmin(id, atual, "Você só pode editar o seu próprio perfil.");
        Usuario u = obter(id);
        u.setNome(req.nome().trim());
        u.setFotoPerfilUrl(Textos.limpar(req.fotoPerfilUrl()));
        u.setBiografia(Textos.limpar(req.biografia()));
        u.setCidade(Textos.limpar(req.cidade()));
        u.setEsportePrincipal(Textos.limpar(req.esportePrincipal()));
        u.setModalidadesFavoritas(Textos.limpar(req.modalidadesFavoritas()));
        u.setNivelExperiencia(req.nivelExperiencia());
        u.setObjetivos(Textos.limpar(req.objetivos()));
        u.setDisponibilidade(Textos.limpar(req.disponibilidade()));
        u.setConquistas(Textos.limpar(req.conquistas()));
        if (req.procuraParceiros() != null) u.setProcuraParceiros(req.procuraParceiros());
        if (req.mostrarDisponibilidade() != null) u.setMostrarDisponibilidade(req.mostrarDisponibilidade());
        return UsuarioResponse.para(u, atual);
    }

    /** Só o próprio usuário troca a senha. As demais sessões são revogadas. */
    public void alterarSenha(Long id, AlterarSenhaRequest req, UsuarioAutenticado atual) {
        if (!atual.mesmoQue(id)) throw new AcessoNegadoException("Você só pode alterar a sua própria senha.");
        Usuario u = obter(id);
        if (!passwordEncoder.matches(req.senhaAtual(), u.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        u.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
        tokens.revogarOutras(id, atual.sessaoId());
    }

    /** Exclusão lógica: preserva publicações e relações. Revoga todas as sessões da conta. */
    public void desativar(Long id, UsuarioAutenticado atual) {
        exigirDonoOuAdmin(id, atual, "Você só pode desativar a sua própria conta.");
        obter(id).setAtivo(false);
        tokens.revogarOutras(id, null);
    }

    public UsuarioResponse reativar(Long id, UsuarioAutenticado atual) {
        if (!atual.admin()) throw new AcessoNegadoException("Apenas administradores podem reativar contas.");
        Usuario u = obter(id);
        u.setAtivo(true);
        return UsuarioResponse.para(u, atual);
    }

    public void sair(UsuarioAutenticado atual) {
        tokens.revogar(atual.sessaoId());
    }

    @Transactional(readOnly = true)
    public Usuario obter(Long id) {
        return usuarios.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    /** Usuário existente e ativo, exigido para criar conteúdo ou relações. */
    @Transactional(readOnly = true)
    public Usuario obterAtivo(Long id) {
        Usuario u = obter(id);
        if (!Boolean.TRUE.equals(u.getAtivo())) {
            throw new RegraNegocioException("Usuário " + id + " está desativado.");
        }
        return u;
    }

    private static void exigirDonoOuAdmin(Long id, UsuarioAutenticado atual, String mensagem) {
        if (!atual.mesmoQue(id) && !atual.admin()) throw new AcessoNegadoException(mensagem);
    }

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
