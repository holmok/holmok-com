import PhotoCategoryData, { PhotoCategoryDataError, PhotoCategoryRow } from '../data/photo-category-data'
import { z } from 'zod'
import Pino from 'pino'
import Cacher from './cacher'

const listCacher = new Cacher<PhotoCategoryRow[]>(5, 60)
const itemCacher = new Cacher<PhotoCategoryRow>(5, 60)

const photoCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  stub: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  created: z.date()
})

export type PhotoCategory = z.infer<typeof photoCategorySchema>

const PhotoCategoryUpdateSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  stub: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  deleted: z.boolean().optional()
})
export type PhotoCategoryUpdate = z.infer<typeof PhotoCategoryUpdateSchema>

const PhotoCategoryCreateSchema = z.object({
  name: z.string().min(1),
  stub: z.string().min(1),
  description: z.string().optional()
})
export type PhotoCategoryCreate = z.infer<typeof PhotoCategoryCreateSchema>

export class PhotoCategoryServiceError extends Error {
  constructor (message: string, public readonly innerError?: Error) {
    super(message)
    this.name = 'PhotoCategoryServiceError'
  }
}

export default class PhotoCategoryServiceProvider {
  constructor (
    private readonly data: PhotoCategoryData,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('PhotoCategoryServiceProvider.constructor called')
  }

  private mapPhotoCategory (data: PhotoCategoryRow): PhotoCategory {
    return {
      id: data.id,
      name: data.name,
      stub: data.stub,
      description: data.description,
      active: data.active,
      deleted: data.deleted,
      created: data.created
    }
  }

  async getAll (forPublic: boolean = true): Promise<PhotoCategory[]> {
    this.logger.debug('PhotoCategoryServiceProvider.getAll called')
    try {
      const output = forPublic
        ? await listCacher.get('public', async () => await this.data.getAllPublic())
        : await listCacher.get('all', async () => await this.data.getAll())
      if (output == null) throw new PhotoCategoryServiceError('PhotoCategory list not found')
      return output.map(this.mapPhotoCategory)
    } catch (error) {
      throw new PhotoCategoryServiceError('Failed to get all PhotoCategories', error as Error)
    }
  }

  async getById (id: number): Promise<PhotoCategory> {
    this.logger.debug('PhotoCategoryServiceProvider.getById called')
    z.number().positive().parse(id)
    try {
      const output = await itemCacher.get(`id-${id}`, async () => await this.data.getById(id))
      if (output == null) throw new PhotoCategoryServiceError('PhotoCategory not found')
      return this.mapPhotoCategory(output)
    } catch (error) {
      throw new PhotoCategoryServiceError('Failed to get PhotoCategory', error as Error)
    }
  }

  async getByStub (stub: string): Promise<PhotoCategory> {
    this.logger.debug('PhotoCategoryServiceProvider.getByStub called')
    z.string().min(1).parse(stub)
    try {
      const output = await itemCacher.get(`stub-${stub}`, async () => await this.data.getByStub(stub))
      if (output == null) throw new PhotoCategoryServiceError('PhotoCategory not found')
      return this.mapPhotoCategory(output)
    } catch (error) {
      throw new PhotoCategoryServiceError('Failed to get PhotoCategory', error as Error)
    }
  }

  async create (category: PhotoCategoryCreate): Promise<PhotoCategory> {
    this.logger.debug('PhotoCategoryServiceProvider.create called')
    const { name, stub, description } = PhotoCategoryCreateSchema.parse(category)
    try {
      const output = await this.data.create(name, stub, description)
      listCacher.reset()
      return this.mapPhotoCategory(output)
    } catch (error: any) {
      if (error instanceof PhotoCategoryDataError) {
        throw new PhotoCategoryServiceError(error.code)
      }
      throw new PhotoCategoryServiceError('Failed to create PhotoCategory', error as Error)
    }
  }

  async update (toUpdate: PhotoCategoryUpdate): Promise<PhotoCategory> {
    this.logger.debug('PhotoCategoryServiceProvider.update called')
    const PhotoCategory = PhotoCategoryUpdateSchema.parse(toUpdate)
    try {
      const oldPhotoCategory = await this.data.getById(toUpdate.id)
      if (oldPhotoCategory == null) throw new PhotoCategoryServiceError('PhotoCategory not found')
      const output = await this.data.update({
        id: PhotoCategory.id,
        stub: PhotoCategory.stub ?? oldPhotoCategory.stub,
        description: PhotoCategory.description ?? oldPhotoCategory.description,
        name: PhotoCategory.name ?? oldPhotoCategory.name,
        active: PhotoCategory.active ?? oldPhotoCategory.active,
        deleted: PhotoCategory.deleted ?? oldPhotoCategory.deleted
      })
      if (output == null) throw new PhotoCategoryServiceError('PhotoCategory not found')
      itemCacher.del(`id-${toUpdate.id}`)
      listCacher.reset()
      return this.mapPhotoCategory(output)
    } catch (error) {
      if (error instanceof PhotoCategoryDataError) {
        throw new PhotoCategoryServiceError(error.code)
      }
      throw new PhotoCategoryServiceError('Failed to update PhotoCategory', error as Error)
    }
  }

  clearCache (): void {
    listCacher.reset()
    itemCacher.reset()
  }
}
