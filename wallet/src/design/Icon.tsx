/* A glyph from the Figma set. The vectors are the exported ones, so an icon
   here is the same shape as the icon in the file. `colour` maps onto
   currentColor inside the SVG, which is how the set is drawn. */
import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { ICONS, IconName } from '../icons';
import { colour as palette } from './tokens';

export type IconProps = { name: IconName; size?: number; colour?: string };

export function Icon({ name, size = 24, colour = palette.ink }: IconProps) {
  const body = ICONS[name];
  if (!body) {
    if (__DEV__) console.warn(`No icon called "${name}".`);
    return null;
  }
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">${body}</svg>`;
  /* A glyph is a fixed size, not a share of what is left. Without the box
     around it a row that runs tight — the dock with a back arrow and a button
     either side of the bar — squeezes the mark down to a dot. */
  return (
    <View style={{ width: size, height: size, flexShrink: 0 }}>
      <SvgXml xml={xml} width={size} height={size} color={colour} />
    </View>
  );
}

/* A glyph on the pale square the frames set it on: 40 across with a 20 mark in
   a row, 63 with a 32 mark where a sheet opens on one. */
export function Mark({ glyph, big = false }: { glyph: IconName; big?: boolean }) {
  const box = big ? 63 : 40;
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: big ? 20 : 13,
        backgroundColor: palette.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={glyph} size={big ? 32 : 20} />
    </View>
  );
}
