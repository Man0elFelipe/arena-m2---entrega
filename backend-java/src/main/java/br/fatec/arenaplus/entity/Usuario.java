package br.fatec.arenaplus.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Pessoa cadastrada na plataforma. A senha original nunca é armazenada, apenas o hash BCrypt. */
@Entity
@Table(name = "usuario", uniqueConstraints = @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"))
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Column(name = "foto_perfil_url", length = 500)
    private String fotoPerfilUrl;

    @Column(length = 500)
    private String biografia;

    @Column(length = 100)
    private String cidade;

    @Column(name = "esporte_principal", length = 60)
    private String esportePrincipal;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_perfil", nullable = false, length = 20)
    private TipoPerfil tipoPerfil = TipoPerfil.COMUM;

    @Column(nullable = false)
    private Boolean ativo = Boolean.TRUE;

    // ----- Perfil esportivo (todos opcionais) -----
    @Column(name = "modalidades_favoritas", length = 300)
    private String modalidadesFavoritas;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_experiencia", length = 20)
    private NivelExperiencia nivelExperiencia;

    @Column(length = 500)
    private String objetivos;

    @Column(length = 300)
    private String disponibilidade;

    @Column(length = 1000)
    private String conquistas;

    /** Consentimento: só aparece em "Encontrar parceiros" quem marcar. */
    @Column(name = "procura_parceiros", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE NOT NULL")
    private Boolean procuraParceiros = Boolean.FALSE;

    /** Consentimento: a disponibilidade só é exibida a outros usuários se marcado. */
    @Column(name = "mostrar_disponibilidade", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE NOT NULL")
    private Boolean mostrarDisponibilidade = Boolean.FALSE;

    @Column(name = "data_cadastro", nullable = false, updatable = false)
    private LocalDateTime dataCadastro;

    @PrePersist
    void prePersist() {
        if (dataCadastro == null) dataCadastro = LocalDateTime.now();
        if (tipoPerfil == null) tipoPerfil = TipoPerfil.COMUM;
        if (ativo == null) ativo = Boolean.TRUE;
        if (procuraParceiros == null) procuraParceiros = Boolean.FALSE;
        if (mostrarDisponibilidade == null) mostrarDisponibilidade = Boolean.FALSE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public String getFotoPerfilUrl() { return fotoPerfilUrl; }
    public void setFotoPerfilUrl(String fotoPerfilUrl) { this.fotoPerfilUrl = fotoPerfilUrl; }
    public String getBiografia() { return biografia; }
    public void setBiografia(String biografia) { this.biografia = biografia; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getEsportePrincipal() { return esportePrincipal; }
    public void setEsportePrincipal(String esportePrincipal) { this.esportePrincipal = esportePrincipal; }
    public TipoPerfil getTipoPerfil() { return tipoPerfil; }
    public void setTipoPerfil(TipoPerfil tipoPerfil) { this.tipoPerfil = tipoPerfil; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public String getModalidadesFavoritas() { return modalidadesFavoritas; }
    public void setModalidadesFavoritas(String v) { this.modalidadesFavoritas = v; }
    public NivelExperiencia getNivelExperiencia() { return nivelExperiencia; }
    public void setNivelExperiencia(NivelExperiencia v) { this.nivelExperiencia = v; }
    public String getObjetivos() { return objetivos; }
    public void setObjetivos(String v) { this.objetivos = v; }
    public String getDisponibilidade() { return disponibilidade; }
    public void setDisponibilidade(String v) { this.disponibilidade = v; }
    public String getConquistas() { return conquistas; }
    public void setConquistas(String v) { this.conquistas = v; }
    public Boolean getProcuraParceiros() { return procuraParceiros; }
    public void setProcuraParceiros(Boolean v) { this.procuraParceiros = v; }
    public Boolean getMostrarDisponibilidade() { return mostrarDisponibilidade; }
    public void setMostrarDisponibilidade(Boolean v) { this.mostrarDisponibilidade = v; }
    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }
}
