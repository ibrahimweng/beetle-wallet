/* An address that is not a screen — a link typed wrong, or the app served
   from a path it does not know, as it is when hosted inside another page —
   goes to the start, and the loading screen works out where you belong. */
import React from 'react';
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/" />;
}
