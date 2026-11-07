package br.fatec.arenaplus.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Limites do multipart derivados dos limites de imagem/vídeo (variáveis ARENAPLUS_UPLOAD_MAX_IMAGEM_MB e _VIDEO_MB).
 * O servidor aceita 1 MB acima do maior limite para que a validação do {@code MidiaService} (com mensagem clara por tipo)
 * apareça antes do corte genérico do contêiner.
 */
@Configuration
public class UploadConfig {

    @Bean
    public MultipartConfigElement multipartConfigElement(@Value("${arenaplus.upload.max-imagem-mb:10}") long imagemMb,
                                                         @Value("${arenaplus.upload.max-video-mb:50}") long videoMb) {
        long mb = 1024L * 1024L;
        long arquivo = (Math.max(imagemMb, videoMb) + 1) * mb;
        return new MultipartConfigElement("", arquivo, arquivo + mb, (int) mb);
    }
}
