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

Frecuencia sugerida: cada 15 minutos durante la rueda de mercado.

## Actualizacion periodica sin PPI

El repositorio incluye un actualizador seguro:

- `tools/update-watchlist.mjs`: mezcla precios publicos dentro de `data/watchlist.json`.
- `.github/workflows/update-watchlist.yml`: corre cada 15 minutos de lunes a viernes entre 14:00 y 21:59 UTC, o manualmente desde Actions.
- `tools/fetch-public-prices.mjs`: intenta resolver cada ticker contra fuentes publicas sin login.

El workflow no requiere variables, secrets ni credenciales. Usa fuentes publicas sin login.

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

## Publicacion rapida

GitHub Pages:

1. Subir estos archivos al repositorio.
2. Activar Pages desde `Settings > Pages`.
3. Elegir la rama principal y la carpeta raiz.

Netlify o Vercel:

1. Importar el repositorio.
2. Usar configuracion de sitio estatico sin build command.
3. Publicar desde la carpeta raiz.
