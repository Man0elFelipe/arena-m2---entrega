package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Conversa privada entre exatamente dois usuários. Os participantes são guardados em ordem de id
 * (usuarioA &lt; usuarioB), o que garante uma única conversa por par.
 */
@Entity
@Table(name = "conversa", uniqueConstraints = @UniqueConstraint(name = "uk_conversa_par", columnNames = {"usuario_a_id", "usuario_b_id"}))
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_a_id", nullable = false, foreignKey = @ForeignKey(name = "fk_conversa_a"))
    private Usuario usuarioA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_b_id", nullable = false, foreignKey = @ForeignKey(name = "fk_conversa_b"))
    private Usuario usuarioB;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @Column(name = "ultima_atividade", nullable = false)
    private LocalDateTime ultimaAtividade;

    @PrePersist
    void prePersist() {
        if (criadaEm == null) criadaEm = LocalDateTime.now();
        if (ultimaAtividade == null) ultimaAtividade = criadaEm;
    }

    public boolean participa(Long usuarioId) {
        return usuarioA.getId().equals(usuarioId) || usuarioB.getId().equals(usuarioId);
    }

    public Usuario outro(Long usuarioId) {
        return usuarioA.getId().equals(usuarioId) ? usuarioB : usuarioA;
    }

    public Long getId() { return id; }
    public Usuario getUsuarioA() { return usuarioA; }
    public void setUsuarioA(Usuario usuarioA) { this.usuarioA = usuarioA; }
    public Usuario getUsuarioB() { return usuarioB; }
    public void setUsuarioB(Usuario usuarioB) { this.usuarioB = usuarioB; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
    public LocalDateTime getUltimaAtividade() { return ultimaAtividade; }
    public void setUltimaAtividade(LocalDateTime ultimaAtividade) { this.ultimaAtividade = ultimaAtividade; }
}
