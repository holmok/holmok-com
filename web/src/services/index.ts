import Pino from 'pino'
import Config from 'config'
import Data from '../data'

import UserServiceProvider from './user-service'
import PhotoCategoryServiceProvider from './photo-category-service'
import SystemServiceProvider from './system-service'
import PhotoServiceProvider from './photo-service'

export interface ServiceProviders {
  photoCategory: () => PhotoCategoryServiceProvider
  user: () => UserServiceProvider
  system: () => SystemServiceProvider
  photo: () => PhotoServiceProvider
  stop: () => Promise<void>
}

export default function services (config: Config.IConfig, logger: Pino.Logger): ServiceProviders {
  logger.info('services initialize called')
  const data = Data(config, logger)
  return {
    user: () => new UserServiceProvider(data.user(), logger, config),
    photoCategory: () => new PhotoCategoryServiceProvider(data.photoCategory(), logger),
    system: () => new SystemServiceProvider(data.system(), logger),
    photo: () => new PhotoServiceProvider(data.photo(), logger),
    stop: async () => await data.stop()
  }
}
