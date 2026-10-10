/* Virtual cards (Round 37, the owner's word). The cards side by side, swiped
   between (CardDeck); everything under them is the card showing: the four
   things you can do to it (Reveal, Freeze, Load, Rules), how much of its
   month has gone, and its own lines, newest first, each opening its
   receipt. What Beetle notices about a card is said on Activities, among
   what it notices, not here. Make another card is the page's one button,
   at its foot; loading is Load, among the four, and nowhere else.

   Reveal asks for the passcode (or the face) and shows the whole number and
   the CVV for ten seconds (the analysis after Round 21). Load puts the amount
   picker up over the page, stopping hard at what Everyday holds, then the
   passcode, the line in the day and its receipt; what is loaded is the
   card's to spend on top of its month. Held, a card turns over: its colour,
   a photo, its name and its limit are changed from its back. A card can be
   deleted, at the page's foot; what was loaded onto it comes back to
   Everyday. This page runs 12 between its blocks. */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  AmountSheet,
  Banner,
  Button,
  Card,
  Caption,
  ConfirmSheet,
  Head,
  Icon,
  Label,
  Logo,
  Meta,
  Meter,
  PageHead,
  Row,
  Screen,
  Segments,
  Sheet,
  Tap,
  Tools,
  colour,
  logoOf,
  toast,
} from '../../design';
import { TextBox } from '../../design/TextBox';
import { holdingsFor } from '../home/account';
import { balanceOf, rowFrom, useMoves } from '../home/moves';
import { PasscodeSheet, lockedFor, waitWords } from '../passcode';
import { clock } from '../../lib/clock';
import { dayName, shortDay } from '../../lib/days';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { naira } from '../../lib/format';
import { Deck } from './CardDeck';
import { useCards } from './cards';
import { LIMITS, MERCHANTS, MOST_CARDS, MOST_LIMIT, TONES, TONE_IDS, cardName, linesOf, makeCard, merchantName, standing, type CardLine, type CardTone, type VirtualCard } from './card';

type Open = null | 'load' | 'make' | 'name' | 'limit' | 'photo' | 'delete';

export function CardScreen() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { cards, ready, add, update, remove } = useCards(account?.accountNumber, !!account?.demo);
  const { moves, add: addMove } = useMoves(account?.accountNumber);
  const balance = (account ? holdingsFor(account).everyday : 0) + balanceOf(moves);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<Open>(null);
  const [amount, setAmount] = useState(0);
  /** what the passcode is for: loading the card, seeing its number, or making a new one */
  const [guard, setGuard] = useState<null | 'load' | 'reveal' | 'make'>(null);
  const [making, setMaking] = useState<{ merchant: string; limit: number; tone: CardTone } | null>(null);
  /** the card whose number and CVV are showing, for ten seconds */
  const [shown, setShown] = useState<string | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (hide.current) clearTimeout(hide.current);
    },
    [],
  );
  /* the deck stays on a card that is there: after one is deleted, the one before it */
  const at = Math.max(0, Math.min(index, cards.length - 1));
  const card: VirtualCard | undefined = cards[at];
  /* a card just made: the deck goes to it once it is in the list */
  const goTo = useRef<string | null>(null);
  useEffect(() => {
    if (!goTo.current) return;
    const i = cards.findIndex(c => c.id === goTo.current);
    if (i >= 0) {
      goTo.current = null;
      setIndex(i);
    }
  }, [cards]);

  const busy = open !== null || guard !== null;
  const startMaking = () => {
    if (cards.length >= MOST_CARDS) return toast(`${MOST_CARDS} cards is the most for now. Delete one to make another.`);
    setOpen('make');
  };
  /* the foot: Back, and the one way to another card beside it */
  useFoot({ kind: 'button', label: cards.length ? 'Make another card' : 'Make a card', leading: 'plus', onPress: startMaking, veil: busy ? 'away' : undefined });
  if (!ok || !account) return null;
  if (!ready)
    return (
      <Screen still>
        <View />
      </Screen>
    );

  const passcodeShut = () => {
    const shut = lockedFor();
    if (shut) toast(`That was three wrong tries. Give it ${waitWords(shut)} and try again.`);
    return !!shut;
  };
  const reveal = () => {
    if (!card) return;
    if (hide.current) clearTimeout(hide.current);
    if (shown === card.id) return setShown(null);
    if (passcodeShut()) return;
    setGuard('reveal');
  };
  const revealed = () => {
    setGuard(null);
    if (!card) return;
    setShown(card.id);
    hide.current = setTimeout(() => setShown(null), 10000);
  };
  const freeze = () => {
    if (!card) return;
    update(card.id, { frozen: !card.frozen });
    toast(card.frozen ? `${cardName(card)} is live again.` : `${cardName(card)} is frozen. Nothing can be charged to it.`);
  };
  const load = () => {
    if (!card) return;
    if (card.frozen) return toast('Unfreeze it first, then load it.');
    setOpen('load');
  };
  const picked = (v: number) => {
    setOpen(null);
    if (passcodeShut()) return;
    setAmount(v);
    setGuard('load');
  };
  /* the passcode landed: the line goes into the day, the card has it to spend, and its receipt opens */
  const loaded = () => {
    if (!card) return;
    const row = rowFrom(
      { name: 'Virtual card', detail: `Loaded · •••• ${card.number.slice(-4)} · ${clock()}`, amount: -amount, icon: 'card', kind: 'card', cardId: card.id },
      balance,
      17 + moves.length,
    );
    addMove(row);
    update(card.id, { loaded: card.loaded + amount });
    setGuard(null);
    router.push(`/receipt/${row.id}` as never);
  };
  const make = (choice: { merchant: string; limit: number; tone: CardTone }) => {
    setOpen(null);
    if (passcodeShut()) return;
    setMaking(choice);
    setGuard('make');
  };
  const made = () => {
    setGuard(null);
    if (!making) return;
    const fresh = makeCard(making);
    add(fresh);
    goTo.current = fresh.id;
    setMaking(null);
    toast(`Your ${cardName(fresh)} is ready. Hold it to make it yours.`);
  };
  const pickPhoto = async (c: VirtualCard) => {
    try {
      const got = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 10], quality: 0.6 });
      const uri = got.canceled ? null : got.assets?.[0]?.uri;
      if (uri) update(c.id, { photo: uri });
    } catch {
      toast('This phone would not open its photos. Try again, or pick a colour instead.');
    }
  };
  const onPhoto = (c: VirtualCard) => {
    if (c.id !== card?.id) return;
    if (c.photo) setOpen('photo');
    else void pickPhoto(c);
  };
  /* deleted: it stops, and what was loaded onto it comes back to Everyday */
  const deleted = () => {
    setOpen(null);
    if (!card) return;
    if (card.loaded > 0) {
      const row = rowFrom(
        { name: 'Virtual card', detail: `Deleted · •••• ${card.number.slice(-4)} · what was loaded came back · ${clock()}`, amount: card.loaded, icon: 'card', kind: 'in', cardId: card.id },
        balance,
        17 + moves.length,
      );
      addMove(row);
    }
    remove(card.id);
    setIndex(i => Math.max(0, i - 1));
    toast(card.loaded > 0 ? `Deleted. The ${naira(card.loaded)} loaded onto it is back in Everyday.` : 'Deleted. It cannot be used again.');
  };

  const holder = `${account.firstName} ${account.lastName}`.toUpperCase();
  const now = card ? standing(card) : null;
  const lines = card ? linesOf(card, moves, r => (r.at === undefined ? 'Today' : { today: 'Today', yesterday: 'Yesterday', earlier: shortDay(r.at) }[dayName(r.at)])) : [];
  return (
    <View style={{ flex: 1 }}>
      <Screen head={<PageHead lead title="Virtual card" sub="Made for one merchant, with its own limit" />}>
        <View style={{ gap: 12 }}>
          {card && now ? (
            <>
              <Deck
                cards={cards}
                index={at}
                onIndex={setIndex}
                holder={holder}
                shown={shown}
                onTone={(c, tone) => update(c.id, { tone, photo: undefined })}
                onPhoto={onPhoto}
                onName={c => c.id === card.id && setOpen('name')}
                onLimit={c => c.id === card.id && setOpen('limit')}
              />
              <Caption tone="tertiary" style={{ textAlign: 'center' }}>
                Hold a card to turn it over and make it yours
              </Caption>
              <Tools
                items={[
                  { glyph: 'search', label: shown === card.id ? 'Hide' : 'Reveal', onPress: reveal },
                  { glyph: 'freeze', label: card.frozen ? 'Unfreeze' : 'Freeze', tone: colour.cyan, onPress: freeze },
                  { glyph: 'plus', label: 'Load', tone: colour.good, onPress: load },
                  { glyph: 'list', label: 'Rules', onPress: () => router.push('/rules') },
                ]}
              />
              {card.frozen ? <Banner glyph="freeze" tone={colour.cyan} text="This card is frozen. Nothing can be charged to it." /> : null}
              <Card style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 12 }} testID="spent">
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Meta tone="secondary">Spent this month</Meta>
                  <Label>
                    {naira(now.spent)} of {naira(card.limit)}
                  </Label>
                </View>
                <Meter pct={now.pct} height={7} />
                <Meta tone="secondary">{naira(now.left)} left before it stops working</Meta>
              </Card>
              <View testID="card-lines">
                <Head>On this card</Head>
                {lines.length ? (
                  <View style={{ marginTop: 4 }}>
                    {lines.map(l => (
                      <LineRow key={l.id} line={l} onPress={l.receipt ? () => router.push(`/receipt/${l.receipt}` as never) : undefined} />
                    ))}
                  </View>
                ) : (
                  <Meta tone="secondary" style={{ marginTop: 8 }}>
                    Nothing yet. What it pays and what you load onto it shows here.
                  </Meta>
                )}
              </View>
              <Tap accessibilityRole="button" accessibilityLabel="Delete this card" onPress={() => setOpen('delete')} style={s.delete} testID="card-delete">
                <Icon name="close" size={16} colour={colour.alert} />
                <Label style={{ color: colour.alert }}>Delete this card</Label>
              </Tap>
            </>
          ) : (
            <View style={s.none} testID="card-none">
              <Icon name="card" size={28} colour={colour.textTertiary} />
              <Row>No card yet</Row>
              <Meta tone="secondary" style={{ textAlign: 'center' }}>
                Make one for a merchant, or for any shop online, with a limit of its own. It is free.
              </Meta>
            </View>
          )}
        </View>
      </Screen>
      {open === 'load' && card ? (
        <AmountSheet
          title="Load the card"
          sub={`From Everyday onto •••• ${card.number.slice(-4)}. It can spend what you load, on top of what its month allows.`}
          start={Math.max(0, Math.min(5_000, Math.floor(balance)))}
          max={Math.max(0, Math.floor(balance))}
          note={`Everyday has ${naira(balance)}`}
          chips={[5_000, 10_000, 20_000]}
          action={v => (v ? `Load ${naira(v)}` : 'Pick an amount')}
          onDone={picked}
          onDismiss={() => setOpen(null)}
          testID="card-amount"
        />
      ) : null}
      {open === 'limit' && card ? (
        <AmountSheet
          title="Monthly limit"
          sub={`What ${cardName(card)} may spend in a month. It has spent ${naira(standing(card).spent)} this month.`}
          start={card.limit}
          max={MOST_LIMIT}
          note={`Up to ${naira(MOST_LIMIT)}`}
          chips={[...LIMITS]}
          action={v => (v ? `Set ${naira(v)} a month` : 'Pick a limit')}
          onDone={v => {
            setOpen(null);
            update(card.id, { limit: v });
            toast(v < standing(card).spent ? 'Set. It has already spent more than that, so it stops until next month.' : `Set. It can spend ${naira(v)} a month.`);
          }}
          onDismiss={() => setOpen(null)}
          testID="card-limit"
        />
      ) : null}
      {open === 'name' && card ? (
        <NameSheet
          card={card}
          onDone={nickname => {
            setOpen(null);
            update(card.id, { nickname });
          }}
          onDismiss={() => setOpen(null)}
        />
      ) : null}
      {open === 'photo' && card ? (
        <Sheet onDismiss={() => setOpen(null)} testID="card-photo-sheet">
          <Head>The card’s photo</Head>
          <Meta tone="secondary" style={{ marginTop: 8 }}>
            Kept on this phone. Your name, the number and the mark stay on top of it.
          </Meta>
          <View style={{ gap: 8, marginTop: 20 }}>
            <Button
              label="Pick another photo"
              onPress={() => {
                setOpen(null);
                void pickPhoto(card);
              }}
            />
            <Button
              label="Take it off"
              tone="white"
              onPress={() => {
                setOpen(null);
                update(card.id, { photo: undefined });
              }}
            />
          </View>
        </Sheet>
      ) : null}
      {open === 'make' ? <MakeSheet onDone={make} onDismiss={() => setOpen(null)} /> : null}
      {open === 'delete' && card ? (
        <ConfirmSheet
          title={`Delete ${cardName(card)}?`}
          body={`It stops at once and cannot be used again.${card.loaded > 0 ? ` The ${naira(card.loaded)} loaded onto it comes back to Everyday.` : ''}`}
          action="Delete it"
          onConfirm={deleted}
          onCancel={() => setOpen(null)}
          testID="card-delete-sheet"
        />
      ) : null}
      {guard === 'load' && card ? (
        <PasscodeSheet
          amount={naira(amount)}
          name="Virtual card"
          detail={`Card •••• ${card.number.slice(-4)}`}
          glyph="card"
          rows={[
            { label: 'The card can spend', value: `${naira(amount)} more this month` },
            { label: 'Fee', value: 'Free' },
            { label: 'Leaves Everyday', value: naira(amount), strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={loaded}
          onCancel={() => setGuard(null)}
        />
      ) : null}
      {guard === 'reveal' && card ? (
        <PasscodeSheet
          amount={`•••• ${card.number.slice(-4)}`}
          name="Virtual card"
          detail="The whole number and the CVV, for ten seconds"
          glyph="card"
          verify={app.checkPasscode}
          onDone={revealed}
          onCancel={() => setGuard(null)}
        />
      ) : null}
      {guard === 'make' && making ? (
        <PasscodeSheet
          amount={naira(making.limit)}
          name="A new card"
          detail={`For ${merchantName(making.merchant)}`}
          glyph="card"
          rows={[
            { label: 'For', value: merchantName(making.merchant) },
            { label: 'Monthly limit', value: naira(making.limit) },
            { label: 'Fee', value: 'Free', strong: true },
          ]}
          verify={app.checkPasscode}
          onDone={made}
          onCancel={() => {
            setGuard(null);
            setMaking(null);
          }}
        />
      ) : null}
    </View>
  );
}

/* One of the card's lines: what it was, when, and the money, a load in green as money going onto the card. */
function LineRow({ line, onPress }: { line: CardLine; onPress?: () => void }) {
  const body = (
    <>
      {/* where it was spent: the merchant's logo (Round 38); a load keeps its plus */}
      {!line.loaded && logoOf(line.name) ? (
        <Logo name={logoOf(line.name)!} size={40} radius={12} />
      ) : (
        <View style={s.lineBox}>
          <Icon name={line.loaded ? 'plus' : 'card'} size={18} colour={colour.ink} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Row>{line.name}</Row>
        <Meta tone="secondary">{`${line.detail} · ${line.when}`}</Meta>
      </View>
      <Label style={line.amount > 0 ? { color: colour.goodText } : null}>{`${line.amount > 0 ? '+' : '−'}${naira(Math.abs(line.amount))}`}</Label>
    </>
  );
  return onPress ? (
    <Tap accessibilityRole="button" accessibilityLabel={`${line.name}, ${naira(Math.abs(line.amount))}, ${line.when}`} onPress={onPress} style={s.line} testID="card-line">
      {body}
    </Tap>
  ) : (
    <View style={s.line} testID="card-line">
      {body}
    </View>
  );
}

/* A name for the card, over the merchant's on its face: up to eighteen letters, so it fits across the top. */
function NameSheet({ card, onDone, onDismiss }: { card: VirtualCard; onDone: (nickname: string) => void; onDismiss: () => void }) {
  const [name, setName] = useState(card.nickname);
  const clean = name
    .replace(/[^A-Za-z0-9 &'.-]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart();
  return (
    <Sheet onDismiss={onDismiss} testID="card-name-sheet">
      <Head>Name the card</Head>
      <Meta tone="secondary" style={{ marginTop: 8 }}>
        It goes across its top. Your name and the number stay as the bank has them.
      </Meta>
      <View style={{ marginTop: 16 }}>
        <TextBox label="The card’s name" value={clean} onChangeText={setName} placeholder={cardName({ ...card, nickname: '' })} maxLength={18} autoFocus={Platform.OS !== 'web'} testID="card-name" />
      </View>
      <View style={{ gap: 8, marginTop: 16 }}>
        <Button label={clean.trim() ? 'Save the name' : 'Use no name'} onPress={() => onDone(clean.trim())} />
      </View>
    </Sheet>
  );
}

/* A new card: what it is for, its monthly limit, its colour; then the passcode. */
function MakeSheet({ onDone, onDismiss }: { onDone: (c: { merchant: string; limit: number; tone: CardTone }) => void; onDismiss: () => void }) {
  const [merchant, setMerchant] = useState<string>('Spotify');
  const [limit, setLimit] = useState<number>(LIMITS[1]);
  const [tone, setTone] = useState<CardTone>('clay');
  return (
    <Sheet onDismiss={onDismiss} testID="card-make">
      <Head>Make a card</Head>
      <Meta tone="secondary" style={{ marginTop: 8 }}>
        A card of its own for one merchant, or for any shop online, with its own limit. It is free.
      </Meta>
      <Caption tone="secondary" style={{ marginTop: 18 }}>
        What it is for
      </Caption>
      <View style={s.chips}>
        {MERCHANTS.map(m => (
          <Tap
            key={m || 'any'}
            accessibilityRole="button"
            accessibilityState={{ selected: merchant === m }}
            accessibilityLabel={merchantName(m)}
            onPress={() => setMerchant(m)}
            style={[s.chip, logoOf(m) ? s.chipLogo : null, merchant === m ? s.chipOn : null]}
          >
            {logoOf(m) ? <Logo name={logoOf(m)!} size={24} round /> : null}
            <Label style={merchant === m ? { color: colour.textInverse } : null}>{merchantName(m)}</Label>
          </Tap>
        ))}
      </View>
      <Caption tone="secondary" style={{ marginTop: 18, marginBottom: 8 }}>
        Monthly limit
      </Caption>
      <Segments options={LIMITS.map(l => naira(l))} value={naira(limit)} onChange={v => setLimit(LIMITS.find(l => naira(l) === v) ?? LIMITS[1])} />
      <Caption tone="secondary" style={{ marginTop: 18, marginBottom: 8 }}>
        Colour
      </Caption>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {TONE_IDS.map(id => (
          <Tap
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`${TONES[id].name} colour`}
            accessibilityState={{ selected: tone === id }}
            onPress={() => setTone(id)}
            style={[s.swatch, tone === id ? s.swatchOn : null]}
          >
            <View style={[s.swatchIn, { backgroundColor: TONES[id].colours[0] }]} />
          </Tap>
        ))}
      </View>
      <View style={{ marginTop: 20 }}>
        <Button label="Make the card" onPress={() => onDone({ merchant, limit, tone })} />
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  lineBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, marginTop: 4 },
  none: { height: 194, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colour.ruleStrong, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colour.surface2, justifyContent: 'center' },
  /* a merchant's chip: its logo at the front, 6 in from the round end */
  chipLogo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6 },
  chipOn: { backgroundColor: colour.ink },
  swatch: { width: 36, height: 36, borderRadius: 18, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colour.ink },
  swatchIn: { flex: 1, borderRadius: 14 },
});
