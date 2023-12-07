import type { Database } from '../config/database.js'

export type Member = {
  id: number
  name: string | null
  timings: {
    day: number
    task: number
    date: Date
  }[]
  stars: number
  localScore: number
}

export async function getMembers(db: Database): Promise<Member[]> {
  return await db.member
    .aggregate<Member>([
      {
        $sort: { localScore: -1 } as Partial<Member>
      }
    ])
    .toArray()
}

export async function saveMembers(
  db: Database,
  members: Member[]
): Promise<void> {
  await db.member.deleteMany({})
  await db.member.insertMany(members)
}
