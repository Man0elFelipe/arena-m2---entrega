package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Registro de que um usuário (seguidor) segue outro (seguido). Sem duplicidade nem auto-seguimento. */
@Entity
@Table(name = "seguimento", uniqueConstraints = @UniqueConstraint(
        name = "uk_seguimento_par", columnNames = {"seguidor_id", "seguido_id"}))
public class Seguimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seguidor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_seguimento_seguidor"))
    private Usuario seguidor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seguido_id", nullable = false, foreignKey = @ForeignKey(name = "fk_seguimento_seguido"))
    private Usuario seguido;

    @Column(name = "data_seguimento", nullable = false, updatable = false)
    private LocalDateTime dataSeguimento;

    @PrePersist
    void prePersist() {
        if (dataSeguimento == null) dataSeguimento = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getSeguidor() { return seguidor; }
    public void setSeguidor(Usuario seguidor) { this.seguidor = seguidor; }
    public Usuario getSeguido() { return seguido; }
    public void setSeguido(Usuario seguido) { this.seguido = seguido; }
    public LocalDateTime getDataSeguimento() { return dataSeguimento; }
    public void setDataSeguimento(LocalDateTime dataSeguimento) { this.dataSeguimento = dataSeguimento; }
}
