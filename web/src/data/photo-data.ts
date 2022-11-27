import Pino from 'pino'
import { Knex } from 'knex'
import { z } from 'zod'

const PhotoRowSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  edited: z.boolean(),
  created: z.date()
})

export type PhotoRow = z.infer<typeof PhotoRowSchema>

const PhotoRowUpdateSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  edited: z.boolean()
})

export type PhotoRowUpdate = z.infer<typeof PhotoRowUpdateSchema>

export enum PhotoDataErrorCode {
  StubAlreadyExists = 'Stub already exists',
  UnknownError = 'Unknown error'
}

type PGError = Error & { constraint: string, code: string }

export class PhotoDataError extends Error {
  private readonly _code: PhotoDataErrorCode
  constructor (message: string, public readonly innerError: PGError, code: PhotoDataErrorCode = PhotoDataErrorCode.UnknownError) {
    super(message)
    this.name = 'PhotoDataError'
    this._code = code
    if (innerError.code === '23505' && innerError.constraint === 'photos_stub_key') {
      this._code = PhotoDataErrorCode.StubAlreadyExists
    }
  }

  get code (): PhotoDataErrorCode {
    return this._code
  }
}

export default class PhotoDataProvider {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('PhotoDataProvider constructor called')
  }

  async getAll (): Promise<PhotoRow[]> {
    this.logger.debug('PhotoDataProvider.getAll called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .orderBy('name')
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all photos')
      throw new PhotoDataError('Failed to get all photos', error as PGError)
    }
  }

  async getAllPublic (): Promise<PhotoRow[]> {
    this.logger.debug('PhotoDataProvider.getAll called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .orderBy('name')
        .where({ active: true, deleted: false })
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all photos')
      throw new PhotoDataError('Failed to get all photos', error as PGError)
    }
  }

  async getByCategoryId (categoryId: number): Promise<PhotoRow[]> {
    this.logger.debug('PhotoDataProvider.getByCategoryId called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .orderBy('name')
        .where({ categoryId })
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get category photos')
      throw new PhotoDataError('Failed to get category photos', error as PGError)
    }
  }

  async getByCategoryIdPublic (categoryId: number): Promise<PhotoRow[]> {
    this.logger.debug('PhotoDataProvider.getByCategoryIdPublic called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .orderBy('name')
        .where({ categoryId, active: true, deleted: false })
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get category photos')
      throw new PhotoDataError('Failed to get category photos', error as PGError)
    }
  }

  async getById (id: number): Promise<PhotoRow | undefined> {
    this.logger.debug('PhotoDataProvider.getById called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .where({ id })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user photo by id (id=${id})`)
      throw new PhotoDataError('Failed to get photo by id', error as PGError)
    }
  }

  async getByStub (stub: string): Promise<PhotoRow | undefined> {
    this.logger.debug('PhotoDataProvider.getByStub called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .where({ stub, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user photo by stub (id=${stub})`)
      throw new PhotoDataError('Failed to get photo by stub', error as PGError)
    }
  }

  async create (name: string, stub: string, description?: string): Promise<PhotoRow> {
    this.logger.debug('PhotoDataProvider.create called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .insert({ name, stub, description, active: false, deleted: false })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to create photo (name=${name})`)
      throw new PhotoDataError('Failed to create photo', error as PGError)
    }
  }

  async getOldestUneditedPhoto (): Promise<PhotoRow | undefined> {
    this.logger.debug('PhotoDataProvider.getOldestUneditedPhoto called')
    try {
      const output = await this.db<PhotoRow>('photos')
        .where({ edited: false, deleted: false })
        .orderBy('created')
        .first()
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get oldest unedited photo')
      throw new PhotoDataError('Failed to get oldest unedited photo', error as PGError)
    }
  }

  async update (photo: PhotoRowUpdate): Promise<PhotoRow | undefined> {
    this.logger.debug('PhotoDataProvider.update called')
    const data = PhotoRowUpdateSchema.parse(photo)
    try {
      const output = await this.db<PhotoRow>('photos')
        .update(data)
        .where({ id: photo.id })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to update photo (name=${photo.name})`)
      throw new PhotoDataError('Failed to update photo', error as PGError)
    }
  }
}
