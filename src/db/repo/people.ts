import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import type { Person } from '@/types'

export async function listPeople(): Promise<Person[]> {
  return db.people.orderBy('name').toArray()
}

export async function addPerson(name: string): Promise<Person> {
  const person: Person = { id: makeId(), name: name.trim() }
  await db.people.add(person)
  return person
}

export async function renamePerson(id: string, name: string): Promise<void> {
  await db.people.update(id, { name: name.trim() })
}

/** Deletes a person and strips their share from every transaction split (the expense itself is untouched). */
export async function deletePerson(id: string): Promise<void> {
  await db.transaction('rw', db.people, db.transactions, async () => {
    const affected = await db.transactions.filter((t) => !!t.splits?.some((s) => s.personId === id)).toArray()
    for (const t of affected) {
      await db.transactions.update(t.id, { splits: t.splits!.filter((s) => s.personId !== id) })
    }
    await db.people.delete(id)
  })
}
