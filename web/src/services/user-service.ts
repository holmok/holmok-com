import UserData, { UserDataError, UserRow } from '../data/user-data'
import { z } from 'zod'
import Pino from 'pino'
import Config from 'config'
import Uniquey from 'uniquey'
import Crypto from 'crypto'

function hash(password: string, saltRounds: number): string {
  let value = password
  for (let i = 0; i < saltRounds; i++) {
    value = Crypto.createHash('sha256').update(password).digest('hex')
  }
  return value
}

function compare(password: string, hash: string, saltRounds: number): boolean {
  let value = password
  for (let i = 0; i < saltRounds; i++) {
    value = Crypto.createHash('sha256').update(password).digest('hex')
  }
  return value === hash
}

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  stub: z.string(),
  email: z.string(),
  active: z.boolean(),
  deleted: z.boolean(),
  created: z.date()
})
export type User = z.infer<typeof userSchema>

const userUpdateSchema = z.object({
  id: z.number(),
  stub: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  newPassword: z.string().optional(),
  oldPassword: z.string().optional(),
  active: z.boolean().optional(),
  deleted: z.boolean().optional()
})
export type UserUpdate = z.infer<typeof userUpdateSchema>

const userLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
})
export type UserLogin = z.infer<typeof userLoginSchema>

const userCreateSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  username: z.string().min(1)
})
export type UserCreate = z.infer<typeof userCreateSchema>

const uniquey = new Uniquey({
  characters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  length: 11
})

export class UserServiceError extends Error {
  constructor(message: string, public readonly innerError?: Error) {
    super(message)
    this.name = 'UserServiceError'
  }
}

export default class UserService {
  constructor(
    private readonly data: UserData,
    private readonly logger: Pino.Logger,
    private readonly config: Config.IConfig
  ) {
    this.logger.debug('UserService constructor called')
  }

  private mapUser(data: UserRow): User {
    return {
      id: data.id,
      username: data.username,
      stub: data.stub,
      email: data.email,
      active: data.active,
      deleted: data.deleted,
      created: data.created
    }
  }

  async getAll(): Promise<User[]> {
    this.logger.debug('UserService getAll called')
    try {
      const output = await this.data.getAll()
      return output.map(this.mapUser)
    } catch (error) {
      throw new UserServiceError('Failed to get all users', error as Error)
    }
  }

  async getById(id: number): Promise<User> {
    this.logger.debug('UserService getById called')
    z.number().positive().parse(id)
    try {
      const output = await this.data.getById(id)
      if (output == null) throw new UserServiceError('User not found')
      return this.mapUser(output)
    } catch (error) {
      throw new UserServiceError('Failed to get user', error as Error)
    }
  }

  async getByStub(stub: string): Promise<User> {
    this.logger.debug('UserService getByStub called')
    z.string().min(1).parse(stub)
    try {
      const output = await this.data.getByStub(stub)
      if (output == null) throw new UserServiceError('User not found')
      return this.mapUser(output)
    } catch (error) {
      throw new UserServiceError('Failed to get user', error as Error)
    }
  }

  async getByEmail(email: string): Promise<User> {
    this.logger.debug('UserService getByEmail called')
    z.string().min(1).parse(email)
    try {
      const output = await this.data.getByEmail(email)
      if (output == null) throw new UserServiceError('User not found')
      return this.mapUser(output)
    } catch (error) {
      throw new UserServiceError('Failed to get user', error as Error)
    }
  }

  async getByUsername(username: string): Promise<User> {
    this.logger.debug('UserService getByUsername called')
    z.string().min(1).parse(username)
    try {
      const output = await this.data.getByUsername(username)
      if (output == null) throw new UserServiceError('User not found')
      return this.mapUser(output)
    } catch (error) {
      throw new UserServiceError('Failed to get user', error as Error)
    }
  }

  async getByLogIn(login: UserLogin): Promise<User> {
    this.logger.debug('UserService getByLogIn called')
    const { email, password } = userLoginSchema.parse(login)
    let user: UserRow | undefined = undefined
    try {
      user = await this.data.getByEmail(email)
    } catch (error) {
      throw new UserServiceError('Failed to get user', error as Error)
    }
    if (user == null) throw new UserServiceError('Invalid email or password')
    const saltRounds = this.config.get<number>('saltRounds')
    const valid = compare(password, user.passwordHash, saltRounds)
    if (!valid) throw new UserServiceError('Invalid email or password')
    return this.mapUser(user)
  }

  async create(user: UserCreate): Promise<User> {
    this.logger.debug('UserService create called')
    const { email, password, username } = userCreateSchema.parse(user)
    const stub = uniquey.create()
    try {
      const saltRounds = this.config.get<number>('saltRounds')
      const passwordHash = hash(password, saltRounds)
      const output = await this.data.create(username, stub, email, passwordHash)
      return this.mapUser(output)
    } catch (error: any) {
      if (error instanceof UserDataError) {
        throw new UserServiceError(error.code)
      }
      throw new UserServiceError('Failed to create user', error as Error)
    }
  }

  async update(toUpdate: UserUpdate): Promise<User> {
    this.logger.debug('UserService update called')
    const user = userUpdateSchema.parse(toUpdate)
    try {
      const oldUser = await this.data.getById(toUpdate.id)
      if (oldUser == null) throw new UserServiceError('User not found')
      let passwordHash: string | undefined
      if (user.newPassword != null && user.oldPassword != null) {
        const saltRounds = this.config.get<number>('saltRounds')
        const valid = compare(user.oldPassword, oldUser.passwordHash, saltRounds)
        if (!valid) throw new UserServiceError('Invalid old password')
        passwordHash = hash(user.newPassword, saltRounds)
      }
      const output = await this.data.update({
        id: user.id,
        stub: user.stub ?? oldUser.stub,
        email: user.email ?? oldUser.email,
        username: user.username ?? oldUser.username,
        active: user.active ?? oldUser.active,
        deleted: user.deleted ?? oldUser.deleted,
        passwordHash: passwordHash ?? oldUser.passwordHash,
        created: oldUser.created
      })
      if (output == null) throw new UserServiceError('User not found')
      return this.mapUser(output)
    } catch (error) {
      if (error instanceof UserDataError) {
        throw new UserServiceError(error.code)
      }
      throw new UserServiceError('Failed to update user', error as Error)
    }
  }
}
