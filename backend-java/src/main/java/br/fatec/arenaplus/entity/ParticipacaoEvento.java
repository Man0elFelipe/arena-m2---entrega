package br.fatec.arenaplus.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="participacao_evento",uniqueConstraints=@UniqueConstraint(name="uk_evento_usuario",columnNames={"evento_id","usuario_id"}))
public class ParticipacaoEvento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Evento evento;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Usuario usuario;
 @Column(nullable=false) private LocalDateTime dataInscricao=LocalDateTime.now();
 protected ParticipacaoEvento(){} public ParticipacaoEvento(Evento e,Usuario u){evento=e;usuario=u;}
 public Long getId(){return id;} public Evento getEvento(){return evento;} public Usuario getUsuario(){return usuario;} public LocalDateTime getDataInscricao(){return dataInscricao;}
}
