package br.fatec.arenaplus.repository;

import br.fatec.arenaplus.entity.Midia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MidiaRepository extends JpaRepository<Midia, Long> {

    Optional<Midia> findByArquivo(String arquivo);
}
