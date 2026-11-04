package br.fatec.arenaplus.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagem_coach")
public class MensagemCoach {
    public enum Papel { PERGUNTA, RESPOSTA }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Usuario usuario;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Papel papel;
    @Column(nullable = false, length = 2000) private String texto;
    @Column(nullable = false) private LocalDateTime data;
    protected MensagemCoach() {}
    public MensagemCoach(Usuario usuario, Papel papel, String texto) { this.usuario=usuario; this.papel=papel; this.texto=texto; this.data=LocalDateTime.now(); }
    public Long getId(){return id;} public Usuario getUsuario(){return usuario;} public Papel getPapel(){return papel;} public String getTexto(){return texto;} public LocalDateTime getData(){return data;}
}
