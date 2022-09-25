import Config from 'config'
import Pino from 'pino'
import Knex, { Knex as k } from 'knex'

import UserData from './user-data'
import PhotoCategoryData from './photo-category-data'
import System from './system-data'

export interface Data {
  photoCategoryData: () => PhotoCategoryData
  userData: () => UserData
  systemData: () => System
  stop: () => Promise<void>
}

export default function data (config: Config.IConfig, logger: Pino.Logger): Data {
  logger.info('data initialize called')
  const knexConfig = config.get<k.Config>('knex')
  logger.debug(JSON.stringify(knexConfig, null, 2))
  const knex = Knex(knexConfig)
  const users = new UserData(knex, logger)
  const photoCategories = new PhotoCategoryData(knex, logger)
  const system = new System(knex, logger)
  return {
    photoCategoryData: () => photoCategories,
    userData: () => users,
    systemData: () => system,
    stop: async () => await knex.destroy()
  }
}
