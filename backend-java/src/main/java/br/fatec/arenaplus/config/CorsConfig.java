package br.fatec.arenaplus.config;

import br.fatec.arenaplus.security.AuthInterceptor;
import br.fatec.arenaplus.security.UsuarioAutenticadoResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.util.List;

/** CORS restrito, autenticação em /api/**, resolver do usuário autenticado e arquivos de mídia em /media/**. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] origens;
    private final AuthInterceptor authInterceptor;
    private final Path diretorioUpload;

    public CorsConfig(@Value("${arenaplus.cors.allowed-origins}") String[] origens, AuthInterceptor authInterceptor,
                      @Value("${arenaplus.upload.dir:./data/uploads}") String diretorioUpload) {
        this.origens = origens;
        this.authInterceptor = authInterceptor;
        this.diretorioUpload = Path.of(diretorioUpload).toAbsolutePath().normalize();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origens)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "Authorization")
                .maxAge(3600);
        registry.addMapping("/media/**").allowedOrigins(origens).allowedMethods("GET", "HEAD");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new UsuarioAutenticadoResolver());
    }

    /** Mídias enviadas ficam em disco (nunca no H2) e são servidas com suporte a Range (vídeo). */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/media/**")
                .addResourceLocations(diretorioUpload.toUri().toString().replaceAll("/?$", "/"))
                .setCacheControl(org.springframework.http.CacheControl.maxAge(java.time.Duration.ofDays(7)).cachePublic());
    }
}
