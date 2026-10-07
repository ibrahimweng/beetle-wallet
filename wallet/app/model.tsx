/* Beetle's model, for the lab: the key, and a try. See src/features/agent/Model.tsx.
   A build without the lab has no such page: its address goes to the start. */
import React from 'react';
import { Redirect } from 'expo-router';
import { Model } from '../src/features/agent/Model';
import { LAB } from '../src/lab/enabled';

export default function ModelRoute() {
  return LAB ? <Model /> : <Redirect href="/" />;
}
