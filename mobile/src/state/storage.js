/* The React Native half of the persistence adapter. AsyncStorage is async and
   the state layer reads synchronously at load, so the value is held in memory
   and hydrate() fills it before the first screen draws. */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'beetle.state.v2';
let cache = null;

export async function hydrate() {
  try { cache = await AsyncStorage.getItem(KEY); } catch (e) { cache = null; }
  return cache;
}

export const read = () => cache;

export const write = (s) => {
  cache = s;
  AsyncStorage.setItem(KEY, s).catch(() => { /* the next write will try again */ });
};
