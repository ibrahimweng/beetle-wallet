/* Whose logo a line wears (Round 38): the network a top-up went to, the
   company a bill was paid to, the merchant a card or a service paid, the coin
   that came in or went out. A line between people keeps its glyph, and so do
   Beetle's own (a loan paid back, a saving, a conversion): the logo says
   which company, and those have none to say. */
import { logoOf } from '../../design/brands';
import type { LogoName } from '../../design/logos';
import type { Target } from '../../services';

type Line = {
  kind: string;
  name: string;
  icon?: string;
  target?: Target;
  coin?: { coin: string };
};

export function lineLogo(r: Line): LogoName | undefined {
  if (r.icon === 'loan') return undefined;
  if (r.target?.kind === 'line') return logoOf(r.target.network);
  if (r.target?.kind === 'meter') return logoOf(r.target.disco);
  if (r.kind === 'coin') return r.coin ? logoOf(r.coin.coin) : logoOf(r.name);
  if (r.kind === 'airtime' || r.kind === 'bill' || r.kind === 'card' || r.kind === 'service') return logoOf(r.name);
  return undefined;
}
