import Pino from 'pino'
import { Knex } from 'knex'
import { z } from 'zod'

const UserRowSchema = z.object({
  id: z.number(),
  stub: z.string(),
  username: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  active: z.boolean(),
  deleted: z.boolean(),
  created: z.date()
})

const UserRowUpdateSchema = z.object({
  id: z.number(),
  stub: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
  passwordHash: z.string().optional(),
  active: z.boolean().optional(),
  deleted: z.boolean().optional(),
  created: z.date().optional()
})

export type UserRow = z.infer<typeof UserRowSchema>
export type UserRowUpdate = z.infer<typeof UserRowUpdateSchema>

export enum UserDataErrorCode {
  UsernameAlreadyExists = 'Username already exists',
  EmailAlreadyExists = 'Email already exists',
  StubAlreadyExists = 'Stub already exists',
  UnknownError = 'Unknown error'
}

type PGError = Error & { constraint: string, code: string }

export class UserDataError extends Error {
  private readonly _code: UserDataErrorCode
  constructor (message: string, public readonly innerError: PGError, code: UserDataErrorCode = UserDataErrorCode.UnknownError) {
    super(message)
    this.name = 'UserDataError'
    this._code = code
    if (innerError.code === '23505' && innerError.constraint === 'users_email_key') {
      this._code = UserDataErrorCode.EmailAlreadyExists
    } else if (innerError.code === '23505' && innerError.constraint === 'users_username_key') {
      this._code = UserDataErrorCode.UsernameAlreadyExists
    } else if (innerError.code === '23505' && innerError.constraint === 'users_stub_key') {
      this._code = UserDataErrorCode.StubAlreadyExists
    }
  }

  get code (): UserDataErrorCode {
    return this._code
  }
}

export default class UserDataProvider {
  constructor (
    private readonly db: Knex,
    private readonly logger: Pino.Logger
  ) {
    this.logger.debug('UserDataProvider.constructor called')
  }

  async getAll (): Promise<UserRow[]> {
    this.logger.debug('UserDataProvider.getAll called')
    try {
      const output = await this.db<UserRow>('users')
      return output
    } catch (error) {
      this.logger.error(error, 'Failed to get all users')
      throw new UserDataError('Failed to get all users', error as PGError)
    }
  }

  async getById (id: number): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.getById called')
    try {
      const output = await this.db<UserRow>('users')
        .where({ id, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user by id (id=${id})`)
      throw new UserDataError('Failed to get user by id', error as PGError)
    }
  }

  async getByEmail (email: string): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.getByEmail called')
    try {
      const output = await this.db<UserRow>('users')
        .where({ email, deleted: false })
        .first()
      return output
    } catch (error: any) {
      this.logger.error(`Failed to get user by email (email=${email})\n${error?.stack as string}`)
      throw new UserDataError('Failed to get user by email', error as PGError)
    }
  }

  async getByUsername (username: string): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.getByUsername called')
    try {
      const output = await this.db<UserRow>('users')
        .where({ username, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user by username (username=${username})`)
      throw new UserDataError('Failed to get user by username', error as PGError)
    }
  }

  async getByStub (stub: string): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.getByStub called')
    try {
      const output = await this.db<UserRow>('users')
        .where({ stub, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user by stub (id=${stub})`)
      throw new UserDataError('Failed to get user by stub', error as PGError)
    }
  }

  async getByLogIn (email: string, passwordHash: string): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.getByLogIn called')
    try {
      const output = await this.db<UserRow>('users')
        .where({ email, passwordHash, active: true, deleted: false })
        .first()
      return output
    } catch (error) {
      this.logger.error(error, `Failed to get user by login (email=${email})`)
      throw new UserDataError('Failed to get user', error as PGError)
    }
  }

  async create (username: string, stub: string, email: string, passwordHash: string): Promise<UserRow> {
    this.logger.debug('UserDataProvider.create called')
    try {
      const output = await this.db<UserRow>('users')
        .insert({ username, stub, email, passwordHash, active: false, deleted: false })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to create user (email=${email})`)
      throw new UserDataError('Failed to create user', error as PGError)
    }
  }

  async update (user: UserRowUpdate): Promise<UserRow | undefined> {
    this.logger.debug('UserDataProvider.update called')
    const data = UserRowUpdateSchema.parse(user)
    try {
      const output = await this.db<UserRow>('users')
        .update(data)
        .where({ id: user.id })
        .returning('*')
      return output[0]
    } catch (error) {
      this.logger.error(error, `Failed to update user (email=${user.id})`)
      throw new UserDataError('Failed to update user', error as PGError)
    }
  }
}
