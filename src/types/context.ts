import type { I18nContextFlavor, TemplateData } from '@grammyjs/i18n'
import type { Context, SessionFlavor } from 'grammy'

import type { Database } from '../config/database.js'
import type { Extra } from './telegram.js'

export interface Custom<C extends Context> {
  text: (
    text: string,
    templateData?: TemplateData,
    extra?: Extra
  ) => ReturnType<C['reply']>
  db: Database
}

export type CustomContextMethods = Custom<Context>

export type CustomContext = Context &
  Custom<Context> &
  I18nContextFlavor &
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  SessionFlavor<{}>
