
import Pino from 'pino'
import Sharp from 'sharp'
import PhotoData, { PhotoRow } from '../data/photo-data'
import Uniquey from 'uniquey'
import { Storage } from '@google-cloud/storage'
import Cacher from './cacher'

const listCacher = new Cacher<PhotoRow[]>(5, 60)
const itemCacher = new Cacher<PhotoRow>(5, 60)

const uniquey = new Uniquey({
  length: 16,
  characters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
})

export interface Photo {
  id: number
  name: string
  stub: string
  description?: string
  categoryId: number
  active: boolean
  deleted: boolean
  encodedName: string
}

export default class PhotoServiceProvider {
  constructor (
    private readonly data: PhotoData,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('PhotoServiceProvider.constructor called')
  }

  private mapRowToPhoto (row: any): Photo {
    return {
      id: row.id,
      name: row.name,
      stub: row.stub,
      description: row.description,
      categoryId: row.categoryId,
      active: row.active,
      deleted: row.deleted,
      encodedName: encodeURIComponent(row.name)
    }
  }

  private async uploadPhoto (path: string, input: Buffer): Promise<void> {
    this.logger.debug('PhotoServiceProvider.uploadPhoto called')

    return await new Promise((resolve, reject) => {
      const storage = new Storage({ projectId: 'holmok-com' })
      const bucket = storage.bucket('static.holmok.com', { userProject: 'holmok-com' })
      const stream = bucket.file(path).createWriteStream()
      stream.on('finish', () => {
        resolve()
      })
      stream.on('error', (err) => { reject(err) })
      stream.write(input)
      stream.end()
    })
  }

  private async resizeAndSavePhoto (path: string, width: number, newFilename: string): Promise<void> {
    this.logger.debug('PhotoServiceProvider.resizeAndSavePhoto called')
    const targetPath = `photos/${width}/${newFilename}-${width}.jpg`
    const buffer = await Sharp(path)
      .resize({ width })
      .jpeg({ quality: 100, progressive: true, optimizeScans: true })
      .toBuffer()
    await this.uploadPhoto(targetPath, buffer)
  }

  private async doNotResizeAndSavePhoto (path: string, newFilename: string): Promise<void> {
    this.logger.debug('PhotoServiceProvider.doNotResizeAndSavePhoto called')
    const targetPath = `photos/original/${newFilename}.jpg`
    const buffer = await Sharp(path)
      .jpeg({ quality: 100, progressive: true, optimizeScans: true })
      .toBuffer()
    await this.uploadPhoto(targetPath, buffer)
  }

  async processAndSavePhoto (originalFilename: string, path: string): Promise<void> {
    this.logger.debug('PhotoServiceProvider.processAndSavePhoto called')
    const newFilename = uniquey.create()
    this.logger.debug('processAndSavePhoto ready called')
    this.logger.debug('creating 200px photo for %s', originalFilename)
    await this.resizeAndSavePhoto(path, 200, newFilename)
    this.logger.debug('creating 600px photo for %s', originalFilename)
    await this.resizeAndSavePhoto(path, 600, newFilename)
    this.logger.debug('creating 1200px photo for %s', originalFilename)
    await this.resizeAndSavePhoto(path, 1200, newFilename)
    this.logger.debug('creating 2400px photo for %s', originalFilename)
    await this.resizeAndSavePhoto(path, 2400, newFilename)
    this.logger.debug('creating original photo for %s', originalFilename)
    await this.doNotResizeAndSavePhoto(path, newFilename)
    await this.data.create(newFilename, newFilename)
  }

  async getOldestUneditedPhoto (): Promise<Photo | null> {
    this.logger.debug('PhotoServiceProvider.getOldestUneditedPhoto called')
    const result = await this.data.getOldestUneditedPhoto()
    if (result == null) {
      return null
    }
    return this.mapRowToPhoto(result)
  }

  async updatePhoto (id: number, deleted: boolean, active: boolean, stub: string, description: string, categoryId: number): Promise<void> {
    this.logger.debug('PhotoServiceProvider.updatePhoto called')
    const oldPhoto = await this.data.getById(id)
    if (oldPhoto == null) {
      throw new Error('Photo not found')
    }
    itemCacher.del(`photo_id_${id}`)
    itemCacher.del(`photo_stub_${stub}`)
    listCacher.reset()
    await this.data.update({
      id,
      description,
      stub,
      active,
      categoryId,
      name: oldPhoto.name,
      deleted,
      edited: true
    })
  }

  async getById (id: number): Promise<Photo | undefined> {
    this.logger.debug('PhotoServiceProvider.getById called')
    const output = await itemCacher.get(`photo_id_${id}`, async () => await this.data.getById(id))
    return output == null ? undefined : this.mapRowToPhoto(output)
  }

  async getByStub (stub: string): Promise<Photo | undefined> {
    this.logger.debug('PhotoServiceProvider.getByStub called')
    const output = await itemCacher.get(`photo_stub_${stub}`, async () => await this.data.getByStub(stub))
    return output == null ? undefined : this.mapRowToPhoto(output)
  }

  async getAll (forPublic: boolean = true): Promise<Photo[]> {
    this.logger.debug('PhotoServiceProvider.getAll called')

    const output = forPublic
      ? await listCacher.get('public', async () => await this.data.getAllPublic())
      : await listCacher.get('all', async () => await this.data.getAll())
    if (output == null) { return [] }
    return output.map(this.mapRowToPhoto)
  }

  async getByCategory (categoryId: number, forPublic: boolean = true): Promise<Photo[]> {
    this.logger.debug('getByCategory.getAll called')

    const output = forPublic
      ? await listCacher.get(`public_${categoryId}`, async () => await this.data.getByCategoryIdPublic(categoryId))
      : await listCacher.get(`all_${categoryId}`, async () => await this.data.getByCategoryId(categoryId))
    if (output == null) { return [] }
    return output.map(this.mapRowToPhoto)
  }

  clearCache (): void {
    listCacher.reset()
    itemCacher.reset()
  }
}
