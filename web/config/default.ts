import KoaStatic from 'koa-static'
import Path from 'path'
import { LoggerOptions } from 'pino'
import { knexSnakeCaseMappers } from 'objection'
import { Knex } from 'knex'
import PG from 'pg'

export interface StaticOptions {
  root: string
  options: KoaStatic.Options
}

export interface ServerOptions {
  host: string
  port: number
}

export interface JwtOptions {
  secret: string
  expiresIn: string
  cookieName: string
}

export const environment = process.env.NODE_ENV ?? 'development'
export const dev = environment !== 'production'
export const name = 'holmok.com'
export const saltRounds = 10

export const keys = [
  'vZaBZZOsnZpuAH7qi6e1Pby6T7zb1pUCKVBvNdnE',
  'OPJQduwewSL1Z1Xnsk2QV0cg5ntcPozL9lJbX8xv',
  'VNCpTKIUrySh4aCRGaqX7hvfsBGlz2NDiDzEEPcx',
  'OKMbrXgLHfPUuIyHZy8zmZNDg7P2ERvfpHr5C6TR',
  'bptpU6CKVBv9myv5o825yEbk5ijp3r4wXM4cWjLv'
]

export const jwt = {
  secret: 'Gay6T7zb16eaCRUCpuAHxMi1PbBvNdnEKVqvZaBZZpSh4OsnZ',
  expiresIn: '1d',
  cookieName: '_holmok'
}

export const staticOptions: StaticOptions = {
  root: Path.join(__dirname, '../static'),
  options: { gzip: true }
}

export const template = {
  root: Path.join(__dirname, '../templates/pages'),
  extname: '.art',
  debug: dev
}

export const pino: LoggerOptions = {
  name,
  level: 'debug'
}

export const server: ServerOptions = {
  host: process.env.HOST ?? 'localhost',
  port: parseInt(process.env.PORT ?? '3000', 10)
}

export const knex: Knex.Config = {
  ...knexSnakeCaseMappers(),
  client: 'postgres',
  connection: {
    host: process.env.PG_HOST ?? 'localhost',
    database: process.env.PG_DATABASE ?? 'thesignuplist',
    password: process.env.PG_PASSWORD ?? 'thesignuplist',
    user: process.env.PG_USER ?? 'thesignuplist',
    port: parseInt(process.env.PG_PORT ?? '5432', 10)
  },
  pool: {
    min: 0,
    max: 7,
    afterCreate: function (conn: PG.PoolClient, done: (err: Error | undefined, conn: PG.PoolClient) => void) {
      const schema = process.env.PG_SCHEMA ?? 'thesignuplist'
      conn.query(
        `SET search_path TO ${schema}, public;`,
        (err: Error | undefined) => {
          done(err, conn)
        })
    }
  }
}
