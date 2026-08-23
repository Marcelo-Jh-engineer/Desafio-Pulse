package com.api.ecommerce.controllers;

import com.api.ecommerce.dtos.ErroDto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeConflito;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeIdentidade;
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroDto> inesperada(Exception excecao) {
        LOG.error("Erro nao tratado", excecao);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErroDto.de(500, "Erro inesperado. Tente novamente."));
    }
}
