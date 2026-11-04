package br.fatec.arenaplus.dto;

import br.fatec.arenaplus.entity.NivelExperiencia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Atualização de perfil. Email, senha e tipo de perfil não são alterados por aqui. Campos esportivos são opcionais.")
public record UsuarioUpdateRequest(
        @Schema(example = "Ana Souza") @NotBlank(message = "Nome é obrigatório") @Size(max = 100) String nome,
        @Size(max = 500) String fotoPerfilUrl,
        @Schema(example = "Agora treinando para maratona!") @Size(max = 500) String biografia,
        @Schema(example = "Campinas") @Size(max = 100) String cidade,
        @Schema(example = "Corrida") @Size(max = 60) String esportePrincipal,
        @Schema(example = "Corrida, Natação, Ciclismo") @Size(max = 300) String modalidadesFavoritas,
        @Schema(example = "INTERMEDIARIO") NivelExperiencia nivelExperiencia,
        @Schema(example = "Completar minha primeira meia maratona") @Size(max = 500) String objetivos,
        @Schema(example = "Sábados de manhã e quartas à noite") @Size(max = 300) String disponibilidade,
        @Schema(example = "3º lugar na corrida de rua 2025") @Size(max = 1000) String conquistas,
        @Schema(description = "Aparecer em 'Encontrar parceiros' (consentimento). Omitido = não altera.") Boolean procuraParceiros,
        @Schema(description = "Mostrar a disponibilidade a outros usuários (consentimento). Omitido = não altera.") Boolean mostrarDisponibilidade) {
}
