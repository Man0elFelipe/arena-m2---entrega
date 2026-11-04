package br.fatec.arenaplus.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
public record EventoRequest(@NotBlank @Size(max=80) String modalidade,@NotBlank @Size(max=120) String titulo,@NotBlank @Size(max=1500) String descricao,@NotBlank @Size(max=100) String cidade,@NotBlank @Size(max=160) String local,@NotNull LocalDateTime dataHora,@Min(2) @Max(500) int vagasMaximas){}
