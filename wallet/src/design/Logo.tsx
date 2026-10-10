/* A company's own mark (Round 38, the owner's word: the logos missing from
   bills and everywhere else a company is named). Each is a tile: the brand's
   ground colour and its mark, taken from the brand's own vector or traced
   from its own picture (assets/logos). It goes in the box the glyph or the
   initials stood in, at that box's size and corners, so nothing round it
   moves: a 40 square with 12 corners in a row, a circle where the row had
   one. A white tile keeps a hairline edge, so it does not melt into a white
   page. */
import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LOGOS, type LogoName } from './logos';

export type { LogoName } from './logos';
export { logoOf } from './brands';

/** A white or near-white ground, which needs its edge drawn. */
const pale = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 236;
};

export function Logo({
  name,
  size = 40,
  round = false,
  radius,
  faded = false,
  bare = false,
  tint,
  testID,
}: {
  name: LogoName;
  size?: number;
  /** a circle, where the row draws its marks round */
  round?: boolean;
  /** the corners, where the box they replace has its own (a 40 square's are 12) */
  radius?: number;
  /** a paid or past row, greyed with its words */
  faded?: boolean;
  /** the mark alone, without its ground: on a button that is its own ground (Continue with Google) */
  bare?: boolean;
  /** the mark in one colour, the button's own ink: Apple's, which is drawn in whatever the button writes in */
  tint?: string;
  testID?: string;
}) {
  /* a tile's gradient is named; each tile drawn names its own, since the web keeps every id on one page */
  const id = 'logo' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const tile = LOGOS[name];
  if (!tile) return null;
  let body = tile.body.includes('__ID__') ? tile.body.split('__ID__').join(id) : tile.body;
  if (tint) body = body.replace(/fill="(?!none|url)[^"]*"/g, `fill="${tint}"`);
  /* bare, the mark fills the box: it was set in the middle of its tile with room round it for the ground */
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bare ? '12 12 40 40' : '0 0 64 64'}" width="${size}" height="${size}">${body}</svg>`;
  const corner = round ? size / 2 : (radius ?? Math.round(size * 0.3));
  if (bare)
    return (
      <View style={{ width: size, height: size, flexShrink: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID ?? `logo-${name}`}>
        <SvgXml xml={xml} width={size} height={size} />
      </View>
    );
  return (
    <View
      style={[
        s.tile,
        {
          width: size,
          height: size,
          borderRadius: corner,
          backgroundColor: tile.ground,
          opacity: faded ? 0.45 : 1,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID ?? `logo-${name}`}
    >
      <SvgXml xml={xml} width={size} height={size} />
      {pale(tile.ground) ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.edge, { borderRadius: corner }]} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  tile: { overflow: 'hidden', flexShrink: 0 },
  edge: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(43,39,33,0.14)' },
});
