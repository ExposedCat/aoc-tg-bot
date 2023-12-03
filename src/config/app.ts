import { loadEnv } from '../helpers/load-env.js'
import { validateEnv } from '../helpers/validate-env.js'
import { startBot } from './bot.js'

export async function startApp() {
  try {
    loadEnv()
    validateEnv(['TOKEN', 'LEADERBOARD_ID', 'SESSION'])
  } catch (error) {
    console.error('Error occurred while loading environment:', error)
    process.exit(1)
  }

  try {
    await startBot()
  } catch (error) {
    console.error('Error occurred while starting the bot:', error)
    process.exit(3)
  }
}
