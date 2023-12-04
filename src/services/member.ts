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

export type Change = {
  id: number
  name: string | null
  new: boolean
  change: number
}

export async function saveMembers(
  db: Database,
  members: Member[]
): Promise<Change[]> {
  const currentMembers = await getMembers(db)
  const changes: Change[] = []
  for (const member of members) {
    const currentMember = currentMembers.find(
      currentMember => currentMember.id === member.id
    )
    if (!currentMember) {
      changes.push({
        id: member.id,
        name: member.name,
        new: true,
        change: member.localScore
      })
    } else if (member.localScore !== currentMember.localScore) {
      changes.push({
        id: member.id,
        name: member.name,
        new: false,
        change: member.localScore - currentMember.localScore
      })
    }
  }
  await db.member.deleteMany({})
  await db.member.insertMany(members)
  return changes.sort((a, b) =>
    a.new === b.new ? b.change - a.change : Number(b.new) - Number(a.new)
  )
}
