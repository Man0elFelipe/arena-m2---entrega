package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Conteúdo publicado no feed ou em uma comunidade (no máximo uma mídia). */
@Entity
@Table(name = "publicacao", indexes = {
        @Index(name = "idx_publicacao_usuario", columnList = "usuario_id"),
        @Index(name = "idx_publicacao_comunidade", columnList = "comunidade_id")
})
public class Publicacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_publicacao_usuario"))
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comunidade_id", foreignKey = @ForeignKey(name = "fk_publicacao_comunidade"))
    private Comunidade comunidade;

    @Column(nullable = false, length = 2000)
    private String texto;

    @Column(name = "midia_url", length = 500)
    private String midiaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_midia", length = 10)
    private TipoMidia tipoMidia;

    @Column(name = "data_publicacao", nullable = false, updatable = false)
    private LocalDateTime dataPublicacao;

    @Column(name = "data_edicao")
    private LocalDateTime dataEdicao;

    @PrePersist
    void prePersist() {
        if (dataPublicacao == null) dataPublicacao = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Comunidade getComunidade() { return comunidade; }
    public void setComunidade(Comunidade comunidade) { this.comunidade = comunidade; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getMidiaUrl() { return midiaUrl; }
    public void setMidiaUrl(String midiaUrl) { this.midiaUrl = midiaUrl; }
    public TipoMidia getTipoMidia() { return tipoMidia; }
    public void setTipoMidia(TipoMidia tipoMidia) { this.tipoMidia = tipoMidia; }
    public LocalDateTime getDataPublicacao() { return dataPublicacao; }
    public void setDataPublicacao(LocalDateTime dataPublicacao) { this.dataPublicacao = dataPublicacao; }
    public LocalDateTime getDataEdicao() { return dataEdicao; }
    public void setDataEdicao(LocalDateTime dataEdicao) { this.dataEdicao = dataEdicao; }
}
