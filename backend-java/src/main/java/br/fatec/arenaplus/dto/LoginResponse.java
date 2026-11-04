package br.fatec.arenaplus.dto;

import java.time.LocalDateTime;

public record LoginResponse(String token, LocalDateTime expiraEm, UsuarioResponse usuario) {
}
