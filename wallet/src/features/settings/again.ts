/* When a transfer repeats, from what it was for: rent on the first,
   groceries on Fridays, school fees at the start of term, the rest on the
   same day every month. Plain, so the tests can read it. */
export function whenAgain(reference?: string): string {
  const r = (reference ?? '').toLowerCase();
  if (/rent|flat|house/.test(r)) return 'The first of every month';
  if (/grocer|market|food/.test(r)) return 'Every Friday';
  if (/school|fees/.test(r)) return 'The start of every term';
  return 'The same day every month';
}
