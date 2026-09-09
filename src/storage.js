/* Where the account is kept between visits. The state layer is shared with the
   React Native app, which has no localStorage, so the two calls it needs live
   behind this and each platform supplies its own. */
export const read = () => {
  try { return localStorage.getItem('beetle.state.v2'); } catch (e) { return null; }
};
export const write = (s) => {
  try { localStorage.setItem('beetle.state.v2', s); } catch (e) { /* private window */ }
};
