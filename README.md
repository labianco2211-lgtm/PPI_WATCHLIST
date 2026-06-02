# PPI Watchlist

Panel publico y estatico para seguir oportunidades de una watchlist de PPI.

## Archivos

- `index.html`: estructura del panel.
- `style.css`: tema oscuro y layout responsive.
- `script.js`: datos de watchlist, filtros, calculo de spread y senales automaticas.

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

1. Editar precios, puntas, gatillos u observaciones en `script.js`.
2. Actualizar `LAST_UPDATED`.
3. Publicar reemplazando los mismos archivos.

Frecuencia sugerida: cada 30 o 60 minutos durante la rueda de mercado.

## Publicacion rapida

GitHub Pages:

1. Subir estos archivos al repositorio.
2. Activar Pages desde `Settings > Pages`.
3. Elegir la rama principal y la carpeta raiz.

Netlify o Vercel:

1. Importar el repositorio.
2. Usar configuracion de sitio estatico sin build command.
3. Publicar desde la carpeta raiz.
