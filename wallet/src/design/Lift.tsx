/* Over the whole screen, from anywhere (Round 37, the owner's word: the blur
   behind Load the card was not placed right). A page that is itself a sheet
   (the virtual card, a goal, the loan) sits under the status bar with its
   corners clipped, so a sheet it put up was drawn inside it: its blur stopped
   at the page's edge and moved with it, and what was above the page stayed
   sharp. What is lifted is drawn by the host instead, over every page and the
   foot, as if it had been put up from the screen itself.

   The host keeps what each lift hands it, in the order they came, and draws
   nothing when there is nothing. A lift hands its children over after every
   render of its own, so what it shows keeps up with the page that owns it,
   and takes them back when it goes. Where there is no host (a test, the way
   in) the children are drawn where they are. */
import React, { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Layers = { put: (id: string, node: ReactNode | null) => void };
const LayerContext = createContext<Layers | null>(null);

export function LayerHost({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<[string, ReactNode][]>([]);
  const api = useMemo<Layers>(
    () => ({
      put: (id, node) =>
        setLayers(all => {
          const i = all.findIndex(l => l[0] === id);
          if (node === null) return i < 0 ? all : all.filter(l => l[0] !== id);
          if (i < 0) return [...all, [id, node]];
          const next = all.slice();
          next[i] = [id, node];
          return next;
        }),
    }),
    [],
  );
  return (
    <LayerContext.Provider value={api}>
      {children}
      {layers.length ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="lifted">
          {layers.map(([id, node]) => (
            <React.Fragment key={id}>{node}</React.Fragment>
          ))}
        </View>
      ) : null}
    </LayerContext.Provider>
  );
}

/** Its children, drawn by the host over the whole screen. */
export function Lift({ children }: { children: ReactNode }) {
  const host = useContext(LayerContext);
  const id = useId();
  /* after every render: the page's latest */
  useEffect(() => {
    host?.put(id, children);
  });
  useEffect(() => () => host?.put(id, null), [host, id]);
  return host ? null : <>{children}</>;
}
