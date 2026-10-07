/* What VoiceOver says for what the eye reads at a glance. */

/** A line of the record as VoiceOver says it: "Money out, ₦20,026.88, GTBank, 14:05". */
export function spokenLine(amount: string, detail: string) {
  const way = amount.startsWith('+') ? 'Money in, ' : /^[−-]/.test(amount) ? 'Money out, ' : '';
  return `${way}${amount.replace(/^[+−-]\s*/, '')}${detail ? `, ${detail.split(' · ').join(', ')}` : ''}`;
}
