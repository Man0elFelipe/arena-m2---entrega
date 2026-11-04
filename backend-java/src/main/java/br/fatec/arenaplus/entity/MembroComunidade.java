package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Participação de um usuário em uma comunidade. Um vínculo por par (usuário, comunidade). */
@Entity
@Table(name = "membro_comunidade", uniqueConstraints = @UniqueConstraint(
        name = "uk_membro_usuario_comunidade", columnNames = {"usuario_id", "comunidade_id"}))
public class MembroComunidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, foreignKey = @ForeignKey(name = "fk_membro_usuario"))
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comunidade_id", nullable = false, foreignKey = @ForeignKey(name = "fk_membro_comunidade"))
    private Comunidade comunidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PapelMembro papel = PapelMembro.MEMBRO;

    @Column(name = "data_entrada", nullable = false, updatable = false)
    private LocalDateTime dataEntrada;

    @PrePersist
    void prePersist() {
        if (dataEntrada == null) dataEntrada = LocalDateTime.now();
        if (papel == null) papel = PapelMembro.MEMBRO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Comunidade getComunidade() { return comunidade; }
    public void setComunidade(Comunidade comunidade) { this.comunidade = comunidade; }
    public PapelMembro getPapel() { return papel; }
    public void setPapel(PapelMembro papel) { this.papel = papel; }
    public LocalDateTime getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDateTime dataEntrada) { this.dataEntrada = dataEntrada; }
}
