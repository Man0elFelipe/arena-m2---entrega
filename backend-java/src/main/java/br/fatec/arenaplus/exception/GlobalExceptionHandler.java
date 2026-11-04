package br.fatec.arenaplus.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> naoEncontrado(RecursoNaoEncontradoException ex, HttpServletRequest req) {
        return erro(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResponse> conflito(ConflitoException ex, HttpServletRequest req) {
        return erro(HttpStatus.CONFLICT, ex.getMessage(), req, null);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResponse> regraNegocio(RegraNegocioException ex, HttpServletRequest req) {
        return erro(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null);
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ErroResponse> credenciais(CredenciaisInvalidasException ex, HttpServletRequest req) {
        return erro(HttpStatus.UNAUTHORIZED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(NaoAutenticadoException.class)
    public ResponseEntity<ErroResponse> naoAutenticado(NaoAutenticadoException ex, HttpServletRequest req) {
        return erro(HttpStatus.UNAUTHORIZED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ErroResponse> acessoNegado(AcessoNegadoException ex, HttpServletRequest req) {
        return erro(HttpStatus.FORBIDDEN, ex.getMessage(), req, null);
    }

    @ExceptionHandler(MuitasRequisicoesException.class)
    public ResponseEntity<ErroResponse> muitasRequisicoes(MuitasRequisicoesException ex, HttpServletRequest req) {
        return erro(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ServicoIndisponivelException.class)
    public ResponseEntity<ErroResponse> indisponivel(ServicoIndisponivelException ex, HttpServletRequest req) {
        return erro(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), req, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResponse> uploadGrande(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return erro(HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo grande demais. Limite: imagens até 10 MB e vídeos até 50 MB.", req, null);
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MultipartException.class})
    public ResponseEntity<ErroResponse> multipart(Exception ex, HttpServletRequest req) {
        return erro(HttpStatus.BAD_REQUEST, "Envie o arquivo no campo 'arquivo' (multipart/form-data).", req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> campos.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        return erro(HttpStatus.BAD_REQUEST, "Dados inválidos. Verifique os campos informados.", req, campos);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErroResponse> violacao(ConstraintViolationException ex, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getConstraintViolations()
                .forEach(v -> campos.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        return erro(HttpStatus.BAD_REQUEST, "Parâmetros inválidos.", req, campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> corpoInvalido(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return erro(HttpStatus.BAD_REQUEST,
                "Corpo da requisição inválido ou mal formatado (verifique JSON e valores de enum).", req, null);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErroResponse> parametro(Exception ex, HttpServletRequest req) {
        return erro(HttpStatus.BAD_REQUEST, "Parâmetro inválido ou ausente: " + ex.getMessage(), req, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroResponse> metodo(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return erro(HttpStatus.METHOD_NOT_ALLOWED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResponse> rotaInexistente(NoResourceFoundException ex, HttpServletRequest req) {
        return erro(HttpStatus.NOT_FOUND, "Rota não encontrada.", req, null);
    }

    /** Proteção final: restrições únicas do banco (ex.: corrida entre duas requisições iguais). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> integridade(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Violação de integridade em {}: {}", req.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return erro(HttpStatus.CONFLICT, "Operação viola uma restrição de integridade (registro duplicado ou referência inválida).", req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> generico(Exception ex, HttpServletRequest req) {
        log.error("Erro inesperado em {}", req.getRequestURI(), ex);
        return erro(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado.", req, null);
    }

    private ResponseEntity<ErroResponse> erro(HttpStatus status, String mensagem, HttpServletRequest req,
                                              Map<String, String> campos) {
        ErroResponse body = new ErroResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                mensagem, req.getRequestURI(), campos == null || campos.isEmpty() ? null : campos);
        return ResponseEntity.status(status).body(body);
    }
}
