import type { Database } from '../config/database.js'
import type { Member } from './aoc-api.js'

export async function getMembers(db: Database): Promise<Member[]> {
  return await db.member
    .aggregate<Member>([
      {
        $sort: {
          localScore: -1
        } as Partial<Member>
      }
    ])
    .toArray()
}

export async function saveMembers(
  db: Database,
  members: Member[]
): Promise<void> {
  await db.member.insertMany(members)
}
