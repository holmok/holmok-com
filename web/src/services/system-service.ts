import SystemData from '../data/system-data'
import Pino from 'pino'

export default class SystemService {
  constructor (
    private readonly data: SystemData,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('SystemService constructor called')
  }

  async ready (): Promise<void> {
    this.logger.debug('SystemService ready called')
    await this.data.ready()
  }
}
