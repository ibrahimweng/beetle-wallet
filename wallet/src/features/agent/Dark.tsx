/* What the chat is made of, on the dark card: what Beetle says, with or
   without a title; what you said, black on black with the camera where a
   photo went with it; a panel of what it checked and found, with the one
   thing to do; and the three dots while it thinks. Read off the home frame. */
import React, { ReactNode, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Body, Caption, Icon, Label, Meta, Pop, Row, Swap, Tap, dark, motion, standard, useStill } from '../../design';
import type { IconName } from '../../icons';
import type { Panel, PanelRow } from '../../services';

export function Said({ title, children }: { title?: string; children: ReactNode }) {
  if (title)
    return (
      <View style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 4 }}>
        <Label style={{ color: dark.text }}>{title}</Label>
        <Caption style={{ color: dark.textSoft }}>{children}</Caption>
      </View>
    );
  return (
    <View style={{ padding: 16 }}>
      <Body style={{ color: dark.text }}>{children}</Body>
    </View>
  );
}

export function Yours({ photo = false, children }: { photo?: boolean; children: ReactNode }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '84%', backgroundColor: dark.bubble, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 }}>
        {photo ? <Icon name="camera" size={16} colour={dark.text} /> : null}
        <Row style={{ color: dark.text }}>{children}</Row>
      </View>
    </View>
  );
}

/* Three dots, taking turns, while the answer is on its way and Beetle has
   not yet said what it is doing. */
export function Thinking() {
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <Dot key={i} delay={i * 160} />
      ))}
    </View>
  );
}

/* What Beetle says it is doing, in its own voice, a line at a time: the
   line under way turns its mark, a line done has landed its tick. Once the
   answer is there the same lines stay above it, dimmed — what it did, kept. */
export function Thoughts({ lines, live }: { lines: string[]; live: boolean }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 10, opacity: live ? 1 : 0.62 }}>
      {lines.map((line, i) => {
        const last = i === lines.length - 1;
        const working = live && last;
        return (
          <View key={`${i}:${line}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {working ? (
              <Spinning>
                <Icon name="step-work" size={16} />
              </Spinning>
            ) : (
              <Pop delay={0}>
                <Icon name="step-done" size={16} />
              </Pop>
            )}
            <Caption style={{ color: working ? dark.text : dark.textSoft, flex: 1 }}>{line}</Caption>
          </View>
        );
      })}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const still = useStill();
  const t = useSharedValue(0.3);
  useEffect(() => {
    if (still) return;
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 360 }), withTiming(0.3, { duration: 520 })), -1, false));
  }, [delay, still, t]);
  const fading = useAnimatedStyle(() => ({ opacity: t.value }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: dark.text }, fading]} />;
}

/* ---- a panel ---- */

export type PanelState = 'running' | 'ready' | 'done';

/** How the status pill reads for a panel's tool and state. */
export function statusWord(panel: Panel, state: PanelState): string {
  if (state === 'running') return 'Running';
  if (state === 'ready') return panel.action ? 'Ready' : 'Read';
  return panel.tool === 'transfer' ? 'Sent' : panel.tool === 'pay' ? 'Paid' : panel.tool === 'data' ? 'Bought' : 'Done';
}

/** The rows land one after another: each is on its way for a moment, then
    done, its value arriving with it. */
const ROW_EVERY = 260;
const ROW_WORK = 220;

export function ToolPanel({
  panel,
  state,
  onReady,
  onAction,
  onEdit,
  quick = false,
}: {
  panel: Panel;
  state: PanelState;
  /** every row has landed */
  onReady?: () => void;
  onAction?: () => void;
  /** a row whose value can be corrected was tapped */
  onEdit?: (row: PanelRow) => void;
  /** drawn with everything already landed: a panel that was there before */
  quick?: boolean;
}) {
  const still = useStill();
  const skip = still || quick || state !== 'running';
  const [landed, setLanded] = useState(skip ? panel.rows.length : 0);
  useEffect(() => {
    if (skip) return;
    const timers = panel.rows.map((_, i) => setTimeout(() => setLanded(i + 1), ROW_EVERY * (i + 1) + ROW_WORK));
    return () => timers.forEach(clearTimeout);
  }, [panel.id, skip]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state === 'running' && landed >= panel.rows.length) onReady?.();
  }, [landed, state, panel.rows.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = state !== 'running' || landed >= panel.rows.length;
  return (
    <View style={{ backgroundColor: dark.panel, borderWidth: 1, borderColor: dark.edge, borderRadius: 24, overflow: 'hidden', paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, backgroundColor: dark.edge, borderBottomWidth: 1, borderBottomColor: dark.edgeStrong }}>
        <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: dark.edgeStrong, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={panel.icon} size={16} colour="#ffffff" />
        </View>
        <Label style={{ flex: 1, color: '#ffffff' }}>{panel.title}</Label>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: dark.edge, borderWidth: 1, borderColor: dark.edgeStrong }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34c759' }} />
          <Swap value={statusWord(panel, state)}>{w => <Caption style={{ color: dark.pillText, fontWeight: '600' }}>{w}</Caption>}</Swap>
        </View>
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: panel.action ? 12 : 0 }}>
        {panel.rows.map((row, i) => (
          <PanelRowView
            key={row.label}
            row={row}
            at={i < landed ? 'done' : i === landed && !skip ? 'work' : 'todo'}
            popped={!skip}
            lined={i > 0 && !!row.editable}
            onEdit={row.editable && live && state !== 'done' && onEdit ? () => onEdit(row) : undefined}
          />
        ))}
      </View>
      {panel.action ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Arriving on={live} delay={0}>
            <Tap
              accessibilityRole="button"
              accessibilityLabel={state === 'done' ? statusWord(panel, state) : panel.action.label}
              disabled={!live || state === 'done'}
              onPress={onAction}
              style={{
                height: 52,
                borderRadius: 26,
                backgroundColor: dark.edge,
                borderWidth: 1,
                borderColor: dark.edgeStrong,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
                opacity: state === 'done' ? 0.7 : 1,
              }}
            >
              <Swap value={state === 'done' ? statusWord(panel, state) : panel.action.label}>{label => <Row style={{ color: '#ffffff' }}>{label}</Row>}</Swap>
            </Tap>
          </Arriving>
        </View>
      ) : null}
    </View>
  );
}

const STEP: Record<'done' | 'work' | 'todo', IconName> = { done: 'step-done', work: 'step-work', todo: 'step-todo' };

function PanelRowView({ row, at, popped, lined, onEdit }: { row: PanelRow; at: 'done' | 'work' | 'todo'; popped: boolean; lined: boolean; onEdit?: () => void }) {
  const inner = (
    <>
      {at === 'done' && popped ? (
        <Pop delay={0}>
          <Icon name="step-done" size={18} />
        </Pop>
      ) : at === 'work' ? (
        <Spinning>
          <Icon name={STEP.work} size={18} />
        </Spinning>
      ) : (
        <Icon name={STEP[at]} size={18} />
      )}
      <Meta style={{ color: dark.label }}>{row.label}</Meta>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        <Arriving on={at === 'done'} delay={60}>
          <Label style={{ color: '#ffffff', textAlign: 'right' }}>{row.value}</Label>
        </Arriving>
        {onEdit ? <Icon name="chevron" size={12} colour={dark.label} /> : null}
      </View>
    </>
  );
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, height: 44, borderTopWidth: lined ? 1 : 0, borderTopColor: dark.edge };
  return onEdit ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${row.label}, ${row.value}, change it`} onPress={onEdit} style={style}>
      {inner}
    </Pressable>
  ) : (
    <View style={style}>{inner}</View>
  );
}

/* A value arriving with its row, out of a blur. */
function Arriving({ on, delay, children }: { on: boolean; delay: number; children: ReactNode }) {
  const still = useStill();
  const t = useSharedValue(on || still ? 1 : 0);
  useEffect(() => {
    if (still) {
      t.value = on ? 1 : 0;
      return;
    }
    if (on) t.value = withDelay(delay, withTiming(1, { duration: motion.enter, easing: standard }));
  }, [on, still, delay, t]);
  const moving = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 6 }] }));
  return <Animated.View style={moving}>{children}</Animated.View>;
}

/* The mark of a row still being worked on, turning. */
function Spinning({ children }: { children: ReactNode }) {
  const still = useStill();
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    t.value = withRepeat(withTiming(1, { duration: 900 }), -1, false);
  }, [still, t]);
  const turning = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value * 360}deg` }] }));
  return <Animated.View style={turning}>{children}</Animated.View>;
}
