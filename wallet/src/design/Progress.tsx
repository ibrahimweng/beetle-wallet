/* A ring that shows how far along something is: the goal's third of the
   way, the money health score. A grey track, the accent arc from the top
   clockwise with round ends, and whatever sits in the middle. */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Caption, Label } from './text';
import { colour } from './tokens';

export function Progress({
  size = 180,
  pct,
  width = 12,
  tone = colour.accent,
  children,
  testID = 'progress',
}: {
  size?: number;
  pct: number;
  width?: number;
  tone?: string;
  children?: ReactNode;
  testID?: string;
}) {
  const r = (size - width) / 2;
  const c = 2 * Math.PI * r;
  const share = Math.max(0, Math.min(100, pct)) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} testID={testID} accessibilityLabel={`${Math.round(pct)} percent`}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colour.rule} strokeWidth={width} fill="none" />
        {share > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={tone}
            strokeWidth={width}
            fill="none"
            strokeDasharray={`${c * share} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}

/* The pale blue note the frames end a page with: a line in the deep accent
   and the words under it, 321 wide. */
export function NoteCard({
  title,
  body,
  width = 321,
  height,
  testID = 'note',
}: {
  title: string;
  body: string;
  width?: number | string;
  /** the frame's instance keeps a height its words do not fill */ height?: number;
  testID?: string;
}) {
  return (
    <View style={{ width: width as number, minHeight: height, backgroundColor: colour.accentWash, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4 }} testID={testID}>
      <NoteTitle>{title}</NoteTitle>
      <NoteBody>{body}</NoteBody>
    </View>
  );
}

function NoteTitle({ children }: { children: string }) {
  return <Label style={{ color: colour.accentDeep }}>{children}</Label>;
}
function NoteBody({ children }: { children: string }) {
  return <Caption style={{ color: colour.accentDeep }}>{children}</Caption>;
}
