package com.api.ecommerce.controllers;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.dtos.ErroDto;
import com.api.ecommerce.dtos.UsuarioDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Usuario")
public class UsuarioController {

    private final UsuarioMapper usuarioMapper;

    public UsuarioController(UsuarioMapper usuarioMapper) {
        this.usuarioMapper = usuarioMapper;
    }

    /** Quem sou eu segundo o Bearer token apresentado. Sem token, 401. */
    @GetMapping("/me")
    @Operation(summary = "Usuario do token")
    @ApiResponse(responseCode = "200", description = "Usuario autenticado")
    @ApiResponse(responseCode = "401", description = "Sem token ou token invalido",
            content = @Content(schema = @Schema(implementation = ErroDto.class)))
    public UsuarioDto eu(@AuthenticationPrincipal Jwt token) {
        return usuarioMapper.paraDto(token);
    }
}
