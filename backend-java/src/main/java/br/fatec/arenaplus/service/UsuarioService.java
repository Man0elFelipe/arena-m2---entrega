package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.TipoPerfil;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.ConflitoException;
import br.fatec.arenaplus.exception.CredenciaisInvalidasException;
import br.fatec.arenaplus.exception.RecursoNaoEncontradoException;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.Busca;
import br.fatec.arenaplus.repository.MembroComunidadeRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import br.fatec.arenaplus.repository.SeguimentoRepository;
import br.fatec.arenaplus.repository.UsuarioRepository;
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

    public UsuarioService(UsuarioRepository usuarios, PublicacaoRepository publicacoes,
                          SeguimentoRepository seguimentos, MembroComunidadeRepository membros,
                          PasswordEncoder passwordEncoder) {
        this.usuarios = usuarios;
        this.publicacoes = publicacoes;
        this.seguimentos = seguimentos;
        this.membros = membros;
        this.passwordEncoder = passwordEncoder;
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
        u.setTipoPerfil(TipoPerfil.COMUM);
        u.setAtivo(true);
        return UsuarioResponse.from(usuarios.save(u));
    }

    /** Valida email e senha. Contas desativadas recebem a mesma resposta genérica. */
    @Transactional(readOnly = true)
    public UsuarioResponse autenticar(LoginRequest req) {
        Usuario u = usuarios.findByEmailIgnoreCase(normalizarEmail(req.email()))
                .orElseThrow(CredenciaisInvalidasException::new);
        if (!Boolean.TRUE.equals(u.getAtivo()) || !passwordEncoder.matches(req.senha(), u.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }
        return UsuarioResponse.from(u);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> listar(String busca, boolean incluirInativos, Pageable pageable) {
        return PaginaResponse.of(usuarios.buscar(Busca.normalizar(busca), incluirInativos, pageable), UsuarioResponse::from);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscar(Long id) {
        return UsuarioResponse.from(obter(id));
    }

    @Transactional(readOnly = true)
    public PerfilResponse perfil(Long id) {
        Usuario u = obter(id);
        return new PerfilResponse(UsuarioResponse.from(u),
                publicacoes.countByUsuarioId(id),
                seguimentos.countBySeguidoId(id),
                seguimentos.countBySeguidorId(id),
                membros.findByUsuarioIdOrderByDataEntradaDesc(id).size());
    }

    public UsuarioResponse atualizar(Long id, UsuarioUpdateRequest req) {
        Usuario u = obter(id);
        u.setNome(req.nome().trim());
        u.setFotoPerfilUrl(Textos.limpar(req.fotoPerfilUrl()));
        u.setBiografia(Textos.limpar(req.biografia()));
        u.setCidade(Textos.limpar(req.cidade()));
        u.setEsportePrincipal(Textos.limpar(req.esportePrincipal()));
        return UsuarioResponse.from(u);
    }

    public void alterarSenha(Long id, AlterarSenhaRequest req) {
        Usuario u = obter(id);
        if (!passwordEncoder.matches(req.senhaAtual(), u.getSenhaHash())) {
            throw new RegraNegocioException("Senha atual incorreta.");
        }
        u.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
    }

    /** Exclusão lógica: preserva publicações e relações para integridade do histórico. */
    public void desativar(Long id) {
        obter(id).setAtivo(false);
    }

    public UsuarioResponse reativar(Long id) {
        Usuario u = obter(id);
        u.setAtivo(true);
        return UsuarioResponse.from(u);
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

    private static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
