import KoaRouter from '@koa/router'
import KoaBody from 'koa-body'
import { ServerContext, ServerContextState } from '../middleware'
import { Authorize } from '../middleware/auth-handler'

export default function PublicRoutes (): KoaRouter<ServerContextState, ServerContext> {
  const router = new KoaRouter<ServerContextState, ServerContext>()

  router.use(Authorize())
  router.prefix('/admin')

  router.get('/photo-upload', async (ctx) => {
    ctx.render('photo-upload', { title: 'photo-upload' })
  })

  router.post('/photo-upload', KoaBody({ multipart: true }), async (ctx) => {
    const { files } = ctx.request
    if (!Array.isArray(files?.file) && files?.file != null) {
      const { originalFilename, filepath } = files.file
      const { photo: imageService } = ctx.state.services
      await imageService().processAndSavePhoto(originalFilename as string, filepath)
    }
    ctx.body = { success: true }
  })

  router.get('/photos/clear-cache', async (ctx) => {
    const photos = ctx.state.services.photo()
    photos.clearCache()
    ctx.state.setValue('status', ['Cache cleared.'])
    ctx.redirect('/admin/photos')
  })

  router.get('/photos/:id', async (ctx) => {
    const { photo, photoCategory } = ctx.state.services
    const id = parseInt(ctx.params.id ?? '-1')
    const image = await photo().getById(id)
    if (image == null) { ctx.throw(404, 'Photo not found') }
    const categories = await photoCategory().getAll()
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('photo-edit', { categories, errors, status, image, title: 'unedited photos' })
  })

  router.post('/photos/:id', async (ctx) => {
    const form = ctx.request.body as {
      category: string
      description: string
      stub: string
      active?: string
      deleted?: string
    } | undefined
    if (form == null) throw new Error('No form data')

    const errors: string[] = []
    if (form.category == null || form.category.trim().length === 0) errors.push('Category is required')
    if (form.description == null || form.description.trim().length === 0) errors.push('Description is required')
    if (form.stub == null || form.stub.trim().length === 0) errors.push('Stub is required')

    if (errors.length === 0) {
      const { description, stub } = form
      const photoId = parseInt(ctx.params.id ?? '-1')
      const active = form.active === 'on'
      const deleted = form.deleted === 'on'
      const categoryId = parseInt(form.category, 10)

      const photo = ctx.state.services.photo()
      console.log('photo', { photoId, deleted, active, stub, description, categoryId })
      await photo.updatePhoto(photoId, deleted, active, stub, description, categoryId)
      ctx.state.setValue('status', ['Edited photo.'])
    } else {
      ctx.state.setValue('errors', errors)
      console.log({ errors })
    }
    ctx.redirect('/admin/photos')
  })

  router.get('/photo-unedited', async (ctx) => {
    const { photo, photoCategory } = ctx.state.services
    const image = await photo().getOldestUneditedPhoto()
    if (image != null) {
      const categories = await photoCategory().getAll()
      const status = ctx.state.getValue('status') ?? []
      const errors = ctx.state.getValue('errors') ?? []
      ctx.render('photo-unedited', { categories, errors, status, image, title: 'unedited photos' })
    } else {
      ctx.render('photo-unedited-empty', { title: 'unedited photos' })
    }
  })

  router.post('/photo-unedited', async (ctx) => {
    const form = ctx.request.body as {
      id: string
      category: string
      description: string
      stub: string
      active?: string
      deleted?: string
    } | undefined
    if (form == null) throw new Error('No form data')

    const errors: string[] = []
    if (form.category == null || form.category.trim().length === 0) errors.push('Category is required')
    if (form.description == null || form.description.trim().length === 0) errors.push('Description is required')
    if (form.stub == null || form.stub.trim().length === 0) errors.push('Stub is required')

    if (errors.length === 0) {
      const { description, stub } = form
      const photoId = parseInt(form.id, 10)
      const active = form.active === 'on'
      const deleted = form.deleted === 'on'
      const categoryId = parseInt(form.category, 10)

      const photo = ctx.state.services.photo()
      await photo.updatePhoto(photoId, deleted, active, stub, description, categoryId)
      ctx.state.setValue('status', ['Updated photo.'])
    } else {
      ctx.state.setValue('errors', errors)
      console.log({ errors })
    }
    ctx.redirect('/admin/photo-unedited')
  })

  router.get('/', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    ctx.render('admin', { title: 'admin', status })
  })

  router.get('/photo-categories', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const categories = ctx.state.services.photoCategory()
    ctx.render('photo-categories', { title: 'photo categories', status, categories: await categories.getAll(false) })
  })

  router.get('/photos', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const photos = ctx.state.services.photo()
    ctx.render('photos', { title: 'photos', status, photos: await photos.getAll(false) })
  })

  router.get('/photo-categories/create', async (ctx) => {
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('photo-category', { title: 'create photo category', status, errors })
  })

  router.post('/photo-categories/create', async (ctx) => {
    const form = ctx.request.body as { name: string, stub: string, description: string } | undefined
    if (form == null) throw new Error('No form data')
    const errors: string[] = []
    const { name, stub, description } = form

    if (name.length === 0) {
      errors.push('Name is required')
    }

    if (stub.length === 0) {
      errors.push('Stub is required')
    }

    if (errors.length === 0) {
      try {
        const categories = ctx.state.services.photoCategory()
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
    const categories = ctx.state.services.photoCategory()
    categories.clearCache()
    ctx.state.setValue('status', ['Cache cleared.'])
    ctx.redirect('/admin/photo-categories')
  })

  router.get('/photo-categories/:id', async (ctx) => {
    const id = parseInt(ctx.params.id ?? '-1')
    const categories = ctx.state.services.photoCategory()
    const photos = ctx.state.services.photo()
    const status = ctx.state.getValue('status') ?? []
    const errors = ctx.state.getValue('errors') ?? []
    ctx.render('photo-category', { title: 'create photo category', status, errors, category: await categories.getById(id), photos: await photos.getByCategory(id, true) })
  })

  router.post('/photo-categories/:id', async (ctx) => {
    const id = parseInt(ctx.params.id ?? '-1')
    const form = ctx.request.body as {
      name: string
      stub: string
      description: string
      photoId?: string
      active?: string
      deleted?: string
    } | undefined
    if (form == null) throw new Error('No form data')

    const errors: string[] = []

    const { name, stub, description } = form
    const active = form.active === 'on'
    const deleted = form.deleted === 'on'
    const photoId = form.photoId != null ? parseInt(form.photoId, 10) : undefined

    if (name.length === 0) {
      errors.push('Name is required')
    }

    if (stub.length === 0) {
      errors.push('Stub is required')
    }

    if (errors.length === 0) {
      try {
        const categories = ctx.state.services.photoCategory()

        const category = await categories.update({ name, description, stub, active, deleted, id, photoId })
        ctx.state.setValue('status', [`Updated photo category ${category.name}`])
        ctx.redirect('/admin/photo-categories')
      } catch (error: any) {
        ctx.state.setValue('errors', [error.message])
        ctx.redirect(`/admin/photo-categories/${id}`)
      }
    } else {
      ctx.state.setValue('errors', errors)
      ctx.redirect(`/admin/photo-categories/${id}`)
    }
  })

  return router
}
