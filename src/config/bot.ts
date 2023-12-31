import type { I18n } from '@grammyjs/i18n'
import { Bot as TelegramBot, session } from 'grammy'

import { resolvePath } from '../helpers/resolve-path.js'
import { createReplyWithTextFunc } from '../services/context.js'
import type { CustomContext } from '../types/context.js'
import { initLocaleEngine } from './locale-engine.js'
import { startController } from '../controllers/start.js'
import { leaderboardController } from '../controllers/leaderboard.js'
import type { Bot } from '../types/telegram.js'
import type { Database } from './database.js'
import { saveGroup } from '../services/group.js'
import { progressController } from '../controllers/progress.js'

function extendContext(bot: Bot, database: Database) {
  bot.use(async (ctx, next) => {
    if (!ctx.chat || !ctx.from) {
      return
    }

    ctx.db = database
    await saveGroup(database, ctx.chat.id)

    ctx.text = createReplyWithTextFunc(ctx)

    await next()
  })
}

function setupMiddlewares(bot: Bot, localeEngine: I18n) {
  bot.use(session())
  bot.use(localeEngine.middleware())
  bot.catch(console.error)
}

function setupControllers(bot: Bot) {
  bot.use(startController)
  bot.use(leaderboardController)
  bot.use(progressController)
}

export async function startBot(
  database: Database
): Promise<{ bot: Bot; i18n: I18n }> {
  const localesPath = resolvePath(import.meta.url, '../locales')
  const i18n = initLocaleEngine(localesPath)
  const bot = new TelegramBot<CustomContext>(process.env.TOKEN)
  extendContext(bot, database)
  setupMiddlewares(bot, i18n)
  setupControllers(bot)

  // NOTE: Resolves only when bot is stopped
  // so give it a second to start instead of `await`
  bot.start()

  return new Promise(resolve => setTimeout(() => resolve({ bot, i18n }), 1_000))
}
