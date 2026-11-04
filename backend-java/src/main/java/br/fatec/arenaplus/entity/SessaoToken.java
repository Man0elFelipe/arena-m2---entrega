package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Sessão de login. Guarda apenas o hash SHA-256 do token (o token em si só existe no cliente),
 * então um vazamento do banco não permite reutilizar sessões.
 */
@Entity
@Table(name = "sessao_token", uniqueConstraints = @UniqueConstraint(name = "uk_sessao_token_hash", columnNames = "token_hash"))
public class SessaoToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_sessao_usuario"))
    private Usuario usuario;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(nullable = false)
    private Boolean revogada = Boolean.FALSE;

    @PrePersist
    void prePersist() {
        if (criadaEm == null) criadaEm = LocalDateTime.now();
        if (revogada == null) revogada = Boolean.FALSE;
    }

    public Long getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
    public LocalDateTime getExpiraEm() { return expiraEm; }
    public void setExpiraEm(LocalDateTime expiraEm) { this.expiraEm = expiraEm; }
    public Boolean getRevogada() { return revogada; }
    public void setRevogada(Boolean revogada) { this.revogada = revogada; }
}
