package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Comentário feito em uma publicação. */
@Entity
@Table(name = "comentario", indexes = @Index(name = "idx_comentario_publicacao", columnList = "publicacao_id"))
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_comentario_usuario"))
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publicacao_id", nullable = false, foreignKey = @ForeignKey(name = "fk_comentario_publicacao"))
    private Publicacao publicacao;

    @Column(nullable = false, length = 1000)
    private String texto;

    @Column(name = "data_comentario", nullable = false, updatable = false)
    private LocalDateTime dataComentario;

    @PrePersist
    void prePersist() {
        if (dataComentario == null) dataComentario = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Publicacao getPublicacao() { return publicacao; }
    public void setPublicacao(Publicacao publicacao) { this.publicacao = publicacao; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public LocalDateTime getDataComentario() { return dataComentario; }
    public void setDataComentario(LocalDateTime dataComentario) { this.dataComentario = dataComentario; }
}
