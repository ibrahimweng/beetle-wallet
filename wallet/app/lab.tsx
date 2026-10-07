/* The lab: every feature on its own. See src/lab. A build without the lab
   has no such page: its address goes to the start (the analysis after Round
   21: it opened in every build, with every account and place in it). */
import React from 'react';
import { Redirect } from 'expo-router';
import { Lab } from '../src/lab';
import { LAB } from '../src/lab/enabled';

export default function LabRoute() {
  return LAB ? <Lab /> : <Redirect href="/" />;
}
