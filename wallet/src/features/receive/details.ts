/* The account's own details, to be paid into: the number at Beetle for any
   bank, the $tag for another Beetle account, and the words that hand them
   all on at once. The Receive sheet and the chat's Receive card both use
   them, so the two say the same thing the same way. */
import { groupAccount } from '../../lib/format';
import { ownTag } from '../../services/recipients';
import type { Account } from '../../services';

export function detailsOf(account: Pick<Account, 'firstName' | 'lastName' | 'accountNumber'>, tag = ownTag(account.firstName)) {
  const name = `${account.firstName} ${account.lastName}`;
  return { name, number: groupAccount(account.accountNumber), tag, all: `${name}\nBeetle · ${account.accountNumber}\nOr on Beetle: $${tag}` };
}
