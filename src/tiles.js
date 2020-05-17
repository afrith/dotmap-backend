import { createCanvas } from 'canvas'

const colours = {
  race: [
    'rgba(96,178,96,0.7)',
    'rgba(244,185,37,0.7)',
    'rgba(234,73,52,0.7)',
    'rgba(178,112,229,0.7)',
    'rgba(119,119,119,0.7)'
  ],
  lang: [
    'rgba(128,177,211,0.7)',
    'rgba(251,128,114,0.7)',
    'rgba(82,178,62,0.7)',
    'rgba(180,157,0,0.7)',
    'rgba(141,211,199,0.7)',
    'rgba(253,180,98,0.7)',
    'rgba(249,151,201,0.7)',
    'rgba(179,222,105,0.7)',
    'rgba(188,128,189,0.7)',
    'rgba(190,186,218,0.7)',
    'rgba(255,255,179,0.7)',
    'rgba(119,119,119,0.7)'
  ],
  hhinc: [
    'rgba(251,128,114,0.7)',
    'rgba(253,180,98,0.7)',
    'rgba(179,222,105,0.7)',
    'rgba(141,211,199,0.7)',
    'rgba(128,177,211,0.7)',
    'rgba(188,128,189,0.7)'
  ]
}

export const getTile = async (dbclient, theme, z, x, y) => {
  const themeColours = colours[theme]
  if (!themeColours) return null

  if (!validateTileCoords(z, x, y)) return null

  const [north, west] = tileToLatLon(x, y, z)
  const [south, east] = tileToLatLon(x + 1, y + 1, z)

  if (east < 16.4518 || west > 32.945 || south > -22.1248 || north < -34.8343) return null

  const xfact = 256 / (east - west)
  const yfact = 256 / (north - south)

  const canvas = createCanvas(256, 256)
  const ctx = canvas.getContext('2d')

  const result = await dbclient.query(
    `SELECT ${theme} AS idx, ST_X(geom) as x, ST_Y(geom) as y
      FROM ${theme}_${z}
      WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      ORDER BY sortrand`,
    [west, south, east, north]
  )

  for (const { idx, x, y } of result.rows) {
    ctx.fillStyle = themeColours[idx]
    ctx.beginPath()
    ctx.arc((x - west) * xfact, (north - y) * yfact, 2, 0, 2 * Math.PI)
    ctx.fill()
  }

  return canvas.toBuffer('image/png')
}

export const validateTileCoords = (z, x, y) => {
  if (z < 6 || z > 14) return false
  const maxtile = 2 ** z
  if (x < 0 || y < 0 || x >= maxtile || y >= maxtile) return false
  return true
}

const tileToLatLon = (xtile, ytile, zoom) => {
  const powz = Math.pow(2, zoom)
  const lon = xtile / powz * 360 - 180
  const n = Math.PI - 2 * Math.PI * ytile / powz
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  return [lat, lon]
}
