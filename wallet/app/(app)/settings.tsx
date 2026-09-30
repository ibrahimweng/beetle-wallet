/* Settings is the third of the three pages on home; this address turns to
   it, with Your details open where it is asked for. See src/features/tabs. */
import React from 'react';
import { TabRedirect } from '../../src/features/tabs/Redirect';

export default function SettingsRoute() {
  return <TabRedirect tab="settings" />;
}
