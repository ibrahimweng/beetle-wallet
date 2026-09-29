/* The camera. Point it at an account number, take the picture, and the
   reading goes to Beetle. Every way it can go wrong has a way out: the
   permission not yet given, given and taken back (with the way to settings),
   a device with no camera at all (the web in a sandbox), and a picture that
   would not take. Where there is no camera, the sample slip stands in. */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Body, Head, Icon, Meta, Pane, Row, Tap, colour, dark } from '../../design';
import { reader } from '../../services';
import { handoff } from './handoff';
import { samplePhoto } from './sample';

type State = 'asking' | 'denied' | 'ready' | 'none' | 'taking';

export function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>('asking');
  const [note, setNote] = useState<string | null>(null);
  const camera = useRef<CameraView>(null);
  const failed = useRef(false);

  useEffect(() => {
    if (!permission) return;
    if (permission.granted) setState(s => (s === 'taking' ? s : 'ready'));
    else if (!permission.canAskAgain) setState('denied');
    else setState('asking');
  }, [permission]);

  const allow = async () => {
    try {
      const r = await requestPermission();
      if (!r.granted) setState(r.canAskAgain ? 'asking' : 'denied');
    } catch {
      setState('none');
    }
  };

  const done = (photo: { uri: string; width?: number; height?: number }) => {
    handoff.put(photo);
    router.back();
  };

  const take = async () => {
    if (state !== 'ready') return;
    setState('taking');
    try {
      const shot = await camera.current?.takePictureAsync({ quality: 0.8, skipProcessing: Platform.OS === 'android' });
      if (!shot?.uri) throw new Error('nothing came back');
      done({ uri: shot.uri, width: shot.width, height: shot.height });
    } catch {
      setState('ready');
      setNote('That did not take. Hold the phone still and try again.');
    }
  };

  const sample = async () => {
    setState('taking');
    done(await samplePhoto());
  };

  const back = () => router.back();

  return (
    <View style={s.screen}>
      {state === 'ready' || state === 'taking' ? (
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
          </View>
        )}
      </Pane>
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
