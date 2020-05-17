export const getVecTile = async (dbclient, theme, z, x, y) => {
  if (!['race', 'lang', 'hhinc'].includes(theme)) return null
  if (!validateTileCoords(z, x, y)) return null

  const query = `WITH envelope as (SELECT ST_Transform(ST_TileEnvelope($1, $2, $3), 4326) AS geom)
  SELECT ST_AsMVT(mvtgeom.*, '${theme}', 4096, 'geom', 'gid') AS mvt FROM (
    SELECT t.gid, t.${theme},
      ST_AsMVTGeom(ST_Transform(t.geom, 3857), ST_TileEnvelope($1, $2, $3)) AS geom
    FROM ${theme}_${Math.max(6, z + 1)} t JOIN envelope ON t.geom && envelope.geom
    ORDER BY sortrand
  ) mvtgeom`

  const result = await dbclient.query(query, [z, x, y])
  return result.rows[0].mvt
}

export const validateTileCoords = (z, x, y) => {
  if (z < 0 || z > 13) return false
  const maxtile = 2 ** z
  if (x < 0 || y < 0 || x >= maxtile || y >= maxtile) return false
  return true
}
