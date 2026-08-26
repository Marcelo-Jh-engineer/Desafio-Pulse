package com.api.ecommerce.business.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.api.ecommerce.business.mapper.UsuarioMapper;
import com.api.ecommerce.dtos.in.CadastroDtoIn;
import com.api.ecommerce.infrastructure.client.ClienteDoKeycloak;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeAutenticacao;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtDecoder;

class ServicoDeAutenticacaoTest {

    @Test
    void removeUsuarioCriadoQuandoLoginImediatoFalha() {
        ClienteDoKeycloak keycloak = mock(ClienteDoKeycloak.class);
        ServicoDeAutenticacao servico = new ServicoDeAutenticacao(
                keycloak, mock(UsuarioMapper.class), mock(JwtDecoder.class));
        CadastroDtoIn pedido = new CadastroDtoIn(
                "marcelo@exemplo.com", "marcelo@exemplo.com", "Marcelo", "Senha123");

        when(keycloak.criarUsuario(any())).thenReturn("usuario-criado");
        when(keycloak.autenticar(pedido.login(), pedido.senha()))
                .thenThrow(new ExcecaoDeAutenticacao("falhou"));

        assertThatThrownBy(() -> servico.cadastrar(pedido))
                .isInstanceOf(ExcecaoDeAutenticacao.class);
        verify(keycloak).excluirUsuario("usuario-criado");
    }
}
