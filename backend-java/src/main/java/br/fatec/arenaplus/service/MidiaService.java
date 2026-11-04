package br.fatec.arenaplus.service;

import br.fatec.arenaplus.dto.MidiaResponse;
import br.fatec.arenaplus.entity.Midia;
import br.fatec.arenaplus.entity.TipoMidia;
import br.fatec.arenaplus.entity.Usuario;
import br.fatec.arenaplus.exception.RegraNegocioException;
import br.fatec.arenaplus.repository.MidiaRepository;
import br.fatec.arenaplus.repository.PublicacaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Upload de imagens (JPEG, PNG, WebP) e vídeos (MP4). O tipo é decidido pelo CONTEÚDO (assinatura do arquivo),
 * nunca pelo nome ou pelo Content-Type informado pelo cliente. Os arquivos ficam em disco; o H2 guarda só os metadados.
 */
@Service
@Transactional
public class MidiaService {

    private static final Logger log = LoggerFactory.getLogger(MidiaService.class);
    public static final String PREFIXO = "/media/";

    private record Formato(String extensao, String contentType, TipoMidia tipo) {
    }

    private final MidiaRepository midias;
    private final PublicacaoRepository publicacoes;
    private final Path diretorio;
    private final long maxImagem;
    private final long maxVideo;

    public MidiaService(MidiaRepository midias, PublicacaoRepository publicacoes,
                        @Value("${arenaplus.upload.dir:./data/uploads}") String dir,
                        @Value("${arenaplus.upload.max-imagem-mb:10}") long maxImagemMb,
                        @Value("${arenaplus.upload.max-video-mb:50}") long maxVideoMb) {
        this.midias = midias;
        this.publicacoes = publicacoes;
        this.diretorio = Path.of(dir).toAbsolutePath().normalize();
        this.maxImagem = maxImagemMb * 1024 * 1024;
        this.maxVideo = maxVideoMb * 1024 * 1024;
        try {
            Files.createDirectories(this.diretorio);
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível criar o diretório de upload " + this.diretorio, e);
        }
    }

    public MidiaResponse armazenar(MultipartFile arquivo, Usuario dono) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new RegraNegocioException("Nenhum arquivo enviado.");
        }
        Formato formato;
        try (InputStream in = arquivo.getInputStream()) {
            formato = detectar(in.readNBytes(16));
        } catch (IOException e) {
            throw new RegraNegocioException("Não foi possível ler o arquivo enviado.");
        }
        if (formato == null) {
            throw new RegraNegocioException("Formato não suportado. Envie imagens JPEG, PNG ou WebP, ou vídeos MP4.");
        }
        long limite = formato.tipo() == TipoMidia.VIDEO ? maxVideo : maxImagem;
        if (arquivo.getSize() > limite) {
            throw new RegraNegocioException("Arquivo grande demais: " + (formato.tipo() == TipoMidia.VIDEO ? "vídeos" : "imagens")
                    + " podem ter no máximo " + limite / 1024 / 1024 + " MB.");
        }
        String nome = UUID.randomUUID() + "." + formato.extensao();
        Path destino = diretorio.resolve(nome).normalize();
        if (!destino.getParent().equals(diretorio)) {
            throw new RegraNegocioException("Nome de arquivo inválido.");
        }
        try (InputStream in = arquivo.getInputStream()) {
            Files.copy(in, destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Falha ao gravar mídia", e);
            throw new RegraNegocioException("Não foi possível salvar o arquivo. Tente novamente.");
        }
        Midia m = new Midia();
        m.setUsuario(dono);
        m.setArquivo(nome);
        m.setNomeOriginal(limitar(arquivo.getOriginalFilename(), 200));
        m.setTipo(formato.tipo());
        m.setContentType(formato.contentType());
        m.setTamanhoBytes(arquivo.getSize());
        midias.save(m);
        return new MidiaResponse(m.getId(), PREFIXO + nome, m.getTipo(), m.getContentType(), m.getTamanhoBytes());
    }

    /** Se a URL aponta para mídia enviada, ela precisa existir e pertencer ao usuário. Devolve o tipo, ou null para URLs externas. */
    @Transactional(readOnly = true)
    public TipoMidia validarReferencia(String url, Long usuarioId) {
        if (url == null || !url.startsWith(PREFIXO)) return null;
        Midia m = midias.findByArquivo(url.substring(PREFIXO.length()))
                .orElseThrow(() -> new RegraNegocioException("Mídia enviada não encontrada. Faça o upload novamente."));
        if (!m.getUsuario().getId().equals(usuarioId)) {
            throw new RegraNegocioException("Esta mídia pertence a outro usuário.");
        }
        return m.getTipo();
    }

    /** Apaga arquivo e metadados se nenhuma publicação usar mais a mídia. */
    public void liberarSeOrfa(String url) {
        if (url == null || !url.startsWith(PREFIXO) || publicacoes.existsByMidiaUrl(url)) return;
        midias.findByArquivo(url.substring(PREFIXO.length())).ifPresent(m -> {
            try {
                Files.deleteIfExists(diretorio.resolve(m.getArquivo()).normalize());
            } catch (IOException e) {
                log.warn("Não foi possível apagar o arquivo {}", m.getArquivo(), e);
            }
            midias.delete(m);
        });
    }

    static Formato detectar(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return new Formato("jpg", "image/jpeg", TipoMidia.IMAGEM);
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return new Formato("png", "image/png", TipoMidia.IMAGEM);
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return new Formato("webp", "image/webp", TipoMidia.IMAGEM);
        }
        if (b.length >= 12 && b[4] == 'f' && b[5] == 't' && b[6] == 'y' && b[7] == 'p') {
            String marca = new String(b, 8, 4, java.nio.charset.StandardCharsets.ISO_8859_1);
            if (!marca.equals("qt  ")) { // QuickTime (.mov) não é MP4
                return new Formato("mp4", "video/mp4", TipoMidia.VIDEO);
            }
        }
        return null;
    }

    private static String limitar(String s, int max) {
        if (s == null) return null;
        String limpo = s.replaceAll("[\\p{Cntrl}]", "");
        return limpo.length() > max ? limpo.substring(0, max) : limpo;
    }
}
