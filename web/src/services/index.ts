import Pino from 'pino'
import Config from 'config'
import Data from '../data'

import UserService from './user-service'
import PhotoCategoryService from './photo-category-service'

export interface ServiceProviders {
  photoCategoryService: () => PhotoCategoryService
  userService: () => UserService
  stop: () => Promise<void>
}

export default function services (config: Config.IConfig, logger: Pino.Logger): ServiceProviders {
  logger.info('services initialize called')
  const data = Data(config, logger)
  return {
    userService: () => new UserService(data.userData(), logger, config),
    photoCategoryService: () => new PhotoCategoryService(data.photoCategoryData(), logger),
    stop: async () => await data.stop()
  }
}
