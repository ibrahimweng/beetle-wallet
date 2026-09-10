/* Page head — the set's two variants. lead=no is a 20 point title, lead=yes is
   a 32 point one. Both leave 8 under the title, and the line below is 16
   regular in the tertiary grey, not 14.

   The big one hangs 9 above the column it starts. That is where the frames put
   it: everything else in the column begins 72 down, and a 32 title begins at
   63, so the words themselves line up with the top of the screen rather than
   the box around them. Both variants give 5 back at the bottom for the same
   reason: the line under the title carries more box than ink, and the frames
   space what follows from the ink. */
import React from 'react';
import { View } from 'react-native';
import { Body, Head, Title } from './text';

export function PageHead({ title, sub, lead = false }: { title: string; sub?: string; lead?: boolean }) {
  const T = lead ? Title : Head;
  return (
    <View style={{ gap: 8, marginTop: lead ? -9 : 0, marginBottom: -5 }}>
      <T>{title}</T>
      {sub ? <Body tone="tertiary">{sub}</Body> : null}
    </View>
  );
}
