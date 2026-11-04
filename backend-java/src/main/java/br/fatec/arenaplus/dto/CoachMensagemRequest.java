package br.fatec.arenaplus.dto;
import jakarta.validation.constraints.NotBlank;
public record CoachMensagemRequest(@NotBlank String texto) {}
