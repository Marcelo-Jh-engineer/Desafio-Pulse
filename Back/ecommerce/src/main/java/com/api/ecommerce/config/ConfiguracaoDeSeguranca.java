package com.api.ecommerce.config;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * A API acumula dois papeis, de proposito.
 *
 * Resource server para tudo em /api: valida o JWT que o provedor emitiu e
 * confere o papel do usuario. E intermediario do login em /api/autenticacao:
 * conduz o Authorization Code + PKCE para que o front nunca precise conhecer o
 * provedor de identidade. Separar isso em um servico proprio so faria sentido
 * com mais de um cliente para servir.
 *
 * Autorizacao de verdade acontece aqui; a checagem no front e so UX.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class ConfiguracaoDeSeguranca {

    private static final String PREFIXO_DE_PAPEL = "ROLE_";

    private final List<String> origensDoFront;

    /**
     * Lista, nao string unica: a SPA roda em duas portas conforme o modo. No
     * compose o nginx a serve na 3000; fora dele o Vite sobe na 5173. Sem as
     * duas origens registradas, um dos modos quebra no preflight.
     */
    public ConfiguracaoDeSeguranca(@Value("${app.url-do-front}") List<String> origensDoFront) {
        this.origensDoFront = origensDoFront;
    }

    @Bean
    public SecurityFilterChain cadeiaDeFiltros(HttpSecurity http, JwtAuthenticationConverter conversor)
            throws Exception {
        http
                // Stateless com Bearer token: nao ha sessao de servlet nem
                // formulario para o CSRF proteger.
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rotas -> rotas
                        .requestMatchers(HttpMethod.GET, "/api/hello").permitAll()
                        // Quem chama estas rotas ainda nao tem token — e o que
                        // elas existem para conseguir.
                        .requestMatchers("/api/autenticacao/**").permitAll()
                        // Catalogo publico por requisito (RF-CAT-*).
                        .requestMatchers(HttpMethod.GET, "/api/produtos/**", "/api/categorias/**",
                                "/api/catalogo/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Carrinho e de CLIENTE, e so dele. Sem esta linha as
                        // rotas cairiam em `anyRequest().authenticated()` e um
                        // token de ADMIN compraria — o botao escondido na tela
                        // e UX, nao autorizacao. A matriz RBAC do CLAUDE.md diz
                        // que o admin nao navega a loja, e e aqui que isso vale.
                        .requestMatchers("/api/carrinho/**").hasRole("CLIENTE")
                        // Pedido segue o carrinho: quem nao compra, nao faz
                        // checkout nem le pedido. Sem esta linha um token de
                        // ADMIN cairia em `anyRequest().authenticated()` e
                        // passaria (RNF-PED-01).
                        .requestMatchers("/api/pedidos/**").hasRole("CLIENTE")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(conversor)));
        return http.build();
    }

    /**
     * O Spring Security so le o claim `scope` e prefixa com SCOPE_. Os papeis do
     * Keycloak ficam em `realm_access.roles` e nao viram authority sozinhos —
     * sem este conversor, hasRole("ADMIN") nunca casa e a API responde 403 a
     * tudo que exige papel.
     */
    @Bean
    public JwtAuthenticationConverter conversorDeAutenticacaoJwt() {
        JwtGrantedAuthoritiesConverter conversorDeEscopos = new JwtGrantedAuthoritiesConverter();

        JwtAuthenticationConverter conversor = new JwtAuthenticationConverter();
        conversor.setPrincipalClaimName("sub");
        conversor.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> autoridades = new HashSet<>(conversorDeEscopos.convert(jwt));
            Map<String, Object> acessoDoRealm = jwt.getClaimAsMap("realm_access");
            if (acessoDoRealm != null && acessoDoRealm.get("roles") instanceof Collection<?> papeis) {
                papeis.stream()
                        .map(String::valueOf)
                        .map(papel -> new SimpleGrantedAuthority(PREFIXO_DE_PAPEL + papel))
                        .forEach(autoridades::add);
            }
            return autoridades;
        });
        return conversor;
    }

    @Bean
    public CorsConfigurationSource origensPermitidas() {
        CorsConfiguration configuracao = new CorsConfiguration();
        configuracao.setAllowedOrigins(origensDoFront);
        configuracao.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracao.setAllowedHeaders(List.of("*"));
        // Sem isto o navegador nao anexa o cookie de sessao em chamada de outra
        // origem, e a renovacao silenciosa falharia no `npm run dev`. E tambem o
        // motivo de as origens serem uma lista explicita: a especificacao proibe
        // combinar credenciais com origem curinga.
        configuracao.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", configuracao);
        return fonte;
    }
}
