package com.api.ecommerce.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentacao da API.
 *
 * O esquema `bearer-jwt` existe para o Swagger UI mostrar o botao
 * **Authorize**. Sem ele, a tela nao tem onde receber o token e toda rota
 * protegida responde 401, mesmo com o login funcionando — o Swagger nao adivinha
 * que a API usa Bearer so porque o Spring Security usa.
 *
 * Declarado como requisito GLOBAL, e nao rota a rota: a maioria das rotas exige
 * token, e as publicas simplesmente ignoram o cabecalho a mais. O contrario —
 * anotar cada rota protegida — deixaria a lista desatualizada na primeira rota
 * nova que alguem esquecesse de marcar.
 */
@Configuration
public class OpenApiConfig {

    private static final String ESQUEMA_BEARER = "bearer-jwt";

    @Bean
    public OpenAPI customOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("E-commerce API")
                        .version("1.0.0")
                        .description("""
                                API do EcommerceMateus

                                **Como autenticar aqui:** chame `POST /api/autenticacao/login` \
                                com `identificador` e `senha`, copie o valor de `token` da \
                                resposta e cole no botão **Authorize** — só o token, sem a \
                                palavra `Bearer`. O access token dura 5 minutos; expirado, \
                                repita o login e cole o novo.

                                O refresh token não aparece na resposta de propósito: ele vive \
                                num cookie HttpOnly que o JavaScript não lê."""))
                .components(new Components().addSecuritySchemes(ESQUEMA_BEARER,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Access token devolvido por /api/autenticacao/login")))
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA_BEARER));
    }
}
