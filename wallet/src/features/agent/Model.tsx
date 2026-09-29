/* Beetle's model, for the lab: where the key is, a place to keep one on this
   phone, and a try. Beetle answers from Claude when there is a key and from
   the script when there is not, so this screen is how a phone gets the real
   one without the key ever being in the code. */
import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Caption, Card, Display, Divider, Ghost, Head, Icon, Label, Meta, Screen, colour, radius, space } from '../../design';
import { DEMO_ACCOUNT, MODEL, agent, modelKey, type ModelConfig } from '../../services';
import { useApp } from '../onboarding/store';

export function Model() {
  const router = useRouter();
  const app = useApp();
  const [cfg, setCfg] = useState<ModelConfig | null | undefined>(undefined);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [trying, setTrying] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  const look = () => modelKey.config().then(setCfg);
  useEffect(() => {
    void look();
  }, []);

  const keep = async () => {
    const k = typed.trim();
    if (!k) return;
    await modelKey.set(k);
    setTyped('');
    setNote('Kept in the keychain of this phone.');
    await look();
  };
  const forget = async () => {
    await modelKey.clear();
    setNote('Forgotten. Beetle answers from the script again, unless the build carries a key.');
    await look();
  };
  const tryIt = async () => {
    setTrying(true);
    setSteps([]);
    setAnswer(null);
    const account = app.session?.account ?? DEMO_ACCOUNT;
    try {
      const r = await agent.ask({ text: 'What can you do for me?' }, { account, balance: 595_320.75, rate: 1552, pending: null }, line => setSteps(s => [...s, line]));
      setAnswer(r.blocks.map(b => (b.kind === 'say' ? b.text : b.kind === 'note' ? `${b.title}: ${b.body}` : `[a ${b.kind}]`)).join('\n\n'));
    } catch (e) {
      setAnswer(`It did not answer: ${(e as Error).message}`);
    } finally {
      setTrying(false);
    }
  };

  const where =
    cfg === undefined
      ? 'Looking…'
      : cfg === null
        ? 'No key. Beetle answers from the script.'
        : cfg.from === 'phone'
          ? `A key kept on this phone. Beetle answers from ${MODEL}.`
          : `A key from the build. Beetle answers from ${MODEL}.`;

  return (
    <Screen>
      <View style={{ gap: space.s3 }}>
        <Icon name="key-filled" size={32} colour={colour.accent} />
        <Display>Beetle's model</Display>
        <Meta tone="secondary">
          Beetle answers from Claude when there is a key for it, and from the script when there is not. The key stays in this phone's keychain and goes nowhere but Anthropic.
        </Meta>
      </View>

      <View style={{ gap: space.s3 }}>
        <Head>Where it answers from</Head>
        <Card style={{ gap: space.s3 }}>
          <Label>{where}</Label>
          {cfg?.baseUrl && cfg.baseUrl !== 'https://api.anthropic.com' ? <Meta tone="secondary">Through {cfg.baseUrl}</Meta> : null}
          <Divider />
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder="Paste a key: sk-ant-…"
            placeholderTextColor={colour.textTertiary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="The key"
            style={{
              height: 48,
              borderRadius: radius.md,
              backgroundColor: colour.surface2,
              paddingHorizontal: 16,
              fontSize: 16,
              color: colour.ink,
            }}
          />
          <Button label="Keep it on this phone" size={48} onPress={() => void keep()} disabled={!typed.trim()} />
          {cfg?.from === 'phone' ? <Ghost label="Forget the key on this phone" onPress={() => void forget()} /> : null}
          {note ? <Meta tone="secondary">{note}</Meta> : null}
        </Card>
      </View>

      <View style={{ gap: space.s3 }}>
        <Head>A try</Head>
        <Card style={{ gap: space.s3 }}>
          <Meta tone="secondary">Asks "What can you do for me?" the way the chat would, and shows what comes back — the steps it says as it works, then the answer.</Meta>
          <Button label={trying ? 'Asking…' : 'Ask it'} size={48} tone="grey" onPress={() => void tryIt()} disabled={trying} />
          {steps.map((s, i) => (
            <Caption key={i} tone="tertiary">
              {s}
            </Caption>
          ))}
          {answer ? <Meta>{answer}</Meta> : null}
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <Label>Where the key should live</Label>
        <Caption tone="secondary">
          A shipped app keeps its key on a server of its own and the phone talks to that; EXPO_PUBLIC_ANTHROPIC_BASE_URL at export time points Beetle there, with nothing else to change. A key in the
          phone build (EXPO_PUBLIC_ANTHROPIC_API_KEY, from the repository's secrets) is for this prototype only.
        </Caption>
      </View>
      <Ghost label="Back to the lab" onPress={() => (router.canDismiss() ? router.dismissTo('/lab') : router.replace('/lab'))} />
    </Screen>
  );
}
