package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Publicação salva por um usuário (coleção privada). Única por par (usuário, publicação). */
@Entity
@Table(name = "publicacao_salva", uniqueConstraints = @UniqueConstraint(
        name = "uk_salva_usuario_publicacao", columnNames = {"usuario_id", "publicacao_id"}))
public class PublicacaoSalva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_salva_usuario"))
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publicacao_id", nullable = false, foreignKey = @ForeignKey(name = "fk_salva_publicacao"))
    private Publicacao publicacao;

    @Column(name = "data_salva", nullable = false, updatable = false)
    private LocalDateTime dataSalva;

    @PrePersist
    void prePersist() {
        if (dataSalva == null) dataSalva = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Publicacao getPublicacao() { return publicacao; }
    public void setPublicacao(Publicacao publicacao) { this.publicacao = publicacao; }
    public LocalDateTime getDataSalva() { return dataSalva; }
}
