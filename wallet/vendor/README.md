# Vendored libraries

Two React Native ports from [Libraries.dev](https://libraries.dev) by Jakub
Antalik, copied from https://github.com/Jakubantalik/libraries.dev at
commit `580ac1f0c9858edd579812fdea40d876217b27cb`. Each folder keeps its MIT licence. They are not published on
npm, so they live here. The web build uses the published packages instead
(`border-beam`, `thinking-orbs`, `liquid-gooey`).

- `border-beam-native/`: packages/border-beam/ports/react-native/border-beam-native/src
- `thinking-orbs-native/`: packages/thinking-orbs/ports/react-native/thinking-orbs-native/src

They sit outside `src/` on purpose: the app's worklet audit
(`test/worklets.test.mjs`) holds the app's own code to "no package objects on
the animation thread", and these ports hand Skia's objects to the UI thread
by design. Changes made here are listed in each folder's CHANGES.md.
