import { randomSalt } from './crypto';
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const randomToken = () => randomSalt(24);
