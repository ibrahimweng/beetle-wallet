/* An old address for one of the three pages, /activities or /settings:
   it turns the pager to that page and goes, carrying what it was asked
   (Your details open, say). Nothing is drawn but the white it lands on. */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colour } from '../../design';
import { openTab, type Tab } from './tabs';

export function TabRedirect({ tab }: { tab: Tab }) {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  useEffect(() => {
    const carried = Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
    openTab(router, tab, carried);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <View style={{ flex: 1, backgroundColor: colour.surface }} />;
}
