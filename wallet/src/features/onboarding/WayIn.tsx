/* The way in, as one screen.

   Nothing here navigates until home. The screen stays; what changes is
   where the coin is, the glyph above the title, the stack of finished steps
   above that, the title, the line under it, what sits beneath, and what
   waits at the bottom. A step that is done sends its
   title up into the stack — the words themselves travel, shrinking as they
   go — and the next step's title takes its place. Content arrives from below
   out of a blur and leaves upward into one; the keypad and the button rise
   and drop like a keyboard. Going back runs the same movements the other
   way.

   The coin (Round 28, the owner's word) is the welcome's, turning under the
   logo. Open an account and it rises into the room at the top of the
   steps, where the washes of colour were, and as the finished steps stack
   up under it, it moves up and makes itself smaller to give them the room.
   It is measured, not set: the room is whatever the column leaves above
   itself, so the coin follows the steps as they grow and shrink. Done, it
   comes to the middle and breathes while the account is opened, and home
   opens out from behind it (arrival.ts).

   What each stage shows is in views.tsx. This file is the choreography. */
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, Platform, Pressable, StyleProp, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { interpolateColor, runOnJS, useAnimatedReaction, useAnimatedStyle, useFrameCallback, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import {
  Body,
  Button,
  Caption,
  Title,
  Head,
  Icon,
  Keypad,
  LOOSE,
  Label,
  Meta,
  Pane,
  Pop,
  Swap,
  Tick,
  Drawing,
  Lockup,
  Scheme,
  night,
  away,
  blurred,
  font,
  keys,
  motion,
  settle,
  soft,
  standard,
  useLeave,
  useStill,
} from '../../design';
import type { IconName } from '../../icons';
import { useApp } from './store';
import { useFocused } from './useGuard';
import { initialStage, isSetupStage, isStage, rowsFor, type Row, type Stage } from './stages';
import { nextSetup, type Income } from '../setup/setup';
import { useSetup } from '../setup/store';
import { idPhoto } from '../setup/hand';
import { buildView, type Bar, type Ctx, type FaceState, type Free, type Note } from './views';
import { auth, identity, namesMatch, type Account } from '../../services';
import { shownDate } from './validation';
import { useBiometricName } from '../passcode/biometric';
import type { DocumentKind } from '../../services/identity';
import { lastHere, type Known } from './devices';
import type { Progress } from './machine';
import { LAB } from '../../lab/enabled';
import { MIDDLE, abandon, claimCoin, coin, coverUp, finish, homeIsUnder, releaseCoin } from './arrival';
import { backTop, logoTop } from './tops';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wantTour } from '../home/tour';

/* The geometry the glide is written against: a 32 glyph, 8 under it, the
   title 40 tall; the stack 20 above the band, its rows 24 tall with 16
   between, a row's label 36 in. */
const SIDE = 20;
/** the first screen's sides, the owner's frame's (Round 27) */
const WELCOME_SIDE = 24;
const GLYPH = 32;
const GLYPH_GAP = 8;
const ROW_H = 24;
const ROW_GAP = 16;
/** from the last row's words to the glyph: the row's own 8 below, and 4 */
const STACK_GAP = 12;
const ROW_INSET = 36;
/** from the title's top to the top of the row it becomes */
const ROW_DY = -(STACK_GAP + ROW_H + GLYPH + GLYPH_GAP);

/* The coin's room (Round 28). On the welcome, the owner's frame: the logo 56 from the top, the coin's room 20 under
   it and 8 above the title's band, the coin 378 across in a room 475.51 tall, smaller in a shorter one. On a step,
   from under the way back to 8 above the stack, the coin's picture no taller than the room and no wider than
   STEP_COIN; too small to read, it goes. */
const LOGO_H = 20.49;
const WELCOME_ROOM = 475.51;
const WELCOME_COIN = 378;
/** the way back's row, under which a step's room starts */
const BACK_H = 44;
const STEP_COIN = 210;
const LEAST_COIN = 72;
const ROOM_GAP = 8;
/** where the coin is wanted: nowhere, the welcome's room, a step's under the way back, a step's with nothing at the top, the middle */
type CoinMode = -1 | 0 | 1 | 2 | 3;

/** `logo` and `back` are where the logo and the way back sit on this phone (see tops.ts) */
function coinPlace(room: number, mode: CoinMode, screen: number, logo: number, back: number) {
  'worklet';
  if (mode === 3) return { cy: screen / 2, size: MIDDLE, on: 1 };
  if (mode === 0) {
    const roomTop = logo + LOGO_H + 20;
    const h = room - ROOM_GAP - roomTop;
    return { cy: roomTop + h / 2, size: Math.max(0, Math.min(WELCOME_COIN, (WELCOME_COIN * h) / WELCOME_ROOM)), on: 1 };
  }
  const top = mode === 1 ? back + BACK_H : logo;
  const h = room - ROOM_GAP - top;
  const size = Math.max(0, Math.min(STEP_COIN, h));
  return { cy: top + h / 2, size, on: size >= LEAST_COIN ? 1 : 0 };
}

type Dir = 1 | -1;
type TitleMove = 'up' | 'down' | 'plain';

export function WayIn() {
  const app = useApp();
  const router = useRouter();
  const still = useStill();
  const focused = useFocused();
  const { leaving, leave, stay } = useLeave();
  /* the lab opens the screen at a stage of its choosing; nothing else can.
     Settings and the pages that want the last limits open it at finishing
     setting up, at the first step still to answer */
  const asked = useLocalSearchParams<{ stage?: string; phone?: string; email?: string; provider?: string; setup?: string; income?: string; street?: string; area?: string }>();
  const forSetup = asked.setup === '1';
  const account = app.session?.account;
  const { setup, ready: setupReady, set: setSetup } = useSetup(account?.accountNumber, !!account?.demo);

  /* where to start is known at once when what the device knows is already read back, as it is coming from the
     opening: so the first frame is the welcome's, its logo where the opening left it */
  const [stage, setStage] = useState<Stage | null>(() => (app.ready && !forSetup && !(LAB && isStage(asked.stage)) ? initialStage(app.progress, app.session) : null));
  const [dir, setDir] = useState<Dir>(1);
  const [titleMove, setTitleMove] = useState<TitleMove>('plain');
  const [digits, setDigits] = useState('');
  const [text, setText] = useState('');
  const [text2, setText2] = useState('');
  const [first, setFirst] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wait, setWait] = useState(0);
  const [faceState, setFaceState] = useState<FaceState>('idle');
  const [unknown, setUnknown] = useState(false);
  /* logging in: the number or email the code went to, the account it is, and the account this phone last knew */
  const [contact, setContact] = useState('');
  const [who, setWho] = useState<Account | null>(null);
  const [known, setKnown] = useState<Known | null>(null);
  const [another, setAnother] = useState(false);
  const [lastNumber, setLastNumber] = useState('');
  const [provider, setProvider] = useState<'google' | 'apple'>(() => (LAB && asked.provider === 'apple' ? 'apple' : 'google'));
  const [providerFor, setProviderFor] = useState<'signup' | 'login'>('signup');
  const [docKind, setDocKind] = useState<DocumentKind>('slip');
  const [docState, setDocState] = useState<'idle' | 'checking'>('idle');
  const [free, setFree] = useState<Free>(null);
  const [passkey, setPasskey] = useState(true);
  const [rec, setRec] = useState<Ctx['rec']>({});
  /* finishing setting up: what is typed and picked on its stages */
  const [street, setStreet] = useState(() => (LAB && asked.street) || '');
  const [area, setArea] = useState(() => (LAB && asked.area) || '');
  const [idState, setIdState] = useState<'idle' | 'checking'>('idle');
  const [income, setIncome] = useState<Income | null>(() =>
    LAB && (asked.income === 'salary' || asked.income === 'business' || asked.income === 'family' || asked.income === 'else') ? asked.income : null,
  );
  const gone = useRef(false);
  const stageRef = useRef<Stage | null>(null);
  stageRef.current = stage;

  /* where to start, once what the device knows has been read back */
  useEffect(() => {
    if (!app.ready || stage !== null) return;
    if (LAB && isStage(asked.stage)) {
      /* the lab opens a stage of logging in or getting an account back with the account it is for */
      if (asked.phone) {
        setContact(asked.phone);
        void auth.findAccount(asked.phone).then(a => {
          setWho(a);
          setRec({ account: a ?? undefined, email: asked.email, changed: asked.stage === 'recovered' ? 'email' : undefined });
        });
      }
      if (asked.stage === 'finish') setText(usernameFor(app.progress));
      setStage(asked.stage);
    } else if (forSetup) {
      if (!app.session || !setupReady) return;
      setStage(nextSetup(setup));
    } else setStage(initialStage(app.progress, app.session));
  }, [app.ready, stage, app.progress, app.session, asked.stage, asked.phone, forSetup, setupReady, setup]);

  /* a session that has seen the ready screen belongs at home, unless it came
     back to finish setting up */
  useEffect(() => {
    if (app.ready && focused && app.session && !app.progress.accountNumber && !gone.current && !forSetup && !(stage && isSetupStage(stage))) router.replace('/home');
  }, [app.ready, focused, app.session, app.progress.accountNumber, router, forSetup, stage]);

  /* the photo of the ID, back from the camera: the name is the account's, the number what was read */
  useEffect(() => {
    if (!focused || stage !== 'idcard') return;
    const read = idPhoto.take();
    if (!read) return;
    const name = account ? `${account.lastName} ${account.firstName}`.toUpperCase() : read.name;
    setSetup({ id: { name, number: read.number } });
    setIdState('idle');
    go('income');
  }, [focused, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the account this phone knows, for Log in's Face ID */
  useEffect(() => {
    let live = true;
    void lastHere().then(k => live && setKnown(k));
    return () => {
      live = false;
    };
  }, [stage === 'signin']); // eslint-disable-line react-hooks/exhaustive-deps

  /* a NIN slip or a voter's card, read: the record behind it, and the details to confirm */
  const readDoc = useCallback(
    async (number?: string) => {
      setDocState('checking');
      setNote(null);
      try {
        const r = await identity.readDocument(docKind, { number });
        if (!r.found) {
          setNote({ text: 'Nothing came back for that one. Try the photo again in good light, or type the number.', tone: 'bad' });
          return;
        }
        /* the paper is held to the details typed, as a number is: somebody else's card opens nothing */
        const p = app.progress;
        if (!namesMatch(p.name ?? '', r.record) || p.dob !== r.record.born) {
          setNote({ text: 'The name or the date of birth on it is not the one you typed. Check your details, or try the other paper.', tone: 'bad' });
          return;
        }
        await app.setIdentity(r.number ?? '', r.record, docKind);
        go(!p.phone ? 'number' : p.via === 'google' || p.via === 'apple' ? 'passcode' : 'password');
      } catch {
        setNote({ text: 'The register did not answer. Try again in a moment.', tone: 'bad' });
      } finally {
        setDocState('idle');
      }
    },
    [docKind, app], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const takeDoc = useCallback(() => {
    if (Platform.OS === 'web') {
      setDocState('checking');
      setTimeout(() => void readDoc(), 900);
      return;
    }
    router.push('/id-photo?for=id');
  }, [readDoc, router]);
  /* the photo of the paper, back from the camera */
  useEffect(() => {
    if (!focused || stage !== 'document') return;
    const read = idPhoto.take();
    if (read) void readDoc(read.number.replace(/\s/g, ''));
  }, [focused, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the half minute a code is given before another can be asked for */
  useEffect(() => {
    if (!(stage === 'code' || stage === 'signcode' || stage === 'recovercode' || stage === 'newemailcode') || wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, wait]);

  const go = useCallback(
    (next: Stage, direction: Dir = 1) => {
      const cur = stageRef.current;
      const p = app.progress;
      if (cur) {
        const before = rowsFor(cur, p).length;
        const after = rowsFor(next, p).length;
        setTitleMove(after > before ? 'up' : after < before ? 'down' : 'plain');
      }
      /* the keyboard goes with the box it was for; a stage that types words brings it back */
      Keyboard.dismiss();
      setStage(next);
      setDir(direction);
      setDigits(next === 'number' && p.via === 'phone' ? (p.phone ?? '') : '');
      setText(next === 'email' && p.via === 'email' ? (p.email ?? '') : next === 'finish' ? usernameFor(p) : next === 'details' ? (p.name ?? '') : '');
      setText2(next === 'details' && p.dob ? shownDate(p.dob) : '');
      setFirst(null);
      setNote(null);
      setShake(0);
      setBusy(false);
      setUnknown(false);
      setFree(null);
      if (next === 'finish' || next === 'signface' || next === 'recoverface') setFaceState('idle');
      if (next === 'finish') setConsent(false);
    },
    [app.progress],
  );

  /* Done (Round 28): the steps leave and the coin comes to the middle and breathes; once the steps have gone, the
     dark goes over everything, the account is opened and home is put in the way in's place under it, and once the
     breath is over home opens out (arrival.ts). With motion reduced, home simply comes. A new account gets the
     tour of home once it is there. */
  const [finishing, setFinishing] = useState(false);
  /* home: back down to the app the way in was opened over (finishing setting up from home, Settings or an offer), or in
     the way in's place where it is the first screen. Replaced over the app, the app was put on twice, one whole copy
     under the other (Round 29) */
  const homeward = useCallback(() => (router.canDismiss() ? router.dismissTo('/home') : router.replace('/home')), [router]);
  const toHome = useCallback(
    (after?: () => Promise<void>, opts: { tour?: boolean } = {}) => {
      /* once: a second tap while the steps leave does nothing */
      if (gone.current) return;
      gone.current = true;
      if (still) {
        leave(async () => {
          await after?.();
          if (opts.tour) wantTour();
          homeward();
        });
        return;
      }
      setFinishing(true);
      finish();
      leave(async () => {
        coverUp();
        try {
          await after?.();
        } catch (e) {
          abandon();
          gone.current = false;
          setFinishing(false);
          stay();
          throw e;
        }
        if (opts.tour) wantTour();
        homeward();
        homeIsUnder();
      });
    },
    [leave, stay, homeward, still],
  );

  /* the ID: the camera on a phone, which hands back what it read; a moment on the web */
  const takeId = useCallback(() => {
    if (Platform.OS === 'web') {
      setIdState('checking');
      setTimeout(() => {
        idPhoto.put({ name: '', number: '1234 5678 900' });
        const name = account ? `${account.lastName} ${account.firstName}`.toUpperCase() : '';
        setSetup({ id: { name, number: '1234 5678 900' } });
        setIdState('idle');
        go('income');
      }, 900);
      return;
    }
    router.push('/id-photo?for=id');
  }, [account, go, router, setSetup]);

  /* out of setting up: back to the ready screen it came from, or to the page that opened it */
  const exit = useCallback(() => {
    if (forSetup) router.back();
    else go('ready', -1);
  }, [forSetup, go, router]);

  const keyRef = useRef<((k: string) => void) | undefined>(undefined);
  const rows = useMemo(() => (stage ? rowsFor(stage, app.progress) : []), [stage, app.progress]);
  /* while the phone's keyboard is up, the steps done and the glyph fold away, so the box and the button stay in view */
  const keyboardUp = useKeyboardUp();
  const bioName = useBiometricName();

  /* the coin: shown while the way in is, measured into the room the column leaves above itself */
  const { height: screen } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logo = logoTop(insets.top);
  const back = backTop(insets.top);
  const room = useSharedValue(0);
  const mode = useSharedValue<CoinMode>(-1);
  useEffect(() => {
    claimCoin();
    return releaseCoin;
  }, []);
  const roomFor = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (Math.abs(h - room.value) >= 0.5) room.value = h;
    },
    [room],
  );
  /* with motion reduced the coin is simply where it should be */
  const snap = still ? 1 : 0;
  /* where it is going, and how quickly it closes on it. The room moves smoothly as the column's pieces grow and
     shrink, measured afresh on every frame of it; the coin follows on the animation thread, closing a share of the
     distance each frame, rather than starting a new glide on every measure, which left it trailing and trembling on
     the phone (Round 29) */
  const target = useSharedValue({ cy: 0, size: 0, on: -1 });
  /** how long the coin takes to close most of the way: a little over a third of it every tenth of a second */
  const LAG = 0.11;
  useAnimatedReaction(
    () => ({ room: room.value, mode: mode.value }),
    now => {
      if (now.mode < 0) {
        if (target.value.on !== 0) coin.on.value = withTiming(0, { duration: snap === 1 ? 0 : motion.leave });
        target.value = { ...target.value, on: 0 };
        return;
      }
      if (now.room <= 0) return;
      const to = coinPlace(now.room, now.mode, screen, logo, back);
      if (coin.placed.value === 0 || snap === 1) {
        coin.cy.value = to.cy;
        coin.size.value = to.size;
        coin.on.value = snap === 1 ? to.on : withDelay(160, withTiming(to.on, { duration: motion.enter, easing: settle }));
        coin.placed.value = 1;
        target.value = to;
        return;
      }
      if (to.on !== target.value.on) coin.on.value = withTiming(to.on, { duration: motion.leave });
      /* to the middle, done: a glide of its own, which carries on after the way in has gone from under it */
      if (now.mode === 3 && (to.cy !== target.value.cy || to.size !== target.value.size)) {
        const glide = { duration: 640, easing: settle };
        coin.cy.value = withTiming(to.cy, glide);
        coin.size.value = withTiming(to.size, glide);
      }
      target.value = to;
    },
    [screen, snap, logo, back],
  );
  useFrameCallback(frame => {
    if (coin.placed.value === 0 || snap === 1 || mode.value === 3) return;
    const k = 1 - Math.exp(-(frame.timeSincePreviousFrame ?? 16) / 1000 / LAG);
    const to = target.value;
    const dy = to.cy - coin.cy.value;
    const ds = to.size - coin.size.value;
    if (Math.abs(dy) > 0.05) coin.cy.value += dy * k;
    else if (dy !== 0) coin.cy.value = to.cy;
    if (Math.abs(ds) > 0.05) coin.size.value += ds * k;
    else if (ds !== 0) coin.size.value = to.size;
  });

  /* the phone's own back is the step's way back, as the chevron is; with none, it leaves as it would; while going home,
     it waits (Round 29: it closed the app from any step) */
  const backRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (!focused) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gone.current) return true;
      const back = backRef.current;
      if (!back) return false;
      back();
      return true;
    });
    return () => sub.remove();
  }, [focused]);

  if (!stage)
    return (
      <Scheme value="dark">
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: night.ground }} />
      </Scheme>
    );

  const ctx: Ctx = {
    stage,
    app,
    still,
    digits,
    setDigits,
    text,
    setText,
    text2,
    setText2,
    first,
    setFirst,
    consent,
    setConsent,
    openLegal: doc => router.push(`/legal?doc=${doc}`),
    bioName,
    keyboardUp,
    note,
    setNote,
    busy,
    setBusy,
    shake,
    bump: () => setShake(s => s + 1),
    wrong,
    setWrong,
    wait,
    setWait,
    faceState,
    setFaceState,
    unknown,
    setUnknown,
    contact,
    setContact,
    who,
    setWho,
    known,
    another,
    setAnother,
    lastNumber,
    setLastNumber,
    provider,
    setProvider,
    providerFor,
    setProviderFor,
    docKind,
    setDocKind,
    docState,
    takeDoc,
    free,
    setFree,
    passkey,
    setPasskey,
    rec,
    setRec,
    setup,
    setSetup,
    street,
    setStreet,
    area,
    setArea,
    idState,
    takeId,
    income,
    setIncome,
    exit,
    go,
    toHome,
  };
  const view = buildView(ctx);
  keyRef.current = view.keypad;
  backRef.current = view.back ?? view.bar?.back;
  const bottomKind = view.keypad ? 'keypad' : view.welcome ? 'welcome' : view.bar ? 'bar' : 'none';

  /* the way in is on the brand's very dark brown (Round 27): the first screen to the owner's frame, every step after
     it the same dark, its words, glyphs, buttons and keys taking the dark's colours from the scheme. The dark is the
     screen's own, under the pane, so the pane fades to it and never to the page behind */
  const side = bottomKind === 'welcome' ? WELCOME_SIDE : SIDE;
  /* the way back is at the bottom left since Round 30 (the owner's word), so only the demo's hint keeps a row at the top */
  const coinMode: CoinMode = !focused ? -1 : finishing ? 3 : stage === 'welcome' ? 0 : view.hint ? 1 : 2;
  return (
    <Scheme value="dark">
      <StatusBar style="light" />
      <CoinWanted value={coinMode} mode={mode} />
      <View style={{ flex: 1, backgroundColor: night.ground }}>
        <Pane leaving={leaving} style={{ flex: 1 }}>
          {/* the brand's wing, faint in the logo's tan, across the top corner of every step after the welcome, which is the
            owner's frame and has the coin (Round 26, 27); behind everything, outside the layout */}
          {stage === 'welcome' ? null : <Drawing name="wing" width={250} opacity={0.2} tint={night.lockup} turn={-8} style={{ top: -28, right: -64 }} />}
          <Hint text={view.hint} top={back} />
          {/* the column and what waits at the bottom ride up together over the keyboard where a step types (the
            address): the keyboard never covers the button. The avoiding view's own padding is the keyboard's alone:
            on the phone it replaces any padding given to it (Round 29: every step sat 12 lower than the frames on
            an iPhone, and the welcome's line ran into its button), so the column's own is on the column */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} enabled={!!view.words || stage === 'address'}>
            {/* the column ends where the frames end it: on the dock's top, 12 above
            the keypad's first row and the bar's block alike, and 36 above the
            welcome's two ways in. The 12 between the band and what sits under
            it belongs to the body, so a stage with nothing there adds nothing.
            What it leaves above itself is the coin's room */}
            <View style={{ flex: 1, paddingHorizontal: side, justifyContent: 'flex-end', paddingBottom: bottomKind === 'welcome' ? 24 : 12 }}>
              <View style={{ flex: 1 }} onLayout={roomFor} pointerEvents="none" testID="coin-room" />
              <Fold open={!(keyboardUp && (view.words || stage === 'address'))}>
                <Stack rows={rows} above={view.above} aboveKey={view.above ? stage : 'none'} dir={dir} />
              </Fold>
              <HeadBand
                folded={keyboardUp && (!!view.words || stage === 'address')}
                icon={view.icon}
                iconSize={view.iconSize}
                tint={view.tint}
                title={view.title}
                small={!!view.small}
                inline={!!view.inline}
                subBody={!!view.subBody}
                sub={view.sub}
                stage={stage}
                move={titleMove}
                dir={dir}
              />
              <Slot id={view.bodyKey} from={dir * 24} to={dir * -24}>
                {view.body ? <View style={{ paddingTop: STACK_GAP }}>{view.body}</View> : null}
              </Slot>
            </View>
            <Slot id={`bottom:${bottomKind}`} from={120} to={120} delay={120} spring>
              {bottomKind === 'keypad' ? (
                <View style={{ paddingHorizontal: SIDE, opacity: busy ? 0.5 : 1 }}>
                  {/* Back is the pad's own bottom left key (Round 30: every Back at the bottom left) */}
                  <Keypad onKey={k => keyRef.current?.(k)} onBack={view.back} />
                  {/* the frames give the pad 16 below its last row; the row's own cell holds 4 of it */}
                  <View style={{ height: 20 }} />
                </View>
              ) : bottomKind === 'bar' && view.bar ? (
                <BarBlock bar={view.bar.back || !view.back ? view.bar : { ...view.bar, back: view.back }} />
              ) : bottomKind === 'welcome' ? (
                /* the two ways in as two buttons (Round 30, the owner's word): Sign up in white, Log in under it on the
                   dark's own panel, 8 between, the frame's 24 below */
                <View style={{ paddingHorizontal: WELCOME_SIDE, paddingBottom: 24, gap: 8 }}>
                  <Button label="Sign up" tone="white" onPress={() => go('number')} />
                  <Button label="Log in" tone="grey" onPress={() => go('signin')} />
                </View>
              ) : null}
            </Slot>
          </KeyboardAvoidingView>
        </Pane>
        {/* the welcome's logo, where the opening left it: outside the pane, so it is there from the first frame */}
        <WelcomeLogo on={stage === 'welcome'} top={logo} />
      </View>
    </Scheme>
  );
}

/** A username to start from: the name off the record, as one word. */
function usernameFor(p: Progress): string {
  const r = p.identity?.record;
  return r
    ? `${r.firstName}${r.lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20)
    : '';
}

/* Whether the phone's keyboard is up. Asked of the phone itself: the web's keyboard is the computer's. */
function useKeyboardUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return up;
}

/* What folds away while the keyboard is up: drawn at its own height, and squeezed to none, fading, with the keyboard
   (Round 30: on a phone the steps done and the glyph pushed the box being typed into up off the screen). */
function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  const still = useStill();
  const t = useSharedValue(open ? 1 : 0);
  const h = useSharedValue(-1);
  useEffect(() => {
    t.value = still ? (open ? 1 : 0) : withTiming(open ? 1 : 0, { duration: motion.enter, easing: settle });
  }, [open, still, t]);
  /* open, it is its own height again ('auto', said outright: a height left off is kept on the phone, not undone) */
  const folding = useAnimatedStyle(() => (t.value >= 1 || h.value < 0 ? { opacity: 1, height: 'auto', overflow: 'visible' } : { height: h.value * t.value, opacity: t.value, overflow: 'hidden' }));
  return (
    <Animated.View style={folding}>
      <View
        onLayout={e => {
          h.value = e.nativeEvent.layout.height;
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/* Where the coin is wanted, handed to the reaction that moves it. */
function CoinWanted({ value, mode }: { value: CoinMode; mode: { value: CoinMode } }) {
  useEffect(() => {
    mode.value = value;
  }, [value, mode]);
  return null;
}

/* The logo and its name at the top of the welcome (the owner's frame, 56 from the top). Leaving the welcome it
   goes up into a blur, and comes back the same way. */
function WelcomeLogo({ on, top }: { on: boolean; top: number }) {
  const still = useStill();
  const t = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    t.value = withTiming(on ? 1 : 0, { duration: still ? 0 : on ? motion.enter : motion.leave, easing: on ? settle : away });
  }, [on, still, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * -16 }], ...blurred((1 - t.value) * motion.blur) }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center' }, style]}>
      <Lockup />
    </Animated.View>
  );
}

/* A line for the demo build, at the top where the frames keep nothing but
   the way back: which digits this build lets through. */
function Hint({ text, top }: { text?: string; top: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, left: 60, right: 60, height: 44, justifyContent: 'center', zIndex: 2 }}>
      <Swap value={text ?? ''}>
        {shown =>
          shown ? (
            <Caption tone="tertiary" style={{ textAlign: 'center' }}>
              {shown}
            </Caption>
          ) : null
        }
      </Swap>
    </View>
  );
}

/* ---- the stack above the title ---- */

type Shown = { row: Row; mode: 'still' | 'in' | 'out' };

/* The steps done so far, one row each, and on the welcome the logo and the
   coin instead. A row arrives as its title glides up into it and leaves as the
   title glides back down. */
function Stack({ rows, above, aboveKey, dir }: { rows: Row[]; above: ReactNode; aboveKey: string; dir: Dir }) {
  const [shown, setShown] = useState<Shown[]>(() => rows.map(row => ({ row, mode: 'still' })));
  useEffect(() => {
    setShown(current => {
      const alive = current.filter(r => r.mode !== 'out');
      const have = alive.map(r => r.row.label).join('|');
      const want = rows.map(r => r.label).join('|');
      if (have === want) return current;
      const last = rows[rows.length - 1];
      const keep = alive.map(r => ({ ...r, mode: 'still' as const }));
      if (
        last &&
        rows.length === alive.length + 1 &&
        rows
          .slice(0, -1)
          .map(r => r.label)
          .join('|') === have
      )
        return [...keep, { row: last, mode: 'in' }];
      const going = alive[alive.length - 1];
      if (
        going &&
        alive.length === rows.length + 1 &&
        alive
          .slice(0, -1)
          .map(r => r.row.label)
          .join('|') === want
      )
        return [...keep.slice(0, -1), { ...going, mode: 'out' }];
      return rows.map(row => ({ row, mode: 'still' as const }));
    });
  }, [rows]);
  const drop = useCallback((label: string) => setShown(current => current.filter(r => !(r.mode === 'out' && r.row.label === label))), []);
  return (
    <View>
      <Slot id={aboveKey} from={dir * 24} to={dir * -24}>
        {above}
      </Slot>
      {shown.map(r => (
        <StackRow key={r.row.label} row={r.row} mode={r.mode} onGone={() => drop(r.row.label)} />
      ))}
    </View>
  );
}

function StackRow({ row, mode, onGone }: { row: Row; mode: Shown['mode']; onGone: () => void }) {
  const still = useStill();
  const t = useSharedValue(mode === 'in' && !still ? 0 : 1);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (mode === 'in' && !still) t.value = withTiming(1, { duration: motion.enter, easing: settle });
    if (mode === 'out')
      t.value = withTiming(0, { duration: still ? 0 : motion.enter, easing: settle }, finished => {
        if (finished) runOnJS(gone.current)();
      });
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const sizing = useAnimatedStyle(() => ({ height: (ROW_H + ROW_GAP) * t.value }));
  /* the words are the ghost's until it lands; the row's own take over at the end */
  const showing = useAnimatedStyle(() => ({ opacity: mode === 'still' ? 1 : Math.max(0, Math.min(1, (t.value - 0.84) / 0.16)) }));
  return (
    <Animated.View style={[{ overflow: 'hidden', justifyContent: 'flex-end' }, sizing]}>
      <Animated.View style={[{ height: ROW_H + ROW_GAP, paddingTop: ROW_GAP, flexDirection: 'row', alignItems: 'center', gap: 12 }, showing]}>
        {mode === 'in' ? (
          <Pop delay={Math.round(motion.enter * 0.84)}>
            <Icon name={row.icon} size={24} />
          </Pop>
        ) : (
          <Icon name={row.icon} size={24} />
        )}
        <Body tone="tertiary">{row.label}</Body>
      </Animated.View>
    </Animated.View>
  );
}

/* ---- the head band: glyph, title, line ---- */

function HeadBand({
  folded = false,
  icon,
  iconSize = GLYPH,
  tint,
  title,
  small,
  inline,
  subBody,
  sub,
  stage,
  move,
  dir,
}: {
  /** the keyboard is up: the glyph folds away */
  folded?: boolean;
  icon: IconName | 'tick' | 'none';
  /** the welcome's mark is 40 where every other glyph is 32 */
  iconSize?: number;
  tint?: string;
  title: string;
  small: boolean;
  /** the ready screen: the tick beside the title, the line indented under it */
  inline: boolean;
  /** the welcome's line is 16 on 24 where the others are 14 on 20 */
  subBody: boolean;
  sub: string;
  stage: Stage;
  move: TitleMove;
  dir: Dir;
}) {
  /* the welcome's line runs 6 past the column (Round 29): in the column's width its second line had less than a point
     to spare, and on a phone it wrapped to four; at 351 it has seven, and the first line still breaks where the
     frame breaks it, before "something." */
  const line = (shown: string) =>
    subBody ? (
      <Body tone="secondary" style={{ marginRight: -6 }}>
        {shown}
      </Body>
    ) : (
      <Meta tone="secondary">{shown}</Meta>
    );
  if (inline)
    return (
      <View style={{ gap: 4, marginTop: STACK_GAP }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Tick on size={22} />
          <View style={{ flex: 1 }}>
            <TitleTrack title={title} small={small} stage={stage} move={move} dir={dir} />
          </View>
        </View>
        <View style={{ marginLeft: 34 }}>
          <Swap value={sub}>{line}</Swap>
        </View>
      </View>
    );
  return (
    <View style={{ gap: GLYPH_GAP, marginTop: STACK_GAP }}>
      {icon === 'none' ? null : (
        <Fold open={!folded}>
          <Glyph icon={icon} tint={tint} size={iconSize} />
        </Fold>
      )}
      <TitleTrack title={title} small={small} stage={stage} move={move} dir={dir} />
      <Swap value={sub}>{line}</Swap>
    </View>
  );
}

/* The glyph above the title. A new one lands a beat after the old has gone. */
type GlyphLayer = { key: string; icon: IconName | 'tick'; tint?: string; out: boolean };
function Glyph({ icon, tint, size = GLYPH }: { icon: IconName | 'tick'; tint?: string; size?: number }) {
  const key = `${icon}|${tint ?? ''}|${size}`;
  const [layers, setLayers] = useState<GlyphLayer[]>(() => [{ key, icon, tint, out: false }]);
  useEffect(() => {
    setLayers(current => {
      const live = current.find(l => !l.out);
      if (live && live.key === key) return current;
      return [...current.filter(l => !l.out).map(l => ({ ...l, out: true })), { key, icon, tint, out: false }];
    });
  }, [key, icon, tint]);
  const drop = useCallback((k: string) => setLayers(current => current.filter(l => !(l.out && l.key === k))), []);
  return (
    <View style={{ width: size, height: size }}>
      {layers.map(l => (
        <GlyphLayerView key={l.key} layer={l} size={size} onGone={() => drop(l.key)} />
      ))}
    </View>
  );
}

function GlyphLayerView({ layer, size, onGone }: { layer: GlyphLayer; size: number; onGone: () => void }) {
  const still = useStill();
  const t = useSharedValue(1);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    if (!layer.out) return;
    t.value = withTiming(0, { duration: still ? 0 : motion.leave, easing: away }, finished => {
      if (finished) runOnJS(gone.current)();
    });
  }, [layer.out]); // eslint-disable-line react-hooks/exhaustive-deps
  const fading = useAnimatedStyle(() => ({ opacity: t.value, ...blurred((1 - t.value) * 4) }));
  const glyph = layer.icon === 'tick' ? <Tick on size={size} /> : <Icon name={layer.icon} size={size} colour={layer.tint} />;
  return <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, fading]}>{layer.out ? glyph : <Pop>{glyph}</Pop>}</Animated.View>;
}

/* The title, and where it goes when the stage changes. Up: it glides into
   the stack, shrinking from 32 to 16 and greying, while the new title
   arrives from below. Down: the row's words glide back into the title's
   place. Plain: the old leaves upward into a blur and the new arrives from
   below. A title that changes within a stage swaps in place. */
type Ghost = { text: string; kind: 'up' | 'down' | 'plain' | 'swap'; dir: Dir; key: number; /** the title it was is the small one, and leaves at its own size */ small: boolean };
function TitleTrack({ title, small, stage, move, dir }: { title: string; small: boolean; stage: Stage; move: TitleMove; dir: Dir }) {
  const still = useStill();
  const [shown, setShown] = useState({ title, stage, small });
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [waiting, setWaiting] = useState(false);
  if (title !== shown.title) {
    const kind: Ghost['kind'] = stage === shown.stage ? 'swap' : move;
    if (!still) {
      setGhost({ text: kind === 'down' ? title : shown.title, kind, dir, key: Date.now(), small: kind === 'down' ? small : shown.small });
      setWaiting(kind === 'down');
    }
    setShown({ title, stage, small });
  }
  const landed = useCallback(() => {
    setGhost(null);
    setWaiting(false);
  }, []);
  return (
    <View style={{ minHeight: small ? 24 : 40 }}>
      <TitleText key={`${shown.stage}:${shown.title}`} text={shown.title} small={shown.small} dir={dir} hidden={waiting} />
      {ghost ? <GhostTitle key={ghost.key} ghost={ghost} onDone={landed} /> : null}
    </View>
  );
}

function TitleText({ text, small, dir, hidden }: { text: string; small: boolean; dir: Dir; hidden: boolean }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(160, withTiming(1, { duration: motion.enter, easing: standard }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const arriving = useAnimatedStyle(() => ({
    opacity: hidden ? 0 : t.value,
    transform: [{ translateY: (1 - t.value) * 12 * dir }],
    ...blurred((1 - t.value) * motion.blur),
  }));
  /* a step's main title is the serif (Round 27); the small ones stay Geist */
  const T = small ? Head : Title;
  return (
    <Animated.View style={arriving} testID="title">
      <T>{text}</T>
    </Animated.View>
  );
}

function GhostTitle({ ghost, onDone }: { ghost: Ghost; onDone: () => void }) {
  const p = useSharedValue(ghost.kind === 'down' ? 1 : 0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const finish = (finished?: boolean) => {
      if (finished) runOnJS(done.current)();
    };
    if (ghost.kind === 'up') p.value = withTiming(1, { duration: motion.enter, easing: settle }, finish);
    else if (ghost.kind === 'down') p.value = withTiming(0, { duration: motion.enter, easing: settle }, finish);
    else p.value = withTiming(1, { duration: motion.leave, easing: away }, finish);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* the small title (the welcome's, the ready screen's) is Geist at 20; the others the serif at 32 */
  const size = ghost.small ? 20 : 32;
  const line = ghost.small ? 24 : 40;
  const moving = useAnimatedStyle(() => {
    if (ghost.kind === 'up' || ghost.kind === 'down') {
      /* p is how far along the row's place it is: 0 at the title, 1 in the stack */
      const last = ghost.kind === 'up' ? Math.max(0, Math.min(1, (p.value - 0.84) / 0.16)) : 0;
      const early = ghost.kind === 'down' ? Math.max(0, Math.min(1, (1 - p.value) / 0.16)) : 1;
      /* drawn at the title's size and scaled from its top left toward the row's 16, rather than set at a new size on
         every frame, which had the phone lay the words out afresh each frame (Round 29); the words are kept on the
         middle of the line they are growing into, 24 tall at the end */
      const k = (size + (16 - size) * p.value) / size;
      const into = line + (24 - line) * p.value;
      return {
        opacity: ghost.kind === 'up' ? 1 - last : early,
        color: interpolateColor(p.value, [0, 1], [night.ink, night.tertiary]),
        transform: [{ translateX: ROW_INSET * p.value }, { translateY: ROW_DY * p.value + (into - line * k) / 2 }, { scale: k }],
      };
    }
    return {
      opacity: 1 - p.value,
      color: night.ink,
      transform: [{ translateY: ghost.kind === 'plain' ? -16 * ghost.dir * p.value : 0 }],
      ...blurred(p.value * motion.blur),
    };
  });
  return (
    <Animated.Text
      pointerEvents="none"
      numberOfLines={1}
      style={[{ position: 'absolute', top: 0, left: 0, fontSize: size, lineHeight: line, transformOrigin: 'left top', ...(ghost.small ? font('600') : font('400', 'prose')) }, moving]}
      testID="ghost"
    >
      {ghost.text}
    </Animated.Text>
  );
}

/* ---- a slot whose content is replaced ---- */

/* What is in the slot arrives from below out of a blur; what was there
   leaves upward into one, drawn where it was until it has gone. The slot's
   height moves smoothly from the old content's to the new, so the head band
   above it never jumps. The bottom of the screen uses the same slot with the
   keypad's spring, going down instead of up. */
type Snap = { key: string; node: ReactNode };
function Slot({
  id,
  children,
  from = 24,
  to = -24,
  delay = 160,
  spring = false,
  style,
}: {
  id: string;
  children: ReactNode;
  from?: number;
  to?: number;
  delay?: number;
  spring?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const still = useStill();
  const [shownId, setShownId] = useState(id);
  const [leaving, setLeaving] = useState<Snap | null>(null);
  const last = useRef<ReactNode>(children);
  if (id !== shownId) {
    if (!still) setLeaving({ key: `${shownId}:${Date.now()}`, node: last.current });
    setShownId(id);
  }
  last.current = children;
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(null), motion.leave + 60);
    return () => clearTimeout(t);
  }, [leaving]);
  const h = useSharedValue(-1);
  const sizing = useAnimatedStyle(() => (h.value < 0 ? {} : { height: h.value }));
  /* once the slot has its height, what arrives in it lies loose in it, so on the phone it can be taller than what was
     there (see LOOSE) */
  const [loose, setLoose] = useState(false);
  const measured = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (h.value < 0 || still) h.value = next;
    else if (Math.abs(h.value - next) > 0.5) h.value = withTiming(next, { duration: motion.enter, easing: settle });
    if (!loose) setLoose(true);
  };
  return (
    <Animated.View style={[style, sizing]}>
      <Arriving key={shownId} from={from} delay={delay} spring={spring} loose={loose} onLayout={measured}>
        {children}
      </Arriving>
      {leaving ? (
        <Leaving key={leaving.key} to={to}>
          {leaving.node}
        </Leaving>
      ) : null}
    </Animated.View>
  );
}

function Arriving({ children, from, delay, spring, loose, onLayout }: { children: ReactNode; from: number; delay: number; spring: boolean; loose: boolean; onLayout: (e: LayoutChangeEvent) => void }) {
  const still = useStill();
  const t = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, spring ? withSpring(1, keys) : withTiming(1, { duration: motion.enter, easing: standard }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: Math.min(1, t.value),
    transform: [{ translateY: (1 - t.value) * from }],
    ...blurred(Math.max(0, 1 - t.value) * motion.blur),
  }));
  return (
    <Animated.View onLayout={onLayout} style={[loose ? LOOSE : null, moving]}>
      {children}
    </Animated.View>
  );
}

function Leaving({ children, to }: { children: ReactNode; to: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: motion.leave, easing: away });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const moving = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: t.value * to }],
    ...blurred(t.value * motion.blur),
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, moving]} testID="leaving">
      {children}
    </Animated.View>
  );
}

/* The black button at the foot of a stage that is not typing. */
function BarBlock({ bar }: { bar: Bar }) {
  if (bar.back)
    return (
      /* the frame's dock: Back on a 44 circle at the left, the button across the rest, 8 between */
      <View style={{ paddingHorizontal: SIDE, paddingVertical: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={bar.back} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }} testID="back">
          <Icon name="back" size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button label={bar.label} onPress={bar.onPress} disabled={bar.disabled} />
        </View>
      </View>
    );
  return (
    <View style={{ paddingHorizontal: SIDE, paddingVertical: 24 }}>
      <Button label={bar.label} onPress={bar.onPress} disabled={bar.disabled} />
    </View>
  );
}
