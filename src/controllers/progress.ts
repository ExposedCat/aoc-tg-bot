import { Composer } from 'grammy'
import type { CustomContext } from '../types/context.js'
import { getMembers } from '../services/member.js'
import { buildProgressString } from '../services/progress.js'

export const progressController = new Composer<CustomContext>()
progressController.command('progress', async ctx => {
  const members = await getMembers(ctx.db)
  const progress = buildProgressString(members)
  await ctx.text('progress', { progress })
})
