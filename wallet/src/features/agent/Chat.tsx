/* The chat inside the card: every turn so far, the newest at the foot, each
   arriving out of a blur; the dots while Beetle thinks. It keeps the foot in
   view as the conversation grows. */
import React, { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Pane } from '../../design';
import { Said, Thinking, ToolPanel, Yours } from './Dark';
import type { Conversation } from './conversation';

export function Chat({ talk, active }: { talk: Conversation; active: boolean }) {
  const list = useRef<ScrollView>(null);
  const count = talk.turns.length + (talk.thinking ? 1 : 0);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [count, active]);
  return (
    <ScrollView
      ref={list}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={active}
      onContentSizeChange={() => active && list.current?.scrollToEnd({ animated: true })}
    >
      {talk.turns.map(t => {
        let body: React.ReactNode;
        if (t.who === 'you') body = <Yours photo={!!t.photo}>{t.text}</Yours>;
        else if (t.block.kind === 'say') body = <Said>{t.block.text}</Said>;
        else if (t.block.kind === 'note') body = <Said title={t.block.title}>{t.block.body}</Said>;
        else {
          const panel = t.block.panel;
          body = (
            <ToolPanel
              panel={panel}
              state={'state' in t ? t.state : 'ready'}
              quick={'quick' in t && !!t.quick}
              onReady={() => talk.ready(panel.id)}
              onAction={() => talk.confirm(panel.id)}
              onEdit={row => talk.edit(panel.id, row)}
            />
          );
        }
        return <Pane key={t.id}>{body}</Pane>;
      })}
      {talk.thinking ? (
        <Pane>
          <Thinking />
        </Pane>
      ) : null}
      {!talk.turns.length && !talk.thinking ? <View style={{ height: 8 }} /> : null}
    </ScrollView>
  );
}
