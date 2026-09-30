/* The camera. Point it at an account number, take the picture, and the
   reading goes to Beetle. Every way it can go wrong has a way out: the
   permission not yet given, given and taken back (with the way to settings),
   a device with no camera at all (the web in a sandbox), and a picture that
   would not take. Where there is no camera, the sample slip stands in, and
   a sample message beside it. The photo is read here first: a message
   asking to be paid puts Read from your photo up over the camera, and the
   request goes on from there; anything else goes back with what was read. */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Body, Head, Icon, Meta, Pane, Row, Tap, colour, dark } from '../../design';
import { reader, type Photo, type RequestReading } from '../../services';
import { FoundSheet, requestDraft } from '../request';
import { LAB } from '../../lab/enabled';
import { handoff } from './handoff';
import { sampleMessage, samplePhoto } from './sample';

type CameraModule = typeof import('expo-camera');
type CameraViewRef = InstanceType<CameraModule['CameraView']>;

/* The camera module is asked for once, quietly. A build made before it was
   added, running a newer update, has no such module and asking for it
   throws; that build gets the sample slip instead of a crash. */
const cam: CameraModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-camera') as CameraModule;
  } catch {
    return null;
  }
})();

type State = 'asking' | 'denied' | 'ready' | 'none' | 'taking';

export function Scan() {
  const router = useRouter();
  const asked = useLocalSearchParams<{ demo?: string }>();
  const [state, setState] = useState<State>('asking');
  const [note, setNote] = useState<string | null>(null);
  /** a message asking to be paid, read off the photo: the sheet over the camera */
  const [found, setFound] = useState<RequestReading | null>(null);
  const camera = useRef<CameraViewRef>(null);
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

  /* the photo, read here: a message asking to be paid stays, with the sheet
     up; anything else goes back to the screen that asked, read */
  const done = async (photo: Photo) => {
    const before = state;
    setState('taking');
    const reading = await reader.read(photo.uri).catch(() => undefined);
    if (reading?.request) {
      setFound(reading.request);
      setState(before === 'taking' ? 'ready' : before);
      return;
    }
    handoff.put({ ...photo, reading });
    router.back();
  };
  const ask = (draft: Parameters<typeof requestDraft.put>[0]) => {
    requestDraft.put(draft);
    setFound(null);
    router.replace('/request');
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

  const sample = async () => {
    setState('taking');
    await done(await samplePhoto());
  };
  const message = async () => {
    setState('taking');
    await done(await sampleMessage());
  };
  /* the lab: the message, read, and the sheet up */
  useEffect(() => {
    if (LAB && asked.demo === 'request') void message();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => router.back();
  const CameraView = cam?.CameraView;

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      {CameraView && (state === 'ready' || state === 'taking') ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          onMountError={() => {
            failed.current = true;
            setState('none');
          }}
        />
      ) : null}
      <Pane style={s.column}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={s.back}>
          <Icon name="back" size={22} colour="#ffffff" />
        </Pressable>
        <View style={{ flex: 1 }} />
        {state === 'asking' ? (
          <Card
            title="The camera reads the number"
            body="Point it at an account number on a slip, a screen or a card, and Beetle reads it off the photo. The photo stays on this phone."
            action="Allow the camera"
            onAction={allow}
            alt="Use a sample photo instead"
            onAlt={sample}
          />
        ) : state === 'denied' ? (
          <Card
            title="The camera is switched off for Beetle"
            body="Turn it on in the phone's settings and come back, or use a sample photo."
            action="Open settings"
            onAction={() => Linking.openSettings().catch(() => setNote('Settings could not be opened from here.'))}
            alt="Use a sample photo instead"
            onAlt={sample}
          />
        ) : state === 'none' ? (
          <Card
            title="No camera here"
            body="This device has no camera Beetle can use, so a sample slip stands in: a name, a bank and an account number on paper."
            action="Use the sample photo"
            onAction={sample}
            alt="Or a message asking for your account"
            onAlt={message}
          />
        ) : (
          <View style={s.controls}>
            <Meta style={{ color: '#ffffff', textAlign: 'center' }}>{note ?? 'Fill the frame with the account number'}</Meta>
            <Tap accessibilityRole="button" accessibilityLabel="Take the photo" onPress={take} disabled={state === 'taking'} style={s.shutter} scale={0.9}>
              {state === 'taking' ? <ActivityIndicator color={colour.ink} /> : <View style={s.shutterInner} />}
            </Tap>
            <Pressable accessibilityRole="button" onPress={sample} style={{ paddingVertical: 8 }}>
              <Meta style={{ color: dark.text }}>Use a sample photo</Meta>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={message} style={{ paddingVertical: 4, marginTop: -16 }}>
              <Meta style={{ color: dark.textSoft }}>Or a message asking for your account</Meta>
            </Pressable>
          </View>
        )}
      </Pane>
      {found ? <FoundSheet reading={found} onAsk={ask} onRetake={() => setFound(null)} onDismiss={() => setFound(null)} /> : null}
    </View>
  );
}

function Card({ title, body, action, onAction, alt, onAlt }: { title: string; body: string; action: string; onAction: () => void; alt?: string; onAlt?: () => void }) {
  return (
    <View style={s.card}>
      <Head style={{ color: '#ffffff' }}>{title}</Head>
      <Body style={{ color: dark.text }}>{body}</Body>
      <Tap accessibilityRole="button" onPress={onAction} style={s.button}>
        <Row style={{ color: colour.ink }}>{action}</Row>
      </Tap>
      {alt && onAlt ? (
        <Pressable accessibilityRole="button" onPress={onAlt} style={{ alignSelf: 'center', paddingVertical: 4 }}>
          <Meta style={{ color: dark.text }}>{alt}</Meta>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  column: { flex: 1, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 40 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  controls: { alignItems: 'center', gap: 20 },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#000000' },
  card: { backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, padding: 20, gap: 16 },
  button: { height: 52, borderRadius: 26, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
});

export const readerIsReal = () => reader.real;
