/* Tool panel — the set's three tools, and Tool row, which is the same row with
   or without somewhere to go. The step markers are the file's own step-done,
   step-work and step-todo glyphs. */
import React, { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Label, Meta } from './text';
import { StatusPill } from './StatusPill';
import { colour, radius, space } from './tokens';

export type Step = { k: string; v: string; done?: boolean | 'work'; go?: () => void };

export function ToolRow({ k, v, done, go }: Step) {
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.s3,
        paddingHorizontal: space.s4,
        height: 43,
      }}
    >
      <Icon name={done === false ? 'step-todo' : done === 'work' ? 'step-work' : 'step-done'} size={18} />
      <Meta tone="secondary" style={{ flex: 1 }}>
        {k}
      </Meta>
      <Label>{v}</Label>
      {go ? <Icon name="chevron" size={14} colour={colour.textTertiary} /> : null}
    </View>
  );
  return go ? (
    <Pressable accessibilityRole="button" onPress={go}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function ToolPanel({
  tool,
  state,
  rows,
  children,
}: {
  tool: string;
  state: string;
  rows: Step[];
  children?: ReactNode;
}) {
  return (
    <View
      style={{
        /* the frames draw the panel as a white card with a hairline round it.
           Its name sits centred on a 46 grey band, between the tool's badge —
           a white 32 square — and what it is doing. */
        backgroundColor: colour.surface,
        borderWidth: 1,
        borderColor: colour.rule,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.s2,
          height: 46,
          paddingHorizontal: 12,
          backgroundColor: colour.surface2,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colour.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="send" size={14} />
        </View>
        <Label style={{ flex: 1, textAlign: 'center' }}>{tool}</Label>
        <StatusPill label={state} />
      </View>
      {rows.map((r, i) => (
        <View key={i} style={i ? { borderTopWidth: 1, borderTopColor: colour.rule } : undefined}>
          <ToolRow {...r} />
        </View>
      ))}
      {children}
    </View>
  );
}
