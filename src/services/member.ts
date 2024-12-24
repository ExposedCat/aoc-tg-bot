import type { AnyBulkWriteOperation } from 'mongodb'
import type { Database } from '../config/database.js'

export type Member = {
  id: number
  name: string | null
  years: {
    year: number
    timings: {
      day: number
      task: number
      date: Date
    }[]
    stars: number
    flakes: number
  }[]
}

export type FlatMember = Pick<Member, 'id' | 'name'> &
  Omit<Member['years'][number], 'year'>

export async function getMembers(
  db: Database,
  year: number
): Promise<FlatMember[]> {
  const members = await db.member
    .aggregate<Member>([
      { $unwind: '$years' },
      { $match: { 'years.year': year } },
      { $sort: { 'years.flakes': -1 } }
    ])
    .toArray()

  return members.map(({ id, name, years }) => ({
    id,
    name,
    ...(years as unknown as Member['years'][number])
  }))
}

export async function saveMembers(
  db: Database,
  year: number,
  members: FlatMember[]
): Promise<void> {
  await db.member.updateMany(
    { id: { $in: members.map(member => member.id) } },
    { $pull: { years: { year } } }
  )

  const updates = members.flatMap<AnyBulkWriteOperation<Member>>(
    ({ id, name, ...member }) => [
      {
        updateOne: {
          filter: { id, 'years.year': year },
          update: {
            $set: { name },
            $push: { years: { year, ...member } }
          },
          upsert: true
        }
      }
    ]
  )

  await db.member.bulkWrite(updates)
}
