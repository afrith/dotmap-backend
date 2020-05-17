import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost/dotmap'

const pool = new Pool({ connectionString })

export const connectPg = async (ctx, next) => {
  ctx.pg = await pool.connect()
  try {
    await next()
  } finally {
    ctx.pg.release()
  }
}
