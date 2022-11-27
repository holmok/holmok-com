import Pino from 'pino'
import { Knex } from 'knex'
import { z } from 'zod'

const PhotoCategoryRowSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  description: z.string().optional(),
  photoId: z.number().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  created: z.date()
})

export type PhotoCategoryRow = z.infer<typeof PhotoCategoryRowSchema>

const PhotoCategoryRowUpdateSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  photoId: z.number().optional(),
  description: z.string().optional(),
  active: z.boolean(),
  deleted: z.boolean()
})

export type PhotoCategoryRowUpdate = z.infer<typeof PhotoCategoryRowUpdateSchema>

export enum PhotoCategoryDataErrorCode {
  StubAlreadyExists = 'Stub already exists',
  UnknownError = 'Unknown error'
}

type PGError = Error & { constraint: string, code: string }

export class PhotoCategoryDataError extends Error {
  private readonly _code: PhotoCategoryDataErrorCode
  constructor (message: string, public readonly innerError: PGError, code: PhotoCategoryDataErrorCode = PhotoCategoryDataErrorCode.UnknownError) {
    super(message)
    this.name = 'PhotoCategoryDataError'
    this._code = code
    if (innerError.code === '23505' && innerError.constraint === 'photo_categories_stub_key') {
      this._code = PhotoCategoryDataErrorCode.StubAlreadyExists
    }
  }

  get code (): PhotoCategoryDataErrorCode {
    return this._code
  }
}

export default class PhotoCategoryDataProvider {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('PhotoCategoryDataProvider.constructor called')
  }

  async getAll (): Promise<PhotoCategoryRow[]> {
    this.logger.debug('PhotoCategoryDataProvider.getAll called')
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .orderBy('name')
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all photo categories')
      throw new PhotoCategoryDataError('Failed to get all photo categories', error as PGError)
    }
  }

  async getAllPublic (): Promise<PhotoCategoryRow[]> {
    this.logger.debug('PhotoCategoryDataProvider.getAllPublic called')
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .where({ active: true, deleted: false })
        .orderBy('name')
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all photo categories')
      throw new PhotoCategoryDataError('Failed to get all photo categories', error as PGError)
    }
  }

  async getById (id: number): Promise<PhotoCategoryRow | undefined> {
    this.logger.debug('PhotoCategoryDataProvider.getById called')
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .where({ id })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user photo category by id (id=${id})`)
      throw new PhotoCategoryDataError('Failed to get photo category by id', error as PGError)
    }
  }

  async getByStub (stub: string): Promise<PhotoCategoryRow | undefined> {
    this.logger.debug('PhotoCategoryDataProvider.getByStub called')
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .where({ stub, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user photo category by stub (id=${stub})`)
      throw new PhotoCategoryDataError('Failed to get photo category by stub', error as PGError)
    }
  }

  async create (name: string, stub: string, description?: string): Promise<PhotoCategoryRow> {
    this.logger.debug('PhotoCategoryDataProvider.create called')
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .insert({ name, stub, description, active: false, deleted: false })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to create photo category (name=${name})`)
      throw new PhotoCategoryDataError('Failed to create photo category', error as PGError)
    }
  }

  async update (category: PhotoCategoryRowUpdate): Promise<PhotoCategoryRow | undefined> {
    this.logger.debug('PhotoCategoryDataProvider.update called')
    const data = PhotoCategoryRowUpdateSchema.parse(category)
    try {
      const output = await this.db<PhotoCategoryRow>('photo_categories')
        .update(data)
        .where({ id: category.id })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to update photo category (name=${category.name})`)
      throw new PhotoCategoryDataError('Failed to update photo category', error as PGError)
    }
  }
}
