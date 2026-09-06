import { db } from '@/db/db'

export async function setOpeningBalance(accountId: string, openingBalance: number): Promise<void> {
  await db.accounts.update(accountId, { openingBalance })
}
