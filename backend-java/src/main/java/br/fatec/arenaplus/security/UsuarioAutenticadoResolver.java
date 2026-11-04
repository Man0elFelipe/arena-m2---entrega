package br.fatec.arenaplus.security;

import br.fatec.arenaplus.exception.NaoAutenticadoException;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/** Injeta o {@link UsuarioAutenticado} nos métodos de controller que o declaram como parâmetro. */
public class UsuarioAutenticadoResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return UsuarioAutenticado.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav, NativeWebRequest request,
                                  WebDataBinderFactory binderFactory) {
        Object u = request.getAttribute(AuthInterceptor.ATRIBUTO, RequestAttributes.SCOPE_REQUEST);
        if (u == null) throw new NaoAutenticadoException();
        return u;
    }
}
