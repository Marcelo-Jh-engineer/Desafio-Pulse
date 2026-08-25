package com.api.ecommerce.controllers;

import com.api.ecommerce.dtos.ErroDto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeIdentidade;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeNaoEncontrado;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Ponto unico de traducao de excecao para resposta. TODA excecao sai como
 * ErroDto — nunca stack trace, nome de classe ou mensagem interna.
 */
@RestControllerAdvice
public class ExceptionMapper {

    private static final Logger LOG = LoggerFactory.getLogger(ExceptionMapper.class);

    /** Erro de formulario: chave = nome exato do campo, para o setError do front. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroDto> validacao(MethodArgumentNotValidException excecao) {
        Map<String, String> errosPorCampo = new HashMap<>();
        for (FieldError erro : excecao.getBindingResult().getFieldErrors()) {
            errosPorCampo.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
                .body(ErroDto.de(400, "Confira os campos destacados.", errosPorCampo));
    }

    /** 401 e 403 sao coisas diferentes: sem sessao leva ao login, sem papel vai para /403. */
    @ExceptionHandler(ExcecaoDeAutenticacao.class)
    public ResponseEntity<ErroDto> semSessao(ExcecaoDeAutenticacao excecao) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErroDto.de(401, excecao.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroDto> semPermissao(AccessDeniedException excecao) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErroDto.de(403, "Voce nao tem permissao para esta acao."));
    }

    @ExceptionHandler(ExcecaoDeNaoEncontrado.class)
    public ResponseEntity<ErroDto> naoEncontrado(ExcecaoDeNaoEncontrado excecao) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErroDto.de(404, excecao.getMessage()));
    }

    /**
     * Parametro de consulta com valor que nao converte — `ordenacao=BARATO`,
     * `id=abc` onde se espera UUID.
     *
     * Sem este tratamento a excecao cairia no handler generico e viraria 500:
     * a API estaria dizendo "o erro foi meu" para um pedido que veio errado.
     * A mensagem nao repete o valor recebido, so nomeia o campo — devolver a
     * entrada crua no corpo e o comeco de um XSS refletido quando alguem
     * mostrar essa mensagem numa tela.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroDto> parametroInvalido(MethodArgumentTypeMismatchException excecao) {
        return ResponseEntity.badRequest()
                .body(ErroDto.de(400, "Valor invalido para o parametro '" + excecao.getName() + "'."));
    }

    @ExceptionHandler(ExcecaoDeConflito.class)
    public ResponseEntity<ErroDto> conflito(ExcecaoDeConflito excecao) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErroDto.de(409, excecao.getMessage(), excecao.getErrosPorCampo()));
    }

    @ExceptionHandler(ExcecaoDeIdentidade.class)
    public ResponseEntity<ErroDto> identidadeIndisponivel(ExcecaoDeIdentidade excecao) {
        // O detalhe do provedor fica no log, nunca na resposta.
        LOG.error("Falha na conversa com o provedor de identidade", excecao);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErroDto.de(502, "Servico de identidade indisponivel. Tente novamente em instantes."));
    }

    /**
     * Caminho que nao existe.
     *
     * Sem este tratamento a excecao caia no handler generico e virava 500: a
     * API dizia "o erro foi meu" para uma URL que o cliente inventou. Quem
     * varre a API le 500 como sinal de que achou algo.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroDto> rotaInexistente(NoResourceFoundException excecao) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErroDto.de(404, "Recurso nao encontrado."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroDto> inesperada(Exception excecao) {
        LOG.error("Erro nao tratado", excecao);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErroDto.de(500, "Erro inesperado. Tente novamente."));
    }
}
