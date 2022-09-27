import Pino from 'pino'
import Config from 'config'
import Data from '../data'

import UserService from './user-service'
import PhotoCategoryService from './photo-category-service'
import SystemService from './system-service'
import ImageService from './image-service'

export interface ServiceProviders {
  photoCategoryService: () => PhotoCategoryService
  userService: () => UserService
  systemService: () => SystemService
  imageService: () => ImageService
  stop: () => Promise<void>
}

export default function services (config: Config.IConfig, logger: Pino.Logger): ServiceProviders {
  logger.info('services initialize called')
  const data = Data(config, logger)
  return {
    userService: () => new UserService(data.userData(), logger, config),
    photoCategoryService: () => new PhotoCategoryService(data.photoCategoryData(), logger),
    systemService: () => new SystemService(data.systemData(), logger),
    imageService: () => new ImageService(data.imageData(), logger),
    stop: async () => await data.stop()
  }
}
