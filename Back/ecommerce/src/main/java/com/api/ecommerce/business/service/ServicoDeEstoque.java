package com.api.ecommerce.business.service;

import com.api.ecommerce.infrastructure.entities.Produto;
import com.api.ecommerce.infrastructure.exception.ExcecaoDeEstoqueInsuficiente;
import org.springframework.stereotype.Service;

/**
 *
 * Classe separada de proposito: a mesma pergunta e feita ao adicionar item no
 * carrinho, ao revalidar o carrinho no checkout e ao aprovar o pagamento. Se
 * cada um respondesse por conta propria, a regra existiria em tres lugares e
 * divergiria no dia em que um deles mudasse.
 *
 * **Isto nao reserva nada.** Responde sobre o estoque de agora, e entre esta
 * resposta e o pagamento o numero pode mudar — outra pessoa comprando ao mesmo
 * tempo. Quem decide de verdade e a baixa na aprovacao do pagamento, sob trava
 * pessimista (RepositorioDeProduto.travarParaBaixa). Aqui e para a tela avisar
 * cedo, nao para garantir.
 */
@Service
public class ServicoDeEstoque {

    /**
     * Recusa quando nao ha estoque para a quantidade pedida.
     *
     */
    public void exigirDisponibilidade(Produto produto, int quantidade) {
        if (quantidade < 1) {
            throw new IllegalArgumentException("Quantidade precisa ser pelo menos 1");
        }

        // Produto inativo nao esta "sem estoque": ele saiu de linha. Mesma
        // recusa, mensagem diferente — quem le precisa saber que nao adianta
        // voltar amanha.
        if (!produto.isAtivo()) {
            throw new ExcecaoDeEstoqueInsuficiente(
                    "Este produto não está mais disponível.", 0);
        }

        int disponivel = produto.getQuantidadeEstoque();

        if (disponivel <= 0) {
            throw new ExcecaoDeEstoqueInsuficiente(
                    "Este produto está sem estoque.", 0);
        }

        if (quantidade > disponivel) {
            throw new ExcecaoDeEstoqueInsuficiente(
                    "Erro ao adicionar ao carrinho, Sua solicitação excede o estoque disponível. Restam apenas " + disponivel + " em estoque.", disponivel);
        }
    }

    /** A mesma pergunta sem exceção, para quem so quer decidir o que exibir. */
    public boolean temDisponibilidade(Produto produto, int quantidade) {
        return produto.isAtivo()
                && quantidade >= 1
                && produto.getQuantidadeEstoque() >= quantidade;
    }
}
