/* What home shows for an account: its balance and its ledger. A new account
   has nothing yet. The demo account, the one the design is drawn around, has
   the day the frames show. This is the shape the real account service will
   fill; until then it is derived here. */
import type { Account } from '../../services/auth';
import type { Target } from '../../services/nigeria';
import type { IconName } from '../../icons';

export type LedgerRow = {
  id: string;
  /** the day the frames draw it on; a line moved on this phone is aged from `at` as it is shown (see lib/days) */
  day: 'today' | 'yesterday' | 'earlier';
  time: string;
  icon: IconName;
  name: string;
  detail: string;
  amount: number;
  status: 'done' | 'pending' | 'failed' | 'reversed';
  kind: 'transfer' | 'service' | 'airtime' | 'saving' | 'in' | 'bill' | 'card' | 'convert';
  /** what its receipt needs beyond the line, where the line was added on this phone */
  fee?: number;
  reference?: string;
  person?: { bank: string; number: string };
  /** the line or the meter it went to */
  target?: Target;
  /** who it went to was read off a photo */
  read?: 'photo';
  /** the dollars it moved: into the holding on a conversion, out of it where it was paid from */
  usd?: number;
  /** the goal a saving went into or came out of */
  goal?: string;
  session?: string;
  /** the balance once it had moved */
  after?: number;
  /** when it moved, where this phone moved it */
  at?: number;
  /** the line a cover from Beetle paid back, so it is paid once */
  covers?: string;
};

export type Insight = { id: string; kicker: string; body: string; action: string };

export type Holdings = {
  everyday: number;
  dollars: number;
  rate: number;
  health: number | null;
  healthMove: string;
  ledger: LedgerRow[];
  insights: Insight[];
  footer: string | null;
};

export const DEMO_LEDGER: LedgerRow[] = [
  { id: 'l01', day: 'today', time: '14:22', icon: 'wait-filled', name: 'Sarah Adeyemi', detail: 'Still on its way', amount: -20000, status: 'pending', kind: 'transfer' },
  { id: 'l02', day: 'today', time: '13:40', icon: 'alert', name: 'Chidi Okafor', detail: 'Did not go', amount: -12000, status: 'failed', kind: 'transfer' },
  { id: 'l03', day: 'today', time: '11:15', icon: 'undo-filled', name: 'Musa Danjuma', detail: 'Came back', amount: 20000, status: 'reversed', kind: 'transfer' },
  { id: 'l04', day: 'today', time: '12:00', icon: 'data', name: 'Netflix', detail: 'Monthly Subscription', amount: -3500, status: 'done', kind: 'service' },
  { id: 'l05', day: 'today', time: '10:45', icon: 'send', name: 'John Doe', detail: 'Grocery Shopping', amount: -8000, status: 'done', kind: 'transfer' },
  { id: 'l06', day: 'today', time: '09:14', icon: 'send', name: 'Sarah Adeyemi', detail: 'Flat deposit', amount: -50000, status: 'done', kind: 'transfer' },
  {
    id: 'l07',
    day: 'today',
    time: '08:02',
    icon: 'data',
    name: 'MTN',
    detail: '5GB for Mum',
    amount: -2500,
    status: 'done',
    kind: 'airtime',
    target: { kind: 'line', number: '08032144471', network: 'MTN', label: 'Mum', plan: 'mtn-5gb-30d' },
  },
  { id: 'l08', day: 'today', time: '07:55', icon: 'send', name: 'Sarah Adeyemi', detail: 'Rent part payment', amount: -20000, status: 'done', kind: 'transfer' },
  { id: 'l09', day: 'today', time: '07:30', icon: 'pot', name: 'Holiday goal', detail: 'Round ups', amount: -280, status: 'done', kind: 'saving' },
  { id: 'l10', day: 'yesterday', time: '16:40', icon: 'bank', name: 'Pagrin Limited', detail: 'August salary', amount: 640000, status: 'done', kind: 'in' },
  {
    id: 'l11',
    day: 'yesterday',
    time: '11:22',
    icon: 'power',
    name: 'Ikeja Electric',
    detail: 'Meter 4457 8891',
    amount: -8000,
    status: 'done',
    kind: 'bill',
    target: { kind: 'meter', disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', name: 'Ibrahim Musa', label: 'Home' },
  },
  { id: 'l12', day: 'yesterday', time: '09:00', icon: 'data', name: 'Netflix', detail: 'Virtual card', amount: -5200, status: 'done', kind: 'card' },
];

export const DEMO_INSIGHTS: Insight[] = [
  { id: 'topup', kicker: 'Your usual top up', body: 'You top up Ikeja Electric about every three weeks. The last one was ₦8,000.', action: 'Top up ₦8,000 now' },
  { id: 'data', kicker: 'Your data is nearly gone', body: 'Your data usually runs out about now. The same 5GB is ₦2,500.', action: 'Buy it again' },
  { id: 'changes', kicker: 'Three changes you made', body: 'They save you ₦1,800 every month. The data plan, the DStv package, and the transfer you moved off your card.', action: 'See the three' },
  { id: 'spend', kicker: 'Where your money went', body: 'You spent ₦18,900 on airtime and data last month. That is your highest month this year.', action: 'Show me what would help' },
];

export function holdingsFor(account: Account): Holdings {
  if (account.demo) {
    return {
      everyday: 595320.75,
      dollars: 412.6,
      rate: 1552,
      health: 72,
      healthMove: 'Up 4 since July',
      ledger: DEMO_LEDGER,
      insights: DEMO_INSIGHTS,
      footer: 'Your spending is ₦41,000 above this point last month.',
    };
  }
  return { everyday: 0, dollars: 0, rate: 1552, health: null, healthMove: '', ledger: [], insights: [], footer: null };
}
