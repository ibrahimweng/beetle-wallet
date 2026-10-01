/* Asking before what cannot be undone, the one time a screen says "are you
   sure": a small sheet with what will happen in a sentence or two, the
   action in red (it takes something away), and Cancel under it. A tap
   behind or a pull down is Cancel too. Money has its passcode instead; this
   is for signing out, and signing other phones out (see DESIGN.md). */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Body, Head } from './text';

export function ConfirmSheet({
  title,
  body,
  action,
  onConfirm,
  onCancel,
  testID = 'confirm',
}: {
  title: string;
  body: string;
  /** the red button's words: Sign out, Sign them out */
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
}) {
  /* the sheet goes down first, then what was chosen happens */
  const [leaving, setLeaving] = useState(false);
  const chose = useRef<'yes' | 'no'>('no');
  const go = (c: 'yes' | 'no') => {
    chose.current = c;
    setLeaving(true);
  };
  return (
    <Sheet leaving={leaving} onGone={() => (chose.current === 'yes' ? onConfirm() : onCancel())} onDismiss={onCancel} testID={testID}>
      <View style={{ gap: 8, paddingTop: 4 }}>
        <Head accessibilityRole="header">{title}</Head>
        <Body tone="secondary">{body}</Body>
      </View>
      <View style={{ gap: 8, marginTop: 24 }}>
        <Button label={action} tone="red" size={48} onPress={() => go('yes')} />
        <Button label="Cancel" tone="grey" size={48} onPress={() => go('no')} />
      </View>
    </Sheet>
  );
}
