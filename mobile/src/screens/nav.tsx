/* What every screen needs from the app around it: where it can go, and the
   dock at the bottom that takes a question. Asking either moves you to the
   screen that answers it, or hands it to the chat. */
import React from 'react';
import { ActionButton, Dock } from '../design';
import { Route } from '../routes';
import { place, setQuestion } from '../state/agent';

export type Nav = { go: (r: Route) => void; back: () => void };

/** What the ask bar does, wherever it is. */
export const asked = (nav: Nav, q: string) => {
  const to = place(q);
  if (to) {
    nav.go(to);
    return;
  }
  setQuestion(q);
  nav.go('agentchat');
};

/** The dock most screens carry: back, the ask bar, and the camera. Where the
    frame also puts the round plus beside the bar, pass `plus`. */
export const dock = (placeholder: string, nav: Nav, back?: Route, plus = false) => (
  <Dock
    placeholder={placeholder}
    onBack={back ? () => nav.go(back) : nav.back}
    onAsk={q => asked(nav, q)}
    onScan={() => nav.go('scan')}
    action={plus ? <ActionButton onPress={() => nav.go('actions')} /> : undefined}
  />
);
