package br.fatec.arenaplus.config;

import br.fatec.arenaplus.dto.*;
import br.fatec.arenaplus.entity.TipoPerfil;
import br.fatec.arenaplus.repository.UsuarioRepository;
import br.fatec.arenaplus.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Popula o H2 com dados de demonstração na primeira execução (banco vazio).
 * Ativo apenas com arenaplus.seed.enabled=true (perfil local).
 * Senha de todos os usuários de demonstração: arena123 (valor de teste, não usar em produção).
 */
@Component
@ConditionalOnProperty(name = "arenaplus.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    static final String SENHA_DEMO = "arena123";

    private final UsuarioRepository usuarios;
    private final UsuarioService usuarioService;
    private final ComunidadeService comunidadeService;
    private final MembroComunidadeService membroService;
    private final PublicacaoService publicacaoService;
    private final ComentarioService comentarioService;
    private final CurtidaService curtidaService;
    private final SeguimentoService seguimentoService;

    public DemoDataSeeder(UsuarioRepository usuarios, UsuarioService usuarioService,
                          ComunidadeService comunidadeService, MembroComunidadeService membroService,
                          PublicacaoService publicacaoService, ComentarioService comentarioService,
                          CurtidaService curtidaService, SeguimentoService seguimentoService) {
        this.usuarios = usuarios;
        this.usuarioService = usuarioService;
        this.comunidadeService = comunidadeService;
        this.membroService = membroService;
        this.publicacaoService = publicacaoService;
        this.comentarioService = comentarioService;
        this.curtidaService = curtidaService;
        this.seguimentoService = seguimentoService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) {
            return;
        }
        log.info("Banco vazio: criando dados de demonstração da Arena+.");

        Long admin = usuario("Equipe Arena+", "admin@arenaplus.dev", "img/logo-arena.png",
                "Conta oficial da Arena+.", "São Paulo", "Multiesportes");
        usuarios.findById(admin).ifPresent(u -> u.setTipoPerfil(TipoPerfil.ADMINISTRADOR));

        Long lucas = usuario("Lucas Andrade", "lucas@arenaplus.dev", "img/futebol-jogador.jpeg",
                "Meia-atacante em projeto social. Sonho em jogar profissionalmente.", "Guarulhos", "Futebol");
        Long marina = usuario("Marina Costa", "marina@arenaplus.dev", "img/tenis.jpeg",
                "Tenista amadora e professora de educação física.", "Campinas", "Tênis");
        Long rafael = usuario("Rafael Lima", "rafael@arenaplus.dev", "img/academia.jpeg",
                "Musculação e corrida de rua. Sempre em busca de evolução.", "São Paulo", "Musculação");
        Long bia = usuario("Beatriz Santos", "beatriz@arenaplus.dev", "img/volei.jpeg",
                "Levantadora no vôlei universitário.", "Santo André", "Vôlei");

        Long futebol = comunidade("Futebol de Várzea SP", "Jogos, peneiras e projetos sociais de futebol na Grande SP.",
                "Futebol", "img/futebol.jpeg", lucas);
        Long volei = comunidade("Vôlei Universitário", "Treinos, campeonatos e dicas para quem joga vôlei na faculdade.",
                "Vôlei", "img/volei-selecao.webp", bia);
        Long academia = comunidade("Treino de Academia", "Fichas, progressão de carga e motivação para treinar.",
                "Musculação", "img/academia.jpeg", rafael);
        comunidade("Capoeira e Cultura", "Rodas, eventos e a história da capoeira.", "Capoeira",
                "img/capoeira.webp", admin);

        membro(marina, futebol);
        membro(rafael, futebol);
        membro(lucas, academia);
        membro(marina, volei);

        Long p1 = publicacao(lucas, futebol, "Hoje teve peneira no projeto! Fiz dois gols e uma assistência. Bora!",
                "img/futebol-jogador.jpeg");
        Long p2 = publicacao(bia, volei, "Treino de levantamento concluído. Semana que vem tem final do campeonato!",
                "img/volei.jpeg");
        Long p3 = publicacao(rafael, academia, "Bati meu recorde no agachamento: 120 kg. Consistência vence talento.",
                null);
        Long p4 = publicacao(marina, null, "Aula de tênis gratuita no sábado para a comunidade. Quem chega?",
                "img/tenis.jpeg");

        comentario(marina, p1, "Que orgulho! Continua assim.");
        comentario(rafael, p1, "Craque demais!");
        comentario(lucas, p3, "Monstro! Me passa essa ficha.");
        comentario(bia, p4, "Vou levar minhas amigas!");

        curtir(marina, p1);
        curtir(rafael, p1);
        curtir(bia, p1);
        curtir(lucas, p2);
        curtir(lucas, p3);
        curtir(marina, p3);
        curtir(rafael, p4);

        seguir(marina, lucas);
        seguir(rafael, lucas);
        seguir(lucas, rafael);
        seguir(lucas, marina);
        seguir(bia, marina);
        seguir(lucas, admin);

        log.info("Dados de demonstração criados: 5 usuários, 4 comunidades, 4 publicações.");
    }

    private Long usuario(String nome, String email, String foto, String bio, String cidade, String esporte) {
        return usuarioService.cadastrar(new UsuarioCreateRequest(nome, email, SENHA_DEMO, foto, bio, cidade, esporte)).id();
    }

    private Long comunidade(String nome, String descricao, String esporte, String imagem, Long criador) {
        return comunidadeService.criar(new ComunidadeRequest(nome, descricao, esporte, imagem, criador)).id();
    }

    private void membro(Long usuario, Long comunidade) {
        membroService.entrar(new MembroComunidadeRequest(usuario, comunidade, null));
    }

    private Long publicacao(Long usuario, Long comunidade, String texto, String midia) {
        return publicacaoService.criar(new PublicacaoRequest(usuario, comunidade, texto, midia, null)).id();
    }

    private void comentario(Long usuario, Long publicacao, String texto) {
        comentarioService.comentar(new ComentarioRequest(usuario, publicacao, texto));
    }

    private void curtir(Long usuario, Long publicacao) {
        curtidaService.curtir(new CurtidaRequest(usuario, publicacao));
    }

    private void seguir(Long seguidor, Long seguido) {
        seguimentoService.seguir(new SeguimentoRequest(seguidor, seguido));
    }
}
