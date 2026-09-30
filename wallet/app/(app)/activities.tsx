/* Activities is the second of the three pages on home; this address turns
   to it. See src/features/tabs. */
import React from 'react';
import { TabRedirect } from '../../src/features/tabs/Redirect';

export default function ActivitiesRoute() {
  return <TabRedirect tab="activities" />;
}
