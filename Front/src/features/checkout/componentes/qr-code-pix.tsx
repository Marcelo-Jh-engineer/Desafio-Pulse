import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * QR code do Pix, renderizado como SVG.
 *
 * SVG e nao canvas de proposito: escala sem borrar, imprime junto com o
 * comprovante e nao depende de `HTMLCanvasElement`, que o jsdom nao implementa.
 *
 * O codigo embutido e o mesmo "copia e cola" mostrado abaixo do QR. Ele segue o
 * formato do padrao Pix, mas aponta para uma chave ficticia — o pagamento e
 * simulado e nao existe recebedor do outro lado.
 */
export function QrCodePix({ codigo }: { codigo: string }) {
  const [svg, definirSvg] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    QRCode.toString(codigo, {
      type: 'svg',
      margin: 1,
      // Nivel M aguenta o QR ser fotografado de um monitor.
      errorCorrectionLevel: 'M',
      color: { dark: '#0F1C29', light: '#FFFFFF' },
    })
      .then((resultado) => {
        if (ativo) definirSvg(resultado);
      })
      .catch(() => {
        // QR e o caminho conveniente; o copia e cola abaixo continua servindo.
        if (ativo) definirSvg(null);
      });

    return () => {
      ativo = false;
    };
  }, [codigo]);

  if (!svg) {
    return <Skeleton className="size-56 rounded-md" aria-label="Gerando QR code" />;
  }

  return (
    <div
      role="img"
      aria-label="QR code do Pix. Use o código copia e cola se preferir."
      className="size-56 rounded-md border border-border bg-white p-2 [&>svg]:size-full"
      // O SVG vem do gerador local a partir de um código que o próprio front
      // montou; não há conteúdo de terceiro nem entrada de usuário aqui.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
