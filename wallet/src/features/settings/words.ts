/* The three words typed in full, past your own limit. What has been typed
   is held against the sentence letter by letter: how many are still to go,
   and whether what is there so far is right. */
export const WORDS = 'Confirm this transaction';

const NUMBERS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export function typedState(typed: string, want = WORDS) {
  let same = 0;
  while (same < typed.length && same < want.length && typed[same] === want[same]) same++;
  const right = same === typed.length;
  const left = want.length - same;
  const rest = right ? want.slice(same) : '';
  const line = !right
    ? 'That is not it. The three words, exactly as they are written.'
    : left === 0
      ? 'That is it. It can go now.'
      : `${NUMBERS[left] ?? String(left)} letters to go. Exactly those three words, nothing shorter.`;
  return { right, left, rest, done: right && left === 0, line };
}
