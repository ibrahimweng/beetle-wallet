/* On the web the reveal is the views' (see revealPieces.tsx): a browser blurs what a view holds. */
import React from 'react';
import { PlainReveal, type RevealProps } from './revealPieces';

export function LogoReveal(props: RevealProps) {
  return <PlainReveal {...props} />;
}
