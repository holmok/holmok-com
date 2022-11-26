import SystemData from '../data/system-data'
import Pino from 'pino'

export default class SystemServiceProvider {
  constructor (
    private readonly data: SystemData,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('SystemServiceProvider.constructor called')
  }

  async ready (): Promise<void> {
    this.logger.debug('SystemServiceProvider.ready called')
    await this.data.ready()
  }
}
