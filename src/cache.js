import { promisify } from 'util'
import { readFile as readFileCb, mkdir as mkdirCb, writeFile as writeFileCb } from 'fs'
import { join as joinPath, parse as parsePath } from 'path'

const readFile = promisify(readFileCb)
const mkdir = promisify(mkdirCb)
const writeFile = promisify(writeFileCb)

const cacheDir = process.env.CACHE_DIR || './cache'

export const cacheResult = async (ctx, next) => {
  const cachePath = joinPath(cacheDir, ...ctx.originalUrl.split('/').filter(x => x))

  // Try to read the file from cache; if it is not there pass on
  try {
    const buffer = await readFile(cachePath)
    // if empty file, return 404
    if (buffer.length === 0) ctx.throw(404)
    ctx.body = buffer
    return
  } catch (err) {
    // ENOENT means the file didn't exist in cache
    if (err.code !== 'ENOENT') throw err
  }

  let is404 = false
  try {
    await next()
  } catch (err) {
    if (err.status === 404) is404 = true
    else throw err
  }

  // Deliberately not awaiting; this can continue asynchronously while the response is sent to the client
  mkdirAndWrite(cachePath, is404 ? Buffer.alloc(0) : ctx.body)
  if (is404) ctx.throw(404)
}

const mkdirAndWrite = async (path, data) => {
  await mkdir(parsePath(path).dir, { recursive: true })
  return writeFile(path, data)
}
