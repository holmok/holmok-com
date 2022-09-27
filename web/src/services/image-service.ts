
import Pino from 'pino'
import Sharp from 'sharp'
import Path from 'path'
import ImageData from '../data/image-data'
import Uniquey from 'uniquey'
import { Storage } from '@google-cloud/storage'

const uniquey = new Uniquey({
  length: 7,
  characters: '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
})

export default class ImageService {
  constructor (
    private readonly data: ImageData,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('ImageService constructor called')
  }

  private async uploadPhoto (path: string, input: Buffer): Promise<void> {
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

  private async resizeAndSavePhoto (originalFilename: string, path: string, width: number): Promise<void> {
    const target = Path.basename(originalFilename, Path.extname(originalFilename))
    const targetPath = `images/${width}/${target as string}-${width}.jpg`
    const buffer = await Sharp(path)
      .resize({ width })
      .jpeg({ quality: 100, progressive: true, optimizeScans: true })
      .toBuffer()
    await this.uploadPhoto(targetPath, buffer)
  }

  private async doNotResizeAndSavePhoto (originalFilename: string, path: string): Promise<void> {
    const target = Path.basename(originalFilename, Path.extname(originalFilename))
    const targetPath = `images/original/${target as string}.jpg`
    const buffer = await Sharp(path)
      .jpeg({ quality: 100, progressive: true, optimizeScans: true })
      .toBuffer()
    await this.uploadPhoto(targetPath, buffer)
  }

  async processAndSavePhoto (originalFilename: string, path: string): Promise<void> {
    this.logger.debug('processAndSavePhoto ready called')
    this.logger.debug('creating 200px image for %s', originalFilename)
    await this.resizeAndSavePhoto(originalFilename, path, 200)
    this.logger.debug('creating 600px image for %s', originalFilename)
    await this.resizeAndSavePhoto(originalFilename, path, 600)
    this.logger.debug('creating 1200px image for %s', originalFilename)
    await this.resizeAndSavePhoto(originalFilename, path, 1200)
    this.logger.debug('creating 2400px image for %s', originalFilename)
    await this.resizeAndSavePhoto(originalFilename, path, 2400)
    this.logger.debug('creating original image for %s', originalFilename)
    await this.doNotResizeAndSavePhoto(originalFilename, path)
    const name = Path.basename(originalFilename, Path.extname(originalFilename))
    const stub = uniquey.create()
    await this.data.create(name, stub)
  }
}
