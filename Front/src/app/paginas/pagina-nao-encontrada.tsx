import { Link } from 'react-router-dom';
import { EstadoVazio } from '@/components/estado-vazio';
import { Button } from '@/components/ui/button';
import { useTituloDaPagina } from '@/hooks/use-titulo-da-pagina';

export function PaginaNaoEncontrada() {
  useTituloDaPagina('Página não encontrada');

  return (
    <EstadoVazio
      tamanhoMascote="grande"
      titulo="Esta página não existe"
      descricao="O endereço pode ter mudado ou o produto pode ter saído do catálogo."
      acao={
        <Button variante="primario" asChild>
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      }
    />
  );
}
