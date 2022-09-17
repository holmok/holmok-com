import { ServiceProviders } from './../services/index'
import { IConfig } from 'config'
import Pino from 'pino'
import Koa from 'koa'
import Middleware, { ServerContextState, ServerContext } from '../middleware'
import { ServerOptions } from '../../config/default'
import { Server } from 'http'
import Services from '../services'

export default class WebServer {
  private server: Server | null
  private services: ServiceProviders | null
  constructor (
    private readonly config: IConfig,
    private readonly logger: Pino.Logger
  ) {
    this.server = null
    this.services = null
  }

  start (): void {
    this.logger.info('Starting server...')
    this.logger.debug('Initializing server')
    const app = new Koa<ServerContextState, ServerContext>()
    this.services = Services(this.config, this.logger)
    Middleware(app, this.config, this.logger, this.services)
    const { port, host } = this.config.get<ServerOptions>('server')
    const name = this.config.get<string>('name')
    this.server = app.listen(port, host, () => {
      this.logger.info(`${name} server running at http://${host}:${port.toString()}`)
    })
  }

  async stop (): Promise<void> {
    this.logger.info('Stopping server...')
    return await new Promise((resolve, reject) => {
      if (this.server == null) { reject(new Error('Server is not running')) } else {
        this.logger.info('Closing connections...')
        this.server.close((err) => {
          if (err != null) {
            reject(err)
          } else {
            if (this.services != null) {
              this.logger.info('Shutting down services...')
              this.services.stop()
                .then(() => resolve())
                .catch((err) => reject(err))
            } else {
              resolve()
            }
          }
        })
      }
    })
  }
}
