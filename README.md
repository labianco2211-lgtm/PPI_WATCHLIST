# PPI Watchlist

Panel publico y estatico para seguir oportunidades de una watchlist de PPI.

## Archivos

- `index.html`: estructura del panel.
- `style.css`: tema oscuro y layout responsive.
- `script.js`: lee `data/watchlist.json`, aplica filtros y renderiza la tabla.
- `data/watchlist.json`: datos publicos sanitizados, precios, bid/ask, estado de fuente y senal automatica.
- `tools/fetch-public-prices.mjs`: modulo de fuentes publicas sin credenciales.

## Seguridad

Este sitio esta pensado para publicarse en GitHub Pages, Netlify, Vercel o cualquier hosting estatico.

No se conecta a PPI, no ejecuta ordenes, no usa credenciales, no usa claves API y no necesita backend. Solo muestra activos, precios observados, puntas, prioridades, gatillos y observaciones de seguimiento.

## Senales automaticas

- `REVISAR COMPRA`: precio observado o ask menor o igual al gatillo de compra.
- `CERCA DE COMPRA`: precio observado hasta 1,5% arriba del gatillo de compra.
- `REVISAR VENTA`: precio observado mayor o igual al gatillo de venta parcial.
- `EVITAR`: prioridad `Descartar`.
- `MANTENER`: sin gatillo activo.

Las senales son alertas para revisar con contexto de mercado. No son ordenes automaticas ni recomendaciones cerradas.

## Actualizacion

Para actualizar el panel:

1. Editar precios, puntas, gatillos u observaciones en `data/watchlist.json`.
2. Mantener solo datos publicos sanitizados.
3. Publicar reemplazando los mismos archivos.

Frecuencia operativa: cada 30 minutos durante la rueda de mercado argentina.

## Actualizacion periodica sin PPI

El repositorio incluye un actualizador seguro:

- `tools/update-watchlist.mjs`: mezcla precios publicos dentro de `data/watchlist.json`.
- `.github/workflows/update-watchlist.yml`: corre cada 30 minutos de lunes a viernes durante mercado argentino, o manualmente desde Actions.
- `tools/fetch-public-prices.mjs`: intenta resolver cada ticker contra fuentes publicas sin login.

El workflow no requiere variables, secrets ni credenciales. Usa fuentes publicas sin login.

Horario operativo America/Argentina/Buenos_Aires:

- 10:35, 11:05, 11:35, 12:05, 12:35, 13:05, 13:35, 14:05, 14:35, 15:05, 15:35, 16:05, 16:35 y 17:05.

La pantalla publica vuelve a leer `data/watchlist.json` cada 30 minutos y tambien permite forzar lectura con el boton `Actualizar ahora`. El fetch usa cache-busting con `data/watchlist.json?v=timestamp`.

El JSON publica metadatos de monitoreo:

- `lastUpdated` y `lastUpdatedArgentina`.
- `nextUpdate` y `nextUpdateArgentina`.
- `source`.
- `runId` y `buildId`.
- `updateStatus`: `OK` o `ERROR`.
- `updateError`, cuando exista.

Si el JSON tiene mas de 35 minutos de antiguedad durante horario de mercado, la pantalla muestra `WATCHLIST DESACTUALIZADA`.

El workflow commitea `data/watchlist.json` en la misma rama desde la que corre el HTML publico. Para que GitHub Pages publique el JSON actualizado, Pages debe apuntar a esa misma rama y carpeta del sitio.

Fuente principal:

- Yahoo Finance Chart publico (`query1.finance.yahoo.com/v8/finance/chart/{ticker}.BA`).
- Para `GOOGLD` se usa el simbolo publico `GOGLD.BA`, porque Yahoo no publica `GOOGLD.BA`.

Limitaciones:

- La fuente publica no entrega bid/ask confiable para estas especies. El sistema conserva el ultimo bid/ask conocido o deja `null` y lo marca en `bidAskStatus`.
- Si una especie no tiene fuente publica confiable, queda con `sourceReliability: "unreliable"` y el panel muestra `Estado de fuente: No confiable`.
- Si la fuente esta stale, queda con `sourceReliability: "stale"` y el panel muestra `Estado de fuente: Ultimo conocido`.
- Las senales `REVISAR COMPRA` y `REVISAR VENTA` se bloquean cuando la fuente esta stale o no confiable. No se genera senal accionable basada solo en datos viejos.

Tambien se puede probar localmente:

```bash
node tools/update-watchlist.mjs
```

El monitoreo principal es GitHub Actions. Para uso local, abrir la pagina con un servidor estatico y dejarla abierta: el navegador relee el JSON cada 30 minutos. Si se quiere actualizar el JSON local sin GitHub, ejecutar `node tools/update-watchlist.mjs` manualmente o programarlo cada 30 minutos en el sistema operativo.

Tambien existe `actualizar_watchlist_cada_30_min.bat`, que ejecuta el actualizador local en bucle cada 30 minutos hasta detenerlo con `Ctrl+C`.

## Publicacion rapida

GitHub Pages:

1. Subir estos archivos al repositorio.
2. Activar Pages desde `Settings > Pages`.
3. Elegir la rama principal y la carpeta raiz.

Netlify o Vercel:

1. Importar el repositorio.
2. Usar configuracion de sitio estatico sin build command.
3. Publicar desde la carpeta raiz.
