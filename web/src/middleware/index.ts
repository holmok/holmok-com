import Config from 'config'
import Pino from 'pino'
import Koa from 'koa'
import { ServiceProviders } from '../services'
import { User } from '../services/user-service'
import KoaLogger from 'koa-pino-logger'
import BodyParser from 'koa-bodyparser'
import StateGetterSetterHandler from './state-getter-setter-handler'
import AuthHandler, { AnonymousUser, AuthenticatedUser } from './auth-handler'
import ErrorHandler from './error-handler'
import StateHandler from './state-handler'
import Routes from '../routes'
import { StaticOptions } from '../../config/default'
import KoaStatic from 'koa-static'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Render = require('koa-art-template')

export type ServerContextState = Koa.DefaultState & {
  config: Config.IConfig
  name: string
  environment: string
  dev: boolean
  host: string
  user: AuthenticatedUser | AnonymousUser
  authenticated: boolean
  services: ServiceProviders
  getValue: (key: string) => any
  setValue: (key: string, value: any) => void
  setUserToken: (user: User) => void
  logout: () => void
}

export type ServerContext = Koa.ParameterizedContext<ServerContextState>

export default function registerMiddleware (
  app: Koa<ServerContextState, ServerContext>,
  config: Config.IConfig, logger: Pino.Logger,
  services: ServiceProviders
): void {
  logger.debug('Registering middleware')

  logger.debug('Setting app keys')
  app.keys = config.get<string[]>('keys')

  logger.debug('Registering logger middleware')
  app.use(KoaLogger({ logger }))

  logger.debug('Registering error middleware')
  app.use(ErrorHandler())

  logger.debug('Registering state getter/setter handler')
  app.use(StateGetterSetterHandler())

  logger.debug('Registering auth handler')
  app.use(AuthHandler(config))

  logger.debug('Registering Body Parser')
  app.use(BodyParser())

  logger.debug('Registering State Handler')
  app.use(StateHandler(config, logger, services))

  logger.debug('Registering art template middleware')
  Render(app, config.get('template'))

  logger.debug('Registering routes')
  const routes = Routes()
  routes.forEach(route => app.use(route))

  logger.debug('Registering static middleware')
  const staticOptions = config.get<StaticOptions>('staticOptions')
  app.use(KoaStatic(staticOptions.root, staticOptions.options))

  logger.debug('Completed registering middleware')
}
