/* An amount picked over the page it is for, where the page has no room of
   its own for the picker: a sheet with what it is for, the picker (see
   Amount) and one button that says what happens to the figure. The page
   stays under it; nothing is pushed. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { AmountPicker, type AmountPickerProps } from './Amount';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Head, Meta } from './text';

export function AmountSheet({
  title,
  sub,
  start = 0,
  action,
  onDone,
  onDismiss,
  testID = 'amount-sheet',
  ...picker
}: Omit<AmountPickerProps, 'value' | 'onChange' | 'testID'> & {
  title: string;
  sub?: string;
  /** where the picker starts */
  start?: number;
  /** what the button says, for the figure picked */
  action: (amount: number) => string;
  onDone: (amount: number) => void;
  onDismiss: () => void;
  testID?: string;
}) {
  const [value, setValue] = useState(start);
  return (
    <Sheet onDismiss={onDismiss} testID={testID}>
      <Head>{title}</Head>
      {sub ? (
        <Meta tone="secondary" style={{ marginTop: 8 }}>
          {sub}
        </Meta>
      ) : null}
      <View style={{ marginTop: 20 }}>
        <AmountPicker {...picker} value={value} onChange={setValue} />
      </View>
      <View style={{ marginTop: 20 }}>
        <Button label={action(value)} disabled={!value} onPress={() => onDone(value)} />
      </View>
    </Sheet>
  );
}
