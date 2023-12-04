import type { Collection } from 'mongodb'
import { MongoClient } from 'mongodb'

import type { Member } from '../services/aoc-api.js'

export type Group = {
  id: number
}

export type Database = {
  member: Collection<Member>
  group: Collection<Group>
}

export async function connectToDb() {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING)
  await client.connect()
  const mongoDb = client.db()
  const member = mongoDb.collection<Member>('member')
  const group = mongoDb.collection<Group>('group')
  const database: Database = { member, group }
  return database
}
