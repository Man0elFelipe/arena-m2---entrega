package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Metadados de uma mídia enviada. O arquivo fica em disco (diretório configurável), nunca no H2. */
@Entity
@Table(name = "midia", uniqueConstraints = @UniqueConstraint(name = "uk_midia_arquivo", columnNames = "arquivo"))
public class Midia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_midia_usuario"))
    private Usuario usuario;

    /** Nome gerado (UUID + extensão detectada pelo conteúdo). */
    @Column(nullable = false, length = 80)
    private String arquivo;

    @Column(name = "nome_original", length = 200)
    private String nomeOriginal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMidia tipo;

    @Column(name = "content_type", nullable = false, length = 60)
    private String contentType;

    @Column(name = "tamanho_bytes", nullable = false)
    private Long tamanhoBytes;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @PrePersist
    void prePersist() {
        if (criadaEm == null) criadaEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getArquivo() { return arquivo; }
    public void setArquivo(String arquivo) { this.arquivo = arquivo; }
    public String getNomeOriginal() { return nomeOriginal; }
    public void setNomeOriginal(String nomeOriginal) { this.nomeOriginal = nomeOriginal; }
    public TipoMidia getTipo() { return tipo; }
    public void setTipo(TipoMidia tipo) { this.tipo = tipo; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getTamanhoBytes() { return tamanhoBytes; }
    public void setTamanhoBytes(Long tamanhoBytes) { this.tamanhoBytes = tamanhoBytes; }
    public LocalDateTime getCriadaEm() { return criadaEm; }
}
