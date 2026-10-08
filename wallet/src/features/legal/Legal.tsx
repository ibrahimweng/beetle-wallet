/* The terms or the privacy notice, as a page to read (Round 32). Open from
   the first step of the way in, before anything is kept, and from Settings;
   no account is needed to read them. The words are in legal.ts. */
import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Aside, Body, Card, Head, PageHead, Screen } from '../../design';
import { useFoot } from '../more/Foot';
import { DRAFT, LEGAL, type LegalDoc } from './legal';

export function Legal() {
  const asked = useLocalSearchParams<{ doc?: string }>();
  const doc: LegalDoc = asked.doc === 'terms' ? 'terms' : 'privacy';
  const { title, sub, sections } = LEGAL[doc];
  /* the foot: Back, at the bottom left */
  useFoot({ kind: 'back' });
  return (
    <Screen head={<PageHead lead title={title} sub={sub} />}>
      <Aside glyph="eye">{DRAFT}</Aside>
      {sections.map(section => (
        <View key={section.head} style={{ gap: 8 }} testID="legal-section">
          <Head>{section.head}</Head>
          <Card style={{ gap: 10 }}>
            {section.body.map(line => (
              <Body key={line} tone="secondary">
                {line}
              </Body>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
