/* The face or the finger, asked of the phone (Round 32, the owner's word: a
   signed-in person coming back into the app, or approving a payment, is
   asked for their face or fingerprint first, at once, and the six digits
   are the way past it when that does not work).

   It is named for what the phone has: Face ID or Touch ID on an iPhone,
   Face unlock, fingerprint or iris on Android, and Face ID where the phone
   does not say. Asking it has three answers: it was them; it was asked and
   did not take (no match, or called off), which the screen says, with the
   key to try again; or it cannot be asked here at all, where the six digits
   are simply there, with nothing said. Nothing here ever answers yes for
   the phone: this is the gate before money, so where the face cannot be
   asked, the passcode is the only way past. Expo Go on an iPhone is not
   allowed Face ID at all (Round 31, the owner on the phone), and the web has
   neither, so both cannot be asked. */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricAnswer = 'ok' | 'failed' | 'unavailable';

/** Where the phone may not be asked: the web, and Expo Go on an iPhone. */
const BARRED = Platform.OS === 'web' || (Platform.OS === 'ios' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

/* what the phone says when it could not ask at all, rather than asked and was told no */
const CANNOT_ASK = new Set<string>(['not_available', 'not_enrolled', 'passcode_not_set', 'missing_usage_description', 'invalid_context', 'unknown']);

/** What the phone checks when nothing better is known. */
export const DEFAULT_BIOMETRIC = 'Face ID';

let named: string | null = null;

/** What the phone checks, as the person knows it: "Face ID", "Touch ID", "Face unlock", "fingerprint" or "iris". */
export async function biometricName(): Promise<string> {
  if (named) return named;
  if (BARRED) return DEFAULT_BIOMETRIC;
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const { FACIAL_RECOGNITION, FINGERPRINT, IRIS } = LocalAuthentication.AuthenticationType;
    const ios = Platform.OS === 'ios';
    /* an iPhone has the one; an Android phone may say more than one, and the fingerprint is the one most of them have set up */
    if (ios) named = types.includes(FACIAL_RECOGNITION) ? 'Face ID' : types.includes(FINGERPRINT) ? 'Touch ID' : null;
    else named = types.includes(FINGERPRINT) ? 'fingerprint' : types.includes(FACIAL_RECOGNITION) ? 'Face unlock' : types.includes(IRIS) ? 'iris' : null;
  } catch {
    named = null;
  }
  return named ?? DEFAULT_BIOMETRIC;
}

/** The name, for a screen: Face ID until the phone has said. */
export function useBiometricName(): string {
  const [name, setName] = useState(named ?? DEFAULT_BIOMETRIC);
  useEffect(() => {
    let live = true;
    void biometricName().then(n => {
      if (live) setName(n);
    });
    return () => {
      live = false;
    };
  }, []);
  return name;
}

/** The name at the start of a sentence: "Fingerprint did not catch you." */
export const capital = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

/** Does the phone look at a face, rather than feel for a finger or look at an eye? The screens' words follow it. */
export const isFace = (name: string) => /face/i.test(name);

/** It, as said to the person: "your face", "your fingerprint", "Touch ID". */
export const yourBiometric = (name: string) => (isFace(name) ? 'your face' : /^[a-z]/.test(name) ? `your ${name}` : name);

/** The line while the phone is asking. */
export const askingLine = (name: string) => (isFace(name) ? 'Looking…' : `Waiting for ${name}…`);

/** Can the phone be asked here, with a face or a finger set up on it? */
export async function biometricAvailable(): Promise<boolean> {
  if (BARRED) return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** The phone asked, with `prompt` on its own sheet, and Use passcode to put it away for the six digits. */
export async function askBiometric(prompt: string): Promise<BiometricAnswer> {
  if (!(await biometricAvailable())) return 'unavailable';
  try {
    /* no Enter Password on an iPhone's own sheet after a miss: the six digits are ours, under Use passcode */
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: 'Use passcode', fallbackLabel: '', disableDeviceFallback: true });
    if (r.success) return 'ok';
    /* no match, called off by the person or the phone, or too many tries: asked, and not them */
    return CANNOT_ASK.has(r.error) ? 'unavailable' : 'failed';
  } catch {
    return 'unavailable';
  }
}
