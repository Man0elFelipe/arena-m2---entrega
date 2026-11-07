package br.fatec.arenaplus.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="evento")
public class Evento {
 public enum Estado { ABERTO, ENCERRADO, CANCELADO }
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=80) private String modalidade;
 @Column(nullable=false,length=120) private String titulo;
 @Column(nullable=false,length=1500) private String descricao;
 @Column(nullable=false,length=100) private String cidade;
 @Column(nullable=false,length=160) private String local;
 @Column(nullable=false) private LocalDateTime dataHora;
 @Column(nullable=false) private int vagasMaximas;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Usuario organizador;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=16) private Estado estado=Estado.ABERTO;
 @Column(length=500) private String imagemUrl;
 protected Evento(){}
 public Evento(String modalidade,String titulo,String descricao,String cidade,String local,LocalDateTime dataHora,int vagasMaximas,Usuario organizador){this.modalidade=modalidade;this.titulo=titulo;this.descricao=descricao;this.cidade=cidade;this.local=local;this.dataHora=dataHora;this.vagasMaximas=vagasMaximas;this.organizador=organizador;}
 public Long getId(){return id;} public String getModalidade(){return modalidade;} public String getTitulo(){return titulo;} public String getDescricao(){return descricao;} public String getCidade(){return cidade;} public String getLocal(){return local;} public LocalDateTime getDataHora(){return dataHora;} public int getVagasMaximas(){return vagasMaximas;} public Usuario getOrganizador(){return organizador;} public String getImagemUrl(){return imagemUrl;} public void setImagemUrl(String u){imagemUrl=u;} public Estado getEstado(){return estado;} public void setEstado(Estado e){estado=e;}
}
