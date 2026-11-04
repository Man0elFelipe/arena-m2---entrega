package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Mensagem privada dentro de uma conversa. */
@Entity
@Table(name = "mensagem", indexes = @Index(name = "idx_mensagem_conversa", columnList = "conversa_id"))
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false, foreignKey = @ForeignKey(name = "fk_mensagem_conversa"))
    private Conversa conversa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remetente_id", nullable = false, foreignKey = @ForeignKey(name = "fk_mensagem_remetente"))
    private Usuario remetente;

    @Column(nullable = false, length = 2000)
    private String texto;

    @Column(name = "enviada_em", nullable = false, updatable = false)
    private LocalDateTime enviadaEm;

    /** Lida pelo destinatário. */
    @Column(nullable = false)
    private Boolean lida = Boolean.FALSE;

    @PrePersist
    void prePersist() {
        if (enviadaEm == null) enviadaEm = LocalDateTime.now();
        if (lida == null) lida = Boolean.FALSE;
    }

    public Long getId() { return id; }
    public Conversa getConversa() { return conversa; }
    public void setConversa(Conversa conversa) { this.conversa = conversa; }
    public Usuario getRemetente() { return remetente; }
    public void setRemetente(Usuario remetente) { this.remetente = remetente; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public LocalDateTime getEnviadaEm() { return enviadaEm; }
    public Boolean getLida() { return lida; }
    public void setLida(Boolean lida) { this.lida = lida; }
}
