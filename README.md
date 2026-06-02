# PPI Watchlist

Panel publico y estatico para seguir oportunidades de una watchlist de PPI.

## Archivos

- `index.html`: estructura del panel.
- `style.css`: tema oscuro y layout responsive.
- `script.js`: lee `data/watchlist.json`, aplica filtros y renderiza la tabla.
- `data/watchlist.json`: datos publicos sanitizados, precios, bid/ask, estado de fuente y senal automatica.

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
- `data/prices-public.example.csv`: ejemplo de feed publico sanitizado.

El actualizador solo acepta estos campos:

- `ticker`
- `price`
- `dailyChange`
- `bid`
- `ask`
- `updatedAt`

Si aparece un campo sensible como usuario, clave, token, email, CUIT, cuenta, comitente, patrimonio, liquidez, cantidad u orden, la actualizacion falla.

Para usarlo en GitHub Actions, configurar una variable del repositorio llamada `PUBLIC_PRICE_FEED_URL` con una URL publica a un CSV o JSON sanitizado. No usar secrets ni credenciales. Si esa variable no esta configurada, el workflow corre pero no modifica precios.

Ejemplo CSV publico:

```csv
ticker,price,dailyChange,bid,ask,updatedAt
GOOGLD,6.51,-4.41,6.50,6.52,2026-06-02 17:25:10 America/Buenos_Aires
CRM,16730,-3.96,16730,16750,2026-06-02 17:25:10 America/Buenos_Aires
```

Tambien se puede actualizar localmente:

```bash
node tools/update-watchlist.mjs data/prices-public.example.csv
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
