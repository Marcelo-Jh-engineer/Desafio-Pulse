import { Link } from 'react-router-dom';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina';

/**
 * 403 — sem permissao para o recurso. **Preserva a sessao**: quem chega aqui
 * continua logado. Sessao expirada (401) e outra coisa e vai para `/login`.
 * Ver docs/prd.md secao 3.4.
 */
export function PaginaAcessoNegado() {
  useTituloDaPagina('Acesso negado');

  return (
    <EstadoVazio
      tamanhoMascote="grande"
      titulo="Você não tem acesso a esta área"
      descricao="Sua conta continua ativa, mas esta parte do sistema é restrita a outro perfil."
      acao={
        <Button variante="primario" asChild>
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      }
    />
  );
}
