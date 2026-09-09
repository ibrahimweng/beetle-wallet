/* A glyph from the Figma set. The vectors are the exported ones, so an icon
   here is the same shape as the icon in the file. `colour` maps onto
   currentColor inside the SVG, which is how the set is drawn. */
import React from 'react';
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
  return <SvgXml xml={xml} width={size} height={size} color={colour} />;
}
