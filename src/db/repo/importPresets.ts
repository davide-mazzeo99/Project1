import { db } from '@/db/db'
import { makeId } from '@/lib/id'
import type { ImportPreset } from '@/types'

export async function listPresets(): Promise<ImportPreset[]> {
  return db.importPresets.orderBy('createdAt').reverse().toArray()
}

export async function getPresetForInstitution(institution: ImportPreset['institution']): Promise<ImportPreset | undefined> {
  return db.importPresets.where('institution').equals(institution).last()
}

export async function savePreset(input: Omit<ImportPreset, 'id' | 'createdAt'>): Promise<ImportPreset> {
  const preset: ImportPreset = { ...input, id: makeId(), createdAt: Date.now() }
  await db.importPresets.add(preset)
  return preset
}

export async function deletePreset(id: string): Promise<void> {
  await db.importPresets.delete(id)
}
