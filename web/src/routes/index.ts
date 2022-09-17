
import { Middleware } from '@koa/router'
import { ServerContext, ServerContextState } from '../middleware'

import PublicRoutes from './public-routes'
import SecureRoutes from './secure-routes'

export default function GetRoutes (): Array<Middleware<ServerContextState, ServerContext>> {
  const publicRoutes = PublicRoutes()
  const secureRoutes = SecureRoutes()
  const output = [
    publicRoutes.allowedMethods(),
    publicRoutes.routes(),
    secureRoutes.allowedMethods(),
    secureRoutes.routes()
  ]
  return output
}
