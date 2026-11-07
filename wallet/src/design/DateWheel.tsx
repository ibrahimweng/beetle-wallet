/* A date picked on three wheels (Round 41, the owner's word: the typed
   DD/MM/YYYY box was where new people got stuck). Day, the month by its name
   and the year, each a column that snaps a row at a time under a band in the
   middle, the phone ticking as the rows pass. Drawn by the app rather than
   the phone's own picker, so it is the same on iPhone, Android and the web,
   and on the dark of the way in. Nothing is picked until a wheel is turned
   or a row is tapped: the year starts near where most people opening an
   account were born, but that is not their birthday until they say so. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Caption, Meta } from './text';
import { Tap } from './motion';
import { feel } from './haptics';
import { night } from './scheme';
import { font, radius } from './tokens';
import { MONTHS, daysIn, isoOf, partsOf, wheelYears } from '../lib/dates';

const ROW = 40;
const SHOWN = 5;
const PAD = ROW * ((SHOWN - 1) / 2);

type Column = {
  key: 'day' | 'month' | 'year';
  label: string;
  rows: string[];
  at: number;
  set: (i: number) => void;
  flex: number;
};

function Wheel({ col, testID, onTouch }: { col: Column; testID: string; onTouch: () => void }) {
  const ref = useRef<ScrollView>(null);
  const shown = useRef(col.at);
  /** the row the wheel is on as it is turned, before it settles */
  const [live, setLive] = useState(col.at);
  const moving = useRef(false);

  /* put the wheel on its row: on the way in, and when the row changes from outside (a day past the end of a shorter
     month) */
  useEffect(() => {
    if (moving.current) return;
    shown.current = col.at;
    setLive(col.at);
    const id = setTimeout(() => ref.current?.scrollTo({ y: col.at * ROW, animated: false }), 0);
    return () => clearTimeout(id);
  }, [col.at]);

  const index = (y: number) => Math.min(col.rows.length - 1, Math.max(0, Math.round(y / ROW)));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = index(e.nativeEvent.contentOffset.y);
    if (i !== shown.current) {
      shown.current = i;
      setLive(i);
      feel.tick();
    }
  };
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    moving.current = false;
    const i = index(e.nativeEvent.contentOffset.y);
    if (i !== col.at) col.set(i);
  };
  const pick = (i: number) => {
    onTouch();
    feel.pick();
    ref.current?.scrollTo({ y: i * ROW, animated: true });
    setLive(i);
    shown.current = i;
    col.set(i);
  };

  return (
    <View
      style={{ flex: col.flex, height: ROW * SHOWN }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={col.label}
      accessibilityValue={{ text: col.rows[live] }}
      aria-valuetext={col.rows[live]}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => pick(Math.min(col.rows.length - 1, Math.max(0, live + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      testID={testID}
    >
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          moving.current = true;
          onTouch();
        }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={e => {
          /* a slow drag with no fling never sends the end of a momentum */
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) settle(e);
        }}
        contentContainerStyle={{ paddingVertical: PAD }}
        testID={`${testID}-scroll`}
      >
        {col.rows.map((r, i) => (
          <Tap key={r} accessibilityRole="button" accessibilityLabel={`${col.label} ${r}`} onPress={() => pick(i)} testID={`${testID}-${r}`}>
            <View style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
              <Meta
                style={[
                  font(i === live ? '600' : '400'),
                  { fontSize: i === live ? 20 : 17, color: i === live ? night.ink : Math.abs(i - live) === 1 ? night.secondary : night.tertiary },
                ]}
              >
                {r}
              </Meta>
            </View>
          </Tap>
        ))}
      </ScrollView>
    </View>
  );
}

export function DateWheel({
  value,
  onChange,
  now = new Date(),
  testID = 'date-wheel',
}: {
  /** the date picked, as an ISO day, or null until a wheel is turned */
  value: string | null;
  onChange: (iso: string) => void;
  now?: Date;
  testID?: string;
}) {
  const years = useMemo(() => wheelYears(now), [now]);
  const start = partsOf(value) ?? { day: 1, month: 1, year: years.start };
  const [day, setDay] = useState(start.day);
  const [month, setMonth] = useState(start.month);
  const [year, setYear] = useState(start.year);
  const [touched, setTouched] = useState(!!value);

  const last = daysIn(year, month);
  const shownDay = Math.min(day, last);

  const tell = useCallback((d: number, m: number, y: number) => onChange(isoOf(y, m, Math.min(d, daysIn(y, m)))), [onChange]);
  const touch = useCallback(() => {
    if (touched) return;
    setTouched(true);
    tell(day, month, year);
  }, [touched, tell, day, month, year]);

  const cols: Column[] = [
    {
      key: 'day',
      label: 'Day',
      rows: Array.from({ length: last }, (_, i) => String(i + 1)),
      at: shownDay - 1,
      set: i => {
        setDay(i + 1);
        setTouched(true);
        tell(i + 1, month, year);
      },
      flex: 0.8,
    },
    {
      key: 'month',
      label: 'Month',
      rows: [...MONTHS],
      at: month - 1,
      set: i => {
        setMonth(i + 1);
        setTouched(true);
        tell(day, i + 1, year);
      },
      flex: 1.5,
    },
    {
      key: 'year',
      label: 'Year',
      rows: years.list.map(String),
      at: years.list.indexOf(year),
      set: i => {
        const y = years.list[i] ?? year;
        setYear(y);
        setTouched(true);
        tell(day, month, y);
      },
      flex: 1,
    },
  ];

  return (
    <View style={{ gap: 6 }}>
      <View style={{ borderRadius: radius.md, backgroundColor: night.panel, paddingHorizontal: 8, overflow: 'hidden' }}>
        {/* the band the picked row sits in */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 8, right: 8, top: PAD, height: ROW, borderRadius: radius.sm, backgroundColor: night.panel2 }}
        />
        <View style={{ flexDirection: 'row' }}>
          {cols.map(c => (
            <Wheel key={c.key} col={c} testID={`${testID}-${c.key}`} onTouch={touch} />
          ))}
        </View>
      </View>
      {touched ? null : (
        <Caption tone="tertiary" testID={`${testID}-state`}>
          Scroll to your birthday.
        </Caption>
      )}
    </View>
  );
}
