import type { Database, Group } from '../config/database.js'

export async function getGroups(db: Database): Promise<Group[]> {
  return await db.group.find().toArray()
}

export async function saveGroup(db: Database, groupId: number): Promise<void> {
  await db.group.updateOne(
    { id: groupId } as Partial<Group>,
    { $set: { id: groupId } as Partial<Group> },
    { upsert: true }
  )
}
