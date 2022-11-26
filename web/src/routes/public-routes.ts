import KoaRouter from '@koa/router'
import { ServerContext, ServerContextState } from '../middleware'
import Validator from 'validator'

export default function PublicRoutes (): KoaRouter<ServerContextState, ServerContext> {
  const router = new KoaRouter<ServerContextState, ServerContext>()

  router.get('/', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    ctx.render('index', { title: 'home', status })
  })

  router.get('/ready', async (ctx) => {
    const system = ctx.state.services.system()
    await system.ready()
    ctx.body = { ready: true, timestamp: new Date().toISOString() }
  })

  router.get('/ok', async (ctx) => {
    ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
  })

  router.get('/about', async (ctx) => {
    ctx.render('about', { title: 'about' })
  })

  router.get('/logout', async (ctx) => {
    ctx.state.logout()
    ctx.state.setValue('status', ['You are logged out.'])
    ctx.redirect('/')
  })

  router.get('/login', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('login', { title: 'log in', status, errors })
  })

  router.post('/login', async (ctx) => {
    const form = ctx.request.body as { email: string, password: string } | undefined
    if (form == null) throw new Error('No form data')

    const errors: string[] = []

    const email = form.email as string | undefined ?? ''
    const password = form.password as string | undefined ?? ''

    if (Validator.isEmpty(email)) {
      errors.push('Email is required')
    } else if (!Validator.isEmail(email)) {
      errors.push('Email is invalid')
    }

    if (Validator.isEmpty(password)) {
      errors.push('Password is required')
    }

    if (errors.length === 0) {
      try {
        const users = ctx.state.services.user()
        const userLogin = { email, password }
        const user = await users.getByLogIn(userLogin)
        ctx.state.setUserToken(user)
        ctx.log.debug(`logged in user ${user.id.toString(10)}`)
        ctx.state.setValue('status', ['You are logged in.'])
        ctx.redirect('/admin')
      } catch (error: any) {
        ctx.state.setValue('errors', [error.message])
        ctx.redirect('/login')
      }
    } else {
      ctx.state.setValue('errors', errors)
      ctx.redirect('/login')
    }
  })

  return router
}
