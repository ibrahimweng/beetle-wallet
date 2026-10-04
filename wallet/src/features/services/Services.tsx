/* All services, from its frame: the eight used most as tiles, then Bills,
   Save and borrow, and Money as rows — each a way into a page this build
   has, or a word about which round brings it. A search field at the top
   narrows them as you type; a word that is a page of its own opens it, and
   anything it does not find can go to Beetle on home. The foot is Back.
   Reached from the Services chip over the chat's ask bar and from the
   word typed at home. */
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Icon, Label, Meta, PageHead, Row, Screen, Tap, colour, toast, useDeparture } from '../../design';
import type { IconName } from '../../icons';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { useFoot } from '../more/Foot';
import { askHome } from '../more/More';
import { pageFor } from '../request/intent';
import { holdingsFor } from '../home/account';
import { LISTS, MOST, serviceFor, type Service } from './services';

export function Services() {
  const app = useApp();
  const router = useRouter();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const dollars = useMemo(() => (account ? holdingsFor(account).dollars : 0), [account]);
  const go = (s: Service) => {
    if (s.to) router.push(s.to as never);
    else toast(s.later ?? `${s.label} is not drawn yet.`);
  };
  /* the search: what matches as you type; on return, a service by name opens, a page's words open the page, anything else goes to Beetle at home */
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const all = useMemo(() => {
    const seen = new Set<string>();
    return [...MOST, ...LISTS.flatMap(l => l.items)].filter(it => (seen.has(it.label) ? false : (seen.add(it.label), true)));
  }, []);
  const found = q ? all.filter(it => `${it.label} ${it.sub ?? ''}`.toLowerCase().includes(q)) : [];
  const ask = (text: string) => {
    const s = serviceFor(text) ?? (found.length === 1 ? found[0] : undefined);
    if (s) return go(s);
    const p = pageFor(text);
    if (p) return router.push(p as never);
    askHome(router, text);
  };
  useFoot({ kind: 'back' });
  if (!ok || !account) return null;
  return (
    <Screen head={<PageHead lead title="All services" sub="Everything you can pay for from here" />}>
      <View style={s.search} testID="services-search">
        <Icon name="search" size={18} colour={colour.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => query.trim() && ask(query.trim())}
          placeholder="Search services"
          placeholderTextColor={colour.textTertiary}
          returnKeyType="search"
          style={s.searchInput}
          accessibilityLabel="Search services"
        />
        {query ? (
          <Tap accessibilityRole="button" accessibilityLabel="Clear the search" onPress={() => setQuery('')} hitSlop={8} scale={0.85}>
            <Icon name="close-small" size={18} colour={colour.textSecondary} />
          </Tap>
        ) : null}
      </View>
      {q ? (
        <View testID="services-found">
          {found.map(it => (
            <ServiceRow key={it.label} item={it} onPress={() => go(it)} />
          ))}
          {!found.length ? (
            <Tap accessibilityRole="button" accessibilityLabel="Ask Beetle" onPress={() => ask(query.trim())} style={s.none}>
              <Body tone="secondary">{`Nothing called "${query.trim()}".`}</Body>
              <Label tone="accent">Ask Beetle</Label>
            </Tap>
          ) : null}
        </View>
      ) : null}
      {q ? null : (
        <View testID="most-block">
          <Body tone="secondary">You use these most</Body>
          <View style={{ marginTop: 12, gap: 12 }} testID="most">
            {[MOST.slice(0, 4), MOST.slice(4)].map((four, i) => (
              <View key={i} style={s.grid}>
                {four.map(it => (
                  <Tile key={it.label} item={it} onPress={() => go(it)} />
                ))}
              </View>
            ))}
          </View>
        </View>
      )}
      {q
        ? null
        : LISTS.map((list, i) => (
            /* the frame's list columns are 7 shorter than their rows, so each list after the first sits closer by what the one above overflowed */
            <View key={list.title} style={{ marginTop: i === 0 ? -4 : i === 1 ? -9 : -11 }} testID={`block-${list.title.split(' ')[0]?.toLowerCase()}`}>
              <Body tone="secondary">{list.title}</Body>
              <View style={{ marginTop: 18 }} testID={`list-${list.title.split(' ')[0]?.toLowerCase()}`}>
                {list.items.map(it => (
                  <ServiceRow key={it.label} item={it.label === 'Dollars' ? { ...it, sub: `$${dollars.toFixed(2)}, ${it.sub}` } : it} onPress={() => go(it)} />
                ))}
              </View>
            </View>
          ))}
    </Screen>
  );
}

/* A tile, 82 wide and 88 tall: the glyph on a 48 square, the word under it. */
function Tile({ item, onPress }: { item: Service; onPress: () => void }) {
  const j = useDeparture({ id: `service:${item.label}`, to: item.to, words: item.label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.to ? j.onPress : onPress} style={[s.tile]} testID="service-tile">
      {j.wash}
      <View style={s.square}>
        <Icon name={item.glyph} size={24} colour={colour.ink} />
      </View>
      <Label>{item.label}</Label>
    </Tap>
  );
}

/* A row, 68 tall: the glyph on a 40 square, the name over its line, a chevron. */
function ServiceRow({ item, onPress }: { item: Service; onPress: () => void }) {
  const j = useDeparture({ id: `service:${item.label}`, to: item.to, words: item.label });
  return (
    <Tap ref={j.ref} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.to ? j.onPress : onPress} style={[s.row]} testID="service-row">
      {j.wash}
      <View style={s.box}>
        <Icon name={item.glyph} size={20} colour={colour.ink} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Row>{item.label}</Row>
        <Meta tone="secondary">{item.sub}</Meta>
      </View>
      <Icon name="chevron" size={16} colour={colour.textTertiary} />
    </Tap>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 24, backgroundColor: colour.surface2, paddingHorizontal: 16, marginTop: -4 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: colour.ink, padding: 0, outlineWidth: 0 },
  none: { gap: 8, paddingVertical: 12 },
  tile: { flex: 1, height: 88, alignItems: 'center', gap: 8 },
  square: { width: 48, height: 48, borderRadius: 14, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 68 },
  box: { width: 40, height: 40, borderRadius: 12, backgroundColor: colour.surface2, alignItems: 'center', justifyContent: 'center' },
});
