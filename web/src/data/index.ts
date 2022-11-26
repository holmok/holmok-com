import Config from 'config'
import Pino from 'pino'
import Knex, { Knex as k } from 'knex'

import UserDataProvider from './user-data'
import PhotoCategoryDataProvider from './photo-category-data'
import SystemDataProvider from './system-data'
import PhotoDataProvider from './photo-data'

export interface Data {
  photoCategory: () => PhotoCategoryDataProvider
  user: () => UserDataProvider
  system: () => SystemDataProvider
  photo: () => PhotoDataProvider
  stop: () => Promise<void>
}

export default function data (config: Config.IConfig, logger: Pino.Logger): Data {
  logger.info('data initialize called')
  const knexConfig = config.get<k.Config>('knex')
  const knex = Knex(knexConfig)
  return {
    photoCategory: () => new PhotoCategoryDataProvider(knex, logger),
    user: () => new UserDataProvider(knex, logger),
    system: () => new SystemDataProvider(knex, logger),
    photo: () => new PhotoDataProvider(knex, logger),
    stop: async () => await knex.destroy()
  }
}
