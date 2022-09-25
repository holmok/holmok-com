import Pino from 'pino'
import { Knex } from 'knex'

export default class SystemData {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('SystemData constructor called')
  }

  async ready (): Promise<void> {
    const output = await this.db.raw('SELECT 1')
    if (output == null) throw new Error('Database is not ready')
  }
}
