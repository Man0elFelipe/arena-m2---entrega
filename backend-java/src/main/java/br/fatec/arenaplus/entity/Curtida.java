package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Curtida de um usuário em uma publicação. Única por par (usuário, publicação). */
@Entity
@Table(name = "curtida", uniqueConstraints = @UniqueConstraint(
        name = "uk_curtida_usuario_publicacao", columnNames = {"usuario_id", "publicacao_id"}))
public class Curtida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curtida_usuario"))
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publicacao_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curtida_publicacao"))
    private Publicacao publicacao;

    @Column(name = "data_curtida", nullable = false, updatable = false)
    private LocalDateTime dataCurtida;

    @PrePersist
    void prePersist() {
        if (dataCurtida == null) dataCurtida = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Publicacao getPublicacao() { return publicacao; }
    public void setPublicacao(Publicacao publicacao) { this.publicacao = publicacao; }
    public LocalDateTime getDataCurtida() { return dataCurtida; }
    public void setDataCurtida(LocalDateTime dataCurtida) { this.dataCurtida = dataCurtida; }
}
