import Pino from 'pino'
import { Knex } from 'knex'

export default class SystemDataProvider {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('SystemDataProvider.constructor called')
  }

  async ready (): Promise<void> {
    this.logger.debug('SystemDataProvider.ready called')
    const output = await this.db.raw('SELECT 1')
    if (output == null) throw new Error('Database is not ready')
  }
}
