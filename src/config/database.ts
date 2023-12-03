import type { Collection } from 'mongodb'
import { MongoClient } from 'mongodb'

import type { Member } from '../services/aoc-api.js'

export type Database = {
  member: Collection<Member>
}

export async function connectToDb() {
  const client = new MongoClient(process.env.DB_CONNECTION_STRING)
  await client.connect()
  const mongoDb = client.db()
  const member = mongoDb.collection<Member>('member')
  const database: Database = { member }
  return database
}
