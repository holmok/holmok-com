import KoaRouter from '@koa/router'
import { ServerContext, ServerContextState } from '../middleware'
import { Authorize } from '../middleware/auth-handler'

export default function PublicRoutes (): KoaRouter<ServerContextState, ServerContext> {
  const router = new KoaRouter<ServerContextState, ServerContext>()

  router.use(Authorize())
  router.prefix('/admin')

  router.get('/photo-upload', async (ctx) => {
    ctx.render('photo-upload', { title: 'photo-upload' })
  })

  router.post('/photo-upload', async (ctx) => {
    const { files } = ctx.request
    if (!Array.isArray(files?.file) && files?.file != null) {
      const { originalFilename, filepath } = files.file
      const { imageService } = ctx.state.services
      await imageService().processAndSavePhoto(originalFilename as string, filepath)
    }
    ctx.body = { success: true }
  })

  router.get('/', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    ctx.render('admin', { title: 'admin', status })
  })

  router.get('/photo-categories', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const categories = ctx.state.services.photoCategoryService()
    ctx.render('photo-categories', { title: 'photo categories', status, categories: await categories.getAll(false) })
  })

  router.get('/photo-categories/create', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('photo-category', { title: 'create photo category', status, errors })
  })

  router.post('/photo-categories/create', async (ctx) => {
    const form = ctx.request.body
    if (form == null) throw new Error('No form data')

    const errors: string[] = []

    const name = form.name as string | undefined ?? ''
    const stub = form.stub as string | undefined ?? ''
    const description = form.description as string | undefined ?? ''

    if (name.length === 0) {
      errors.push('Name is required')
    }

    if (stub.length === 0) {
      errors.push('Stub is required')
    }

    if (errors.length === 0) {
      try {
        const categories = ctx.state.services.photoCategoryService()
        const category = await categories.create({ name, description, stub })
        ctx.state.setValue('status', [`Created photo category ${category.name}`])
        ctx.redirect('/admin/photo-categories')
      } catch (error: any) {
        ctx.state.setValue('errors', [error.message])
        ctx.redirect('/admin/photo-categories/create')
      }
    } else {
      ctx.state.setValue('errors', errors)
      ctx.redirect('/admin/photo-categories/create')
    }
  })

  router.get('/photo-categories/clear-cache', async (ctx) => {
    const categories = ctx.state.services.photoCategoryService()
    categories.clearCache()
    ctx.redirect('/admin/photo-categories')
  })

  router.get('/photo-categories/:id', async (ctx) => {
    const id = parseInt(ctx.params.id ?? '-1')
    const categories = ctx.state.services.photoCategoryService()
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('photo-category', { title: 'create photo category', status, errors, category: await categories.getById(id) })
  })

  router.post('/photo-categories/:id', async (ctx) => {
    const id = parseInt(ctx.params.id ?? '-1')
    const form = ctx.request.body
    if (form == null) throw new Error('No form data')

    const errors: string[] = []

    const name = form.name as string | undefined ?? ''
    const stub = form.stub as string | undefined ?? ''
    const description = form.description as string | undefined ?? ''
    const active = form.active != null
    const deleted = form.deleted != null

    if (name.length === 0) {
      errors.push('Name is required')
    }

    if (stub.length === 0) {
      errors.push('Stub is required')
    }

    if (errors.length === 0) {
      try {
        const categories = ctx.state.services.photoCategoryService()
        const category = await categories.update({ name, description, stub, active, deleted, id })
        ctx.state.setValue('status', [`Updated photo category ${category.name}`])
        ctx.redirect('/admin/photo-categories')
      } catch (error: any) {
        ctx.state.setValue('errors', [error.message])
        ctx.redirect('/admin/photo-categories/create')
      }
    } else {
      ctx.state.setValue('errors', errors)
      ctx.redirect('/admin/photo-categories/create')
    }
  })

  return router
}
