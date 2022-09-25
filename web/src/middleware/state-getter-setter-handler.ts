import { ServerContext } from './index'
import Koa from 'koa'

export default function StateGetterSetterHandler (): (ctx: ServerContext, next: Koa.Next) => Promise<void> {
  return async (ctx: ServerContext, next: Koa.Next) => {
    ctx.state.getValue = (key: string): any | undefined => {
      const store: { [key: string]: string | undefined } = (ctx.state.store ?? {}) as { [key: string]: string | undefined }
      let value: string | undefined = store[key]
      if (value == null) {
        value = ctx.cookies.get(key)
      }
      if (value == null) return undefined
      const output = JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'))
      store[key] = undefined
      ctx.state.store = store
      ctx.state.staticPrefix = ctx.config.get('staticPrefix') as string
      ctx.cookies.set(key, null, { signed: true })
      return output
    }
    ctx.state.setValue = (key: string, value: any): void => {
      const v = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
      const store: { [key: string]: string } = (ctx.state.store ?? {}) as { [key: string]: string }
      store[key] = v
      ctx.cookies.set(key, v, { signed: true })
      ctx.state.store = store
    }
    await next()
  }
}
