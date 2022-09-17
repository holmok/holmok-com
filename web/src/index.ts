import Config from 'config'
import Pino, { LoggerOptions } from 'pino'
import Server from './server'

const logger = Pino(Config.get<LoggerOptions>('pino'))
const server = new Server(Config, logger)

server.start()

process.once('SIGTERM', () => {
  logger.warn('SIGTERM received...')
  server.stop()
    .then(() => {
      logger.warn('Server stopped')
      process.exit(0)
    })
    .catch((error) => {
      logger.error(error)
      process.exit(1)
    })
})

process.once('SIGINT', () => {
  logger.warn('SIGINT received...')
  server.stop()
    .then(() => {
      logger.warn('Server stopped')
      process.exit(0)
    })
    .catch((error) => {
      logger.error(error)
      process.exit(1)
    })
})
