import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CampoFormulario } from '@/components/campo-formulario';
import { Preco } from '@/components/preco';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  esquemaCartao,
  type FormularioCartao,
} from '@/features/checkout/esquemas/checkout-esquemas';
import { apenasDigitos } from '@/lib/documento';
import { formatarPreco } from '@/lib/formato';

interface PropriedadesPagamentoCartao {
  totalEmCentavos: number;
  enviando: boolean;
  aoPagar: (dados: FormularioCartao) => void;
}

const PARCELAS_DISPONIVEIS = [1, 2, 3, 6, 12];

/**
 * Dados do cartão — RF-CHK-03.
 *
 * **Nada daqui sai do estado do formulário.** Sem store, sem storage, e a
 * chamada é mutation justamente para não virar cache indexado pelos argumentos.
 * Ao desmontar, o React Hook Form leva o estado junto.
 */
export function PagamentoCartao({
  totalEmCentavos,
  enviando,
  aoPagar,
}: PropriedadesPagamentoCartao) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormularioCartao>({
    resolver: zodResolver(esquemaCartao),
    mode: 'onBlur',
    defaultValues: {
      numeroCartao: '',
      nomeTitular: '',
      validade: '',
      cvv: '',
      parcelas: '1',
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(evento) => void handleSubmit(aoPagar)(evento)}
    >
      <fieldset className="space-y-4" disabled={enviando}>
        <legend className="sr-only">Dados do cartão</legend>

        <CampoFormulario
          id="numeroCartao"
          rotulo="Número do cartão"
          erro={errors.numeroCartao?.message}
        >
          <Input
            id="numeroCartao"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            aria-invalid={Boolean(errors.numeroCartao)}
            {...register('numeroCartao', {
              onChange: (evento: React.ChangeEvent<HTMLInputElement>) => {
                const digitos = apenasDigitos(evento.target.value).slice(0, 16);
                setValue('numeroCartao', digitos.replace(/(\d{4})(?=\d)/g, '$1 '));
              },
            })}
          />
        </CampoFormulario>

        <CampoFormulario
          id="nomeTitular"
          rotulo="Nome como está no cartão"
          erro={errors.nomeTitular?.message}
        >
          <Input
            id="nomeTitular"
            autoComplete="cc-name"
            aria-invalid={Boolean(errors.nomeTitular)}
            {...register('nomeTitular')}
          />
        </CampoFormulario>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoFormulario id="validade" rotulo="Validade" erro={errors.validade?.message}>
            <Input
              id="validade"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              maxLength={5}
              aria-invalid={Boolean(errors.validade)}
              {...register('validade', {
                onChange: (evento: React.ChangeEvent<HTMLInputElement>) => {
                  const digitos = apenasDigitos(evento.target.value).slice(0, 4);
                  setValue('validade', digitos.replace(/^(\d{2})(\d)/, '$1/$2'));
                },
              })}
            />
          </CampoFormulario>

          <CampoFormulario id="cvv" rotulo="Código de segurança" erro={errors.cvv?.message}>
            <Input
              id="cvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              placeholder="000"
              aria-invalid={Boolean(errors.cvv)}
              {...register('cvv')}
            />
          </CampoFormulario>
        </div>

        <CampoFormulario id="parcelas" rotulo="Parcelamento">
          <select
            id="parcelas"
            className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('parcelas')}
          >
            {PARCELAS_DISPONIVEIS.map((numero) => (
              <option key={numero} value={String(numero)}>
                {numero === 1
                  ? `À vista — ${formatarPreco(totalEmCentavos)}`
                  : `${numero}× de ${formatarPreco(Math.round(totalEmCentavos / numero))} sem juros`}
              </option>
            ))}
          </select>
        </CampoFormulario>
      </fieldset>

      <Button
        type="submit"
        variante="acao"
        tamanho="grande"
        className="w-full"
        disabled={enviando}
        aria-busy={enviando}
      >
        Pagar <Preco centavos={totalEmCentavos} />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento simulado. Nenhum dado de cartão é armazenado.
      </p>
    </form>
  );
}
