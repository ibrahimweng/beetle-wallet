/* Share this receipt, on the sheet the frames draw for it: the share mark,
   the line about what moved, four ways out, the word about what is left off
   every copy, and Done. WhatsApp takes a picture of the receipt and hands it
   to the phone's share sheet (the words, where there is none), Save to
   photos puts the picture in Photos, Somewhere else hands the words to the
   phone; there is no PDF yet. */
import React, { type RefObject } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import { Body, Button, Head, Icon, Logo, Meta, Row, Sheet, Tap, colour, logoOf, toast } from '../../design';
import type { IconName } from '../../icons';
import { copyText } from '../receive/clipboard';
import { savePicture, sharePicture } from '../receive/picture';

export function ShareSheet({
  line,
  message,
  capture,
  onDismiss,
}: {
  line: string;
  message: string;
  /** the receipt as drawn, for the picture */ capture?: RefObject<View | null>;
  onDismiss: () => void;
}) {
  const elsewhere = async () => {
    try {
      await Share.share({ message });
    } catch {
      const copied = await copyText(message);
      toast(copied ? 'Sharing is not on here, so the words are on the clipboard.' : 'Sharing is not on here.');
    }
  };
  const whatsapp = async () => {
    const url = 'whatsapp://send?text=' + encodeURIComponent(message);
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      /* no WhatsApp here: the phone's own sheet instead */
    }
    await elsewhere();
  };
  /* the picture: to the share sheet, or the words where there is none */
  const picture = async () => {
    if (!capture) return whatsapp();
    toast(await sharePicture(capture, message, 'Your receipt'));
  };
  const save = async () => toast(capture ? await savePicture(capture, 'beetle-receipt.png') : 'This build cannot draw the picture to save it.');
  const pdf = () => toast('Beetle cannot make a PDF yet. Share the picture, or save it.');
  const way = (glyph: IconName, title: string, sub: string, go: () => void) => (
    <Tap key={title} accessibilityRole="button" accessibilityLabel={title} onPress={go} style={s.way}>
      {/* WhatsApp in its own colours (Round 38) */}
      {logoOf(title) ? (
        <Logo name={logoOf(title)!} size={40} radius={13} />
      ) : (
        <View style={s.mark}>
          <Icon name={glyph} size={20} colour={colour.ink} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{title}</Row>
        <Meta tone="tertiary">{sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
  return (
    <Sheet onDismiss={onDismiss} testID="share" foot={14}>
      {/* the frame: the mark under the grabber's band, 16 to the title, 12 to the line */}
      <View style={{ alignItems: 'center' }}>
        <View style={s.big} testID="share-mark">
          <Icon name="share" size={28} colour={colour.ink} />
        </View>
        <Head style={{ marginTop: 16, textAlign: 'center' }}>Share this receipt</Head>
        <Body tone="tertiary" style={{ marginTop: 12, textAlign: 'center' }}>
          {line}
        </Body>
      </View>
      <View style={{ marginTop: 12 }}>
        {way('chat', 'WhatsApp', 'The picture, ready to send', () => void picture())}
        {way('camera', 'Save to photos', 'It stays on this phone', () => void save())}
        {way('receipt', 'Save as PDF', 'The full record, for an office', pdf)}
        {way('grid', 'Somewhere else', 'Messages, mail, anywhere you share', () => void elsewhere())}
      </View>
      <View style={s.note}>
        <Icon name="eye" size={16} colour={colour.textTertiary} />
        <Meta tone="secondary" style={{ flex: 1 }}>
          Your balance and the full account numbers are left off every copy that leaves the phone.
        </Meta>
      </View>
      <Button label="Done" tone="grey" size={48} full={false} style={{ alignSelf: 'center', paddingHorizontal: 40, marginTop: 4 }} onPress={onDismiss} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  big: { width: 64, height: 64, borderRadius: 20, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  way: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 72 },
  mark: { width: 40, height: 40, borderRadius: 13, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  /* the frame's row: 8 under the ways, the words 12 down and 4 in */
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4, paddingTop: 12, marginTop: 8 },
});
