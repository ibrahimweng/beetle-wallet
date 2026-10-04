/* The camera, from its frames: a close at the top left and the light at
   the top right, the word on what to point it at, the photo it read drawn
   back in the middle with what it found under it, and the gallery, the
   shutter and the code reader along the foot. Every way it can go wrong
   has a way out: the permission not yet given, given and taken back (with
   the way to settings), a device with no camera at all (the web in a
   sandbox), and a picture that would not take. Where there is no camera,
   the gallery holds sample photos: a slip, a message asking for the
   account, a light bill, a message asking for data. The photo is read
   here first: a message asking to be paid or for data puts Read from
   your photo up over the camera and goes on from there, a bill goes to
   What I found, and anything else goes back with what was read. */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Body, Caption, Head, Icon, Label, Meta, Row, Sheet, Tap, colour, dark, toast } from '../../design';
import { groupMeter, groupPhoneNumber, reader, type Photo, type RequestReading, type TopupReading } from '../../services';
import { FoundSheet, requestDraft } from '../request';
import { TopupSheet } from '../data/TopupSheet';
import { topupDraft } from '../data/hand';
import { billDraft } from '../bills/hand';
import { LAB } from '../../lab/enabled';
import { groupAccount, groupDigits } from '../../lib/format';
import { handoff } from './handoff';
import { idPhoto } from '../setup/hand';
import { SAMPLES, sampleOfKind, type SampleKind } from './sample';

type CameraModule = typeof import('expo-camera');
type CameraViewRef = InstanceType<CameraModule['CameraView']>;

/* The camera module is asked for once, quietly. A build made before it was
   added, running a newer update, has no such module and asking for it
   throws; that build gets the sample photos instead of a crash. */
const cam: CameraModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-camera') as CameraModule;
  } catch {
    return null;
  }
})();

type State = 'asking' | 'denied' | 'ready' | 'none' | 'taking';
/** The photo just read, drawn back with what was found on it. */
type Read = { photo: Photo; chip: string | null };

export function Scan() {
  const router = useRouter();
  const asked = useLocalSearchParams<{
    demo?: string;
    /** what the camera is pointed at: a bill, where the Bills pages opened it; an ID, where setting up did */ for?: string;
    /** the lab: hold the photo as read, rather than going on */ hold?: string;
  }>();
  const forBill = asked.for === 'bill' || asked.demo === 'bill';
  const [state, setState] = useState<State>('asking');
  const [note, setNote] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [read, setRead] = useState<Read | null>(null);
  /** a message asking to be paid, read off the photo: the sheet over the camera */
  const [found, setFound] = useState<RequestReading | null>(null);
  /** a message asking for data or airtime, read off the photo */
  const [topup, setTopup] = useState<TopupReading | null>(null);
  /** the sample pictures to choose from, where there is no camera or none is wanted */
  const [choosing, setChoosing] = useState(false);
  const camera = useRef<CameraViewRef>(null);
  const onward = useRef<(() => void) | null>(null);
  const failed = useRef(false);

  useEffect(() => {
    if (!cam) {
      setState('none');
      return;
    }
    cam.Camera.getCameraPermissionsAsync()
      .then(p => setState(p.granted ? 'ready' : p.canAskAgain ? 'asking' : 'denied'))
      .catch(() => setState('none'));
  }, []);

  const allow = async () => {
    if (!cam) {
      setState('none');
      return;
    }
    try {
      const r = await cam.Camera.requestCameraPermissionsAsync();
      setState(r.granted ? 'ready' : r.canAskAgain ? 'asking' : 'denied');
    } catch {
      setState('none');
    }
  };

  /* the photo, read here and drawn back with what was found: a message
     asking to be paid or for data stays, with the sheet up; a bill goes on
     to What I found; anything else goes back to the screen that asked */
  const done = async (photo: Photo) => {
    const before = state;
    setState('taking');
    const reading = await reader.read(photo.uri).catch(() => undefined);
    const chip = reading?.bill
      ? groupMeter(reading.bill.meter)
      : reading?.topup
        ? groupPhoneNumber(reading.topup.line)
        : reading?.numbers[0]
          ? groupAccount(reading.numbers[0])
          : (reading?.request?.from ?? null);
    setRead({ photo, chip });
    setState(before === 'taking' ? 'ready' : before);
    if (reading?.request) {
      setFound(reading.request);
      return;
    }
    if (reading?.topup) {
      setTopup(reading.topup);
      return;
    }
    const go = () => {
      onward.current = null;
      if (reading?.bill) {
        billDraft.put({ reading: reading.bill, read: 'photo' });
        router.replace('/meter');
      } else if (asked.for === 'id') {
        /* the ID: the number read off it goes back to setting up; the name is the account's own */
        idPhoto.put({ name: '', number: reading?.numbers[0] ? groupDigits(reading.numbers[0], [4, 4, 3]) : 'not read' });
        router.back();
      } else {
        handoff.put({ ...photo, reading });
        router.back();
      }
    };
    /* the lab holds the frame's moment; a tap on what was found goes on */
    if (LAB && asked.hold === '1') {
      onward.current = go;
      return;
    }
    setTimeout(go, 900);
  };
  const ask = (draft: Parameters<typeof requestDraft.put>[0]) => {
    requestDraft.put(draft);
    setFound(null);
    router.replace('/request');
  };
  const buy = (draft: Parameters<typeof topupDraft.put>[0]) => {
    topupDraft.put(draft);
    setTopup(null);
    router.replace('/topup');
  };
  const retake = () => {
    setFound(null);
    setTopup(null);
    setRead(null);
  };

  const take = async () => {
    if (state !== 'ready') return;
    setState('taking');
    try {
      const shot = await camera.current?.takePictureAsync({ quality: 0.8, skipProcessing: Platform.OS === 'android' });
      if (!shot?.uri) throw new Error('nothing came back');
      await done({ uri: shot.uri, width: shot.width, height: shot.height });
    } catch {
      setState('ready');
      setNote('That did not take. Hold the phone still and try again.');
    }
  };

  const sample = async (kind: SampleKind) => {
    setChoosing(false);
    setRead(null);
    await done(await sampleOfKind(kind));
  };
  /* the lab: a sample read, and the sheet or the page up */
  useEffect(() => {
    if (!LAB) return;
    if (asked.demo === 'request') void sample('message');
    if (asked.demo === 'topup') void sample('topup');
    if (asked.demo === 'bill') void sample('bill');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => router.back();
  const CameraView = cam?.CameraView;
  const live = state === 'ready' || state === 'taking';
  const title = forBill ? 'Point at a bill or a meter' : 'Point at an account number';
  const sub = note ?? (forBill ? 'The number on the card works too.' : 'A QR code works too. So does a screenshot of a message, or a bill.');
  const caption = forBill ? 'Or the meter number, typed, if the light is bad.' : 'Or send a screenshot straight to Beetle in the chat.';

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      {CameraView && live ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          onMountError={() => {
            failed.current = true;
            setState('none');
          }}
        />
      ) : null}
      <View style={s.column}>
        {/* the frame's head: close at the left, the light at the right, 40 discs on a 44 row 56 down */}
        <View style={s.top} testID="scan-top">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={s.disc40}>
            <Icon name="close" size={20} colour="#ffffff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Light"
            accessibilityState={{ selected: torch }}
            onPress={() => setTorch(t => !t)}
            style={[s.disc40, { marginRight: 4 }, torch ? s.disc40On : null]}
          >
            <Icon name="power" size={20} colour="#ffffff" />
          </Pressable>
        </View>
        <View style={s.words} testID="scan-words">
          <Head style={{ color: '#ffffff', textAlign: 'center' }}>{title}</Head>
          <Meta style={{ color: dark.textSoft, textAlign: 'center', marginTop: 8 }}>{sub}</Meta>
        </View>
        {/* the bill frame lets its line run past its box, so the middle starts 5 higher there */}
        <View style={{ flex: 1, marginTop: forBill ? 15 : 20 }}>
          {read ? (
            <View style={{ alignItems: 'center' }}>
              {/* the photo as read: a white card on a dark one, and what was found on it in a chip under */}
              <Pressable accessibilityRole="button" accessibilityLabel="The photo" onPress={() => onward.current?.()} style={s.readCard} testID="read-card">
                <View style={s.photo}>
                  <Image source={{ uri: read.photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel="The photo as read" />
                </View>
              </Pressable>
              {read.chip ? (
                <Pressable accessibilityRole="button" accessibilityLabel={read.chip} onPress={() => onward.current?.()} style={s.chip} testID="read-chip">
                  <Icon name="step-done" size={18} colour={colour.good} />
                  <Label style={{ color: '#ffffff' }}>{read.chip}</Label>
                </Pressable>
              ) : null}
            </View>
          ) : state === 'asking' ? (
            <Card
              title={forBill ? 'The camera reads the bill' : 'The camera reads the number'}
              body={
                forBill
                  ? 'Point it at a bill or a meter, and Beetle reads the company, the meter and what is owed off the photo. The photo stays on this phone.'
                  : 'Point it at an account number on a slip, a screen or a card, and Beetle reads it off the photo. The photo stays on this phone.'
              }
              action="Allow the camera"
              onAction={allow}
            />
          ) : state === 'denied' ? (
            <Card
              title="The camera is switched off for Beetle"
              body="Turn it on in the phone's settings and come back, or pick a sample photo from the gallery below."
              action="Open settings"
              onAction={() => Linking.openSettings().catch(() => setNote('Settings could not be opened from here.'))}
            />
          ) : state === 'none' ? (
            <View style={s.card}>
              <Head style={{ color: '#ffffff' }}>No camera here</Head>
              <Body style={{ color: dark.text }}>This device has no camera Beetle can use, so a sample stands in: the gallery below holds a slip, a bill, and two messages.</Body>
            </View>
          ) : null}
        </View>
        {/* the frame's foot: the gallery, the shutter, the code reader, on a 72 row; the line under it */}
        <View style={s.bottom} testID="scan-bottom">
          <Pressable accessibilityRole="button" accessibilityLabel="Use a sample photo" onPress={() => setChoosing(true)} style={s.gallery}>
            <View style={s.galleryRow}>
              <View style={s.galleryDot} />
              <View style={[s.galleryLine, { width: 22, marginTop: 3 }]} />
            </View>
            <View style={s.galleryLine} />
            <View style={s.galleryLine} />
            <View style={[s.galleryLine, { width: 22 }]} />
          </Pressable>
          <Tap
            accessibilityRole="button"
            accessibilityLabel="Take the photo"
            accessibilityState={{ disabled: state !== 'ready' }}
            onPress={take}
            disabled={state !== 'ready'}
            style={[s.shutter, state !== 'ready' ? { opacity: 0.5 } : null]}
            scale={0.9}
          >
            {state === 'taking' ? <ActivityIndicator color="#ffffff" /> : <View style={s.shutterInner} />}
          </Tap>
          <Pressable accessibilityRole="button" accessibilityLabel="Read a code" onPress={() => toast('Paying by pointing at a code comes with round 6.')} style={s.disc52}>
            <Icon name="qr" size={22} colour="#ffffff" />
          </Pressable>
        </View>
        <Caption style={{ color: dark.textSoft, marginTop: 20, textAlign: forBill ? 'left' : 'center' }} testID="scan-caption">
          {caption}
        </Caption>
      </View>
      {choosing ? (
        <Sheet onDismiss={() => setChoosing(false)} testID="samples">
          <Head>A sample photo</Head>
          <Meta tone="secondary" style={{ marginTop: 8 }}>
            What the stand-in reader sees in each, where there is no camera.
          </Meta>
          <View style={{ marginTop: 12 }}>
            {SAMPLES.map((it, i) => (
              <Tap key={it.kind} accessibilityRole="button" accessibilityLabel={it.title} onPress={() => void sample(it.kind)} style={[s.sampleRow, i ? s.hairTop : null]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row>{it.title}</Row>
                  <Meta tone="secondary">{it.sub}</Meta>
                </View>
                <Icon name="chevron" size={16} colour={colour.textTertiary} />
              </Tap>
            ))}
          </View>
        </Sheet>
      ) : null}
      {found ? <FoundSheet reading={found} onAsk={ask} onRetake={retake} onDismiss={() => setFound(null)} /> : null}
      {topup ? <TopupSheet reading={topup} onBuy={buy} onRetake={retake} onDismiss={() => setTopup(null)} /> : null}
    </View>
  );
}

function Card({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <View style={s.card}>
      <Head style={{ color: '#ffffff' }}>{title}</Head>
      <Body style={{ color: dark.text }}>{body}</Body>
      <Tap accessibilityRole="button" onPress={onAction} style={s.button}>
        <Row style={{ color: colour.ink }}>{action}</Row>
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  column: { flex: 1, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 31 },
  top: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disc40: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  disc40On: { backgroundColor: 'rgba(255,255,255,0.4)' },
  words: { marginTop: 20 },
  readCard: { marginTop: 8, width: '100%', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', padding: 14 },
  photo: { height: 200, borderRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden' },
  chip: { marginTop: 16, height: 36, borderRadius: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)' },
  bottom: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gallery: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#ffffff', padding: 8, gap: 4, justifyContent: 'center' },
  galleryRow: { flexDirection: 'row', gap: 4, alignItems: 'flex-start', height: 10 },
  galleryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colour.good },
  galleryLine: { width: 36, height: 4, borderRadius: 2, backgroundColor: colour.rule },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffffff' },
  disc52: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, padding: 20, gap: 16 },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 },
  hairTop: { borderTopWidth: 1, borderTopColor: colour.rule },
  button: { height: 52, borderRadius: 26, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
});

export const readerIsReal = () => reader.real;
