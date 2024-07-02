import Koa from 'koa'
import Router from '@koa/router'
import cors from '@koa/cors'
import koaLogger from 'koa-logger'
import winston from 'winston'
import proxy from 'koa-proxies'

import { connectPg } from './db'
import { cacheResult } from './cache'
import { getTile } from './tiles'
import { getVecTile } from './vectiles'

const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
})

const app = new Koa()
app.use(koaLogger(str => logger.info(str)))
app.use(cors())

const router = new Router()

router.get('/', async ctx => { ctx.body = 'Hello world.' })

router.get('/tiles/:theme/:z(\\d+)/:x(\\d+)/:y(\\d+).png',
  connectPg,
  async (ctx, next) => {
    ctx.set('Content-Type', 'image/png')
    return next()
  },
  cacheResult,
  async ctx => {
    const z = parseInt(ctx.params.z)
    const x = parseInt(ctx.params.x)
    const y = parseInt(ctx.params.y)

    const tile = await getTile(ctx.pg, ctx.params.theme, z, x, y)
    if (!tile) ctx.throw(404)
    ctx.body = tile
  }
)

router.get('/tiles/:theme/:z(\\d+)/:x(\\d+)/:y(\\d+).mvt',
  connectPg,
  async (ctx, next) => {
    ctx.set('Content-Type', 'application/vnd.mapbox-vector-tile')
    return next()
  },
  cacheResult,
  async ctx => {
    const z = parseInt(ctx.params.z)
    const x = parseInt(ctx.params.x)
    const y = parseInt(ctx.params.y)

    const tile = await getVecTile(ctx.pg, ctx.params.theme, z, x, y)
    if (!tile) ctx.throw(404)
    ctx.body = tile
  }
)

app.use(proxy('/ngi-aerial', {
  target: 'https://aerial.openstreetmap.org.za/',
  changeOrigin: true,
  rewrite: path => path.replace('/ngi-aerial', '/layer/ngi-aerial')
}))

app.use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || 3000
app.listen(port, function (err) {
  if (err) {
    logger.error(`Error starting server: ${err}`)
    process.exit(1)
  }

  logger.info(`Server listening on port ${port}`)
})
