import type { I18n } from '@grammyjs/i18n'
import { loadEnv } from '../helpers/load-env.js'
import { validateEnv } from '../helpers/validate-env.js'
import { startFetchingLeaderboard } from '../jobs/fetch-leaderboard.js'
import type { Bot } from '../types/telegram.js'
import { startBot } from './bot.js'
import type { Database } from './database.js'
import { connectToDb } from './database.js'

export async function startApp() {
  console.debug('Validating environment..')
  try {
    loadEnv()
    validateEnv(['TOKEN', 'LEADERBOARD_ID', 'SESSION', 'DB_CONNECTION_STRING'])
  } catch (error) {
    console.error('Error occurred while loading environment:', error)
    process.exit(1)
  }

  console.debug('Connecting to database..')
  let database: Database
  try {
    database = await connectToDb()
  } catch (error) {
    console.error('Error occurred while connecting to the database:', error)
    process.exit(2)
  }

  console.debug('Starting bot..')
  let bot: Bot
  let i18n: I18n
  try {
    const { bot: _bot, i18n: _i18n } = await startBot(database)
    bot = _bot
    i18n = _i18n
  } catch (error) {
    console.error('Error occurred while starting the bot:', error)
    process.exit(3)
  }

  console.debug('Starting jobs..')
  try {
    await startFetchingLeaderboard(database, bot, i18n)
  } catch (error) {
    console.error('Error occurred while starting jobs:', error)
    process.exit(2)
  }
}
