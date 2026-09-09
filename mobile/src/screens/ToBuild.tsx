/* A screen that exists in the design and has not been written here yet. It
   names the frame it must be built from, so the next person does not have to
   go looking for it. This is deliberately loud: it should be obvious in the
   running app which screens are still owed. */
import React from 'react';
import { View } from 'react-native';
import { Screen, Dock, Card } from '../components/kit';
import { Caption, Head, Meta } from '../components/text';
import { ROUTES, Route } from '../routes';
import { colour } from '../theme';

export function ToBuild({ route, onBack }: { route: Route; onBack: () => void }) {
  const info = ROUTES[route];
  return (
    <Screen dock={<Dock onBack={onBack} placeholder="Ask about this screen" />}>
      <View style={{ gap: 8 }}>
        <Head>{info.title}</Head>
        <Meta tone="tertiary">Not built in React Native yet</Meta>
      </View>
      <Card style={{ gap: 12 }}>
        <Caption tone="secondary">Build it from</Caption>
        <Head>{info.design ?? 'no frame recorded'}</Head>
        <Meta tone="secondary">{info.act} · {info.section}</Meta>
        {info.frame ? <Caption tone="tertiary">Figma node {info.frame}</Caption> : null}
      </Card>
      <Caption tone="tertiary" style={{ color: colour.textTertiary }}>
        The route works and the state layer is live. Only the drawing is missing.
      </Caption>
    </Screen>
  );
}
