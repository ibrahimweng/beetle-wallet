/* Field · typing — what a number looks like as it is entered: 32 bold with a
   caret 4 after it. */
import React from 'react';
import { View } from 'react-native';
import { Display } from './text';
import { colour } from './tokens';

export function Field({ value, caret = true }: { value: string; caret?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 46 }}>
      <Display>{value}</Display>
      {caret ? <View style={{ width: 2, height: 30, backgroundColor: colour.accent }} /> : null}
    </View>
  );
}
