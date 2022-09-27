import Pino from 'pino'
import { Knex } from 'knex'
import { z } from 'zod'

const ImageRowSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  edited: z.boolean(),
  created: z.date()
})

export type ImageRow = z.infer<typeof ImageRowSchema>

const ImageRowUpdateSchema = z.object({
  id: z.number(),
  stub: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
  deleted: z.boolean(),
  edited: z.boolean()
})

export type ImageRowUpdate = z.infer<typeof ImageRowUpdateSchema>

export enum ImageDataErrorCode {
  StubAlreadyExists = 'Stub already exists',
  UnknownError = 'Unknown error'
}

type PGError = Error & {constraint: string, code: string}

export class ImageDataError extends Error {
  private readonly _code: ImageDataErrorCode
  constructor (message: string, public readonly innerError: PGError, code: ImageDataErrorCode = ImageDataErrorCode.UnknownError) {
    super(message)
    this.name = 'ImageDataError'
    this._code = code
    if (innerError.code === '23505' && innerError.constraint === 'images_stub_key') {
      this._code = ImageDataErrorCode.StubAlreadyExists
    }
  }

  get code (): ImageDataErrorCode {
    return this._code
  }
}

export default class ImageData {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('ImageData constructor called')
  }

  async getAll (): Promise<ImageRow[]> {
    this.logger.debug('ImageData getAll called')
    try {
      const output = await this.db<ImageRow>('images')
        .orderBy('name')
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all images')
      throw new ImageDataError('Failed to get all images', error as PGError)
    }
  }

  async getById (id: number): Promise<ImageRow | undefined> {
    this.logger.debug('ImageData getById called')
    try {
      const output = await this.db<ImageRow>('images')
        .where({ id })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user image by id (id=${id})`)
      throw new ImageDataError('Failed to get image by id', error as PGError)
    }
  }

  async getByStub (stub: string): Promise<ImageRow | undefined> {
    this.logger.debug('ImageData getByStub called')
    try {
      const output = await this.db<ImageRow>('images')
        .where({ stub, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user image by stub (id=${stub})`)
      throw new ImageDataError('Failed to get image by stub', error as PGError)
    }
  }

  async create (name: string, stub: string, description?: string): Promise<ImageRow> {
    this.logger.debug('ImageData create called')
    try {
      const output = await this.db<ImageRow>('images')
        .insert({ name, stub, description, active: false, deleted: false })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to create image (name=${name})`)
      throw new ImageDataError('Failed to create image', error as PGError)
    }
  }

  async update (image: ImageRowUpdate): Promise<ImageRow | undefined> {
    this.logger.debug('ImageData update called')
    const data = ImageRowUpdateSchema.parse(image)
    try {
      const output = await this.db<ImageRow>('images')
        .update(data)
        .where({ id: image.id })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to update image (name=${image.name})`)
      throw new ImageDataError('Failed to update image', error as PGError)
    }
  }
}
