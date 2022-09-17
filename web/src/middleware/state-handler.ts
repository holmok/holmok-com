import Pino from 'pino'
import Config from 'config'
import { ServerContext } from '.'
import Koa from 'koa'
import { ServiceProviders } from '../services'

export default function StateHandler (
  config: Config.IConfig,
  logger: Pino.Logger,
  services: ServiceProviders
): (ctx: ServerContext, next: Koa.Next) => Promise<void> {
  return async (ctx, next) => {
    ctx.state.services = services
    ctx.state.config = config
    ctx.state.logger = logger
    ctx.state.dev = config.get<boolean>('dev')
    ctx.state.name = config.get<string>('name')
    await next()
  }
}
