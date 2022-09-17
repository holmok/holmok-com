import { ServerContext } from '.'
import Koa from 'koa'

export default function ErrorHandler (): (ctx: ServerContext, next: Koa.Next) => Promise<void> {
  return async (ctx: ServerContext, next: Koa.Next) => {
    try {
      await next()
      if (ctx.status === 404) ctx.throw(404, 'Page is not found!')
      else if (ctx.status > 400) ctx.throw(ctx.status)
    } catch (error: any) {
      ctx.status = error.status ?? 500
      ctx.log.error(error.stack)
      ctx.render('error', { message: error.message, error })
    }
  }
}
