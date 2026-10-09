/* What each store holds in memory for an account, let go when the account is
   (the analysis after Round 34: an account closed, or a phone started over,
   left its moves, setting up and chats in memory for whoever came next on
   that number). Each store says how to let go of its own. */
const forgetters = new Set<(account: string) => void>();

/** A store's way of letting go of what it holds for an account. */
export function onForget(forget: (account: string) => void) {
  forgetters.add(forget);
}

/** Every store lets go of what it holds for these accounts. */
export function forgetHeld(accounts: string[]) {
  for (const a of accounts) for (const f of forgetters) f(a);
}
