import type { AnyBulkWriteOperation, UnorderedBulkOperation } from 'mongodb'
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
  const ids = members.map(member => member.id)

  const creators = members.flatMap(member => [
    {
      updateOne: {
        filter: { id: member.id },
        update: {
          $set: {
            id: member.id,
            name: member.name,
            years: []
          }
        },
        upsert: true
      }
    }
  ])

  const setters = members.flatMap(member => [
    {
      updateOne: {
        filter: { id: member.id },
        update: {
          $set: {
            name: member.name,
            'years.$[elem].timings': member.timings,
            'years.$[elem].stars': member.stars,
            'years.$[elem].flakes': member.flakes
          }
        },
        arrayFilters: [{ 'elem.year': year }]
      }
    }
  ])

  const operations: AnyBulkWriteOperation<Member>[] = [
    ...creators,
    {
      updateMany: {
        filter: { 'years.year': year },
        update: { $pull: { years: { year } } }
      }
    },
    {
      updateMany: {
        filter: { id: { $in: ids } },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        update: { $push: { years: { year } as any } }
      }
    },
    ...setters
  ]

  await db.member.bulkWrite(operations, { ordered: true })
}
