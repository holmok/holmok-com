import Config from 'config'
import { ServerContext, ServerContextState } from '.'
import JWT from 'jsonwebtoken'
import { JwtOptions } from '../../config/default'
import Uniquey from 'uniquey'
import Koa from 'koa'
import { User } from '../services/user-service'

const uniquey = new Uniquey()

export interface AuthenticatedUser {
  type: string
  id: number
  username: string
  created: Date
}

export interface AnonymousUser {
  type: string
  id: string
}

function createAnonymousToken (jwt: JwtOptions, ctx: Koa.ParameterizedContext<ServerContextState>): AnonymousUser {
  const anonymous: AnonymousUser = { type: 'anonymous', id: uniquey.create() }
  const bearer = JWT.sign(anonymous, jwt.secret, { expiresIn: jwt.expiresIn })
  ctx.state.user = anonymous
  ctx.cookies.set(jwt.cookieName, bearer, { signed: true, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) })
  return anonymous
}

function createUserToken (user: User, jwt: JwtOptions, ctx: Koa.ParameterizedContext<ServerContextState>): void {
  const payload: AuthenticatedUser = {
    type: 'user',
    id: user.id,
    username: user.username,
    created: user.created
  }

  const bearer = JWT.sign(payload, jwt.secret, { expiresIn: jwt.expiresIn })
  ctx.state.user = payload
  ctx.cookies.set(jwt.cookieName, bearer, { signed: true, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) })
}

export default function AuthHandler (config: Config.IConfig): (ctx: ServerContext, next: Koa.Next) => Promise<void> {
  const jwt = config.get<JwtOptions>('jwt')
  return async (ctx: ServerContext, next: Koa.Next) => {
    ctx.state.setUserToken = (user: User) => {
      createUserToken(user, jwt, ctx)
    }
    ctx.state.logout = () => {
      createAnonymousToken(jwt, ctx)
    }

    const token = ctx.cookies.get(jwt.cookieName)
    let payload: AuthenticatedUser | AnonymousUser | any
    if (token == null) {
      payload = createAnonymousToken(jwt, ctx)
    } else {
      try {
        payload = JWT.verify(token, jwt.secret)
      } catch (error: any) {
        payload = createAnonymousToken(jwt, ctx)
      }
      ctx.state.user = payload
      ctx.state.authenticated = payload.type === 'user'
    }
    await next()
  }
}

export function Authorize (): Koa.Middleware {
  return async (ctx, next) => {
    const { user } = ctx.state
    if (user.type === 'anonymous') {
      ctx.throw(401, 'Unauthorized')
    }
    await next()
  }
}
