# La Floresta — tablero piloto

Tablero de la finca La Floresta (Chiquitanía, Santa Cruz, Bolivia) para el dueño de la finca. Es una lectura de la operación: lotes, lluvias, labores, insumos, maquinaria, compras y pendientes. Más adelante puede crecer a un ERP y cruzarse con Synagro. Hoy no escribe en la base.

## Cómo correrlo en local

Hace falta Node 22 y pnpm.

```bash
pnpm install
pnpm dev
```

Abrí http://localhost:3000. Sin variables de entorno la clave del piloto es `floresta-piloto`.

El build de producción:

```bash
pnpm build
pnpm start
```

`npm run build` también funciona: el script es el mismo.


## Desplegar en Vercel

1. Importá el repositorio. `vercel.json` fija el preset en Next.js y el build con pnpm, aunque el proyecto se haya creado cuando el repo estaba vacío (si no, Vercel publica solo `public/` y el resto responde 404).
2. No hace falta configurar variables para el piloto. El build y el sitio funcionan sin ellas.
3. La clave inicial sigue siendo `floresta-piloto` mientras `PILOT_PASSWORD` esté vacía. El login la muestra solo en ese caso.
4. Antes de compartir el enlace, definí `PILOT_PASSWORD` y `PILOT_SESSION_SECRET` en Vercel y volvé a desplegar. La clave por defecto está en el código y no es un acceso real.

## Datos

Salen de la hoja, también en la semilla local:

- `lotes`: 56 lotes, 1.040 ha (588 de soja y 452 de maíz). A7 (`LOT-012`) no tiene superficie.
- `productos`: 37 insumos del plan de soja y maíz.
- `listas`: 78 valores (fenología, plagas, severidad, unidades).
- `tipos_labor`: 7 labores.

El tablero no tiene datos inventados. Sin Supabase solo muestra lotes y catálogos de la hoja; la actividad (lluvias, labores, pendientes, hacienda y el resto) queda vacía. Toda la actividad sale de Supabase.

Los mensajes del grupo entre el 7 y el 15 nov 2026 están en `lib/data/grupo.ts` y se muestran aparte. No entran en el total de lluvia: no traen pluviómetro y la lectura del 11 es parcial.

## Plano

`public/mapa/plano.webp` es el plano 20LPH del 8 oct 2026 (1241×1755 px, el mismo tamaño que `plano.jpg`, comprimido a WebP). `public/mapa/lotes.geojson` trae los polígonos en píxeles de esa imagen, con el eje Y hacia arriba. Leaflet usa `CRS.Simple` y el overlay cubre `[[0, 0], [1755, 1241]]`.

- El lote B (`LOT-025`) no tiene polígono.
- Mike (`LOT-039`) e India (`LOT-040`) comparten el polígono `lot-039` (`id_lotes`).
- Las zonas sin etiqueta del plano usan `kind: sin_etiqueta` y arrancan apagadas.
- La confianza es `alta`, `media` o `baja`. El trazo bajo va punteado.
- El hover muestra hectáreas, cultivo y campaña de la hoja, no el área estimada del dibujo.

`scripts/generar-semilla.py` regenera los JSON de la hoja y no pisa el plano.

Para regenerar solo la semilla:

```bash
python3 scripts/generar-semilla.py
```

## Conectar Supabase

El proyecto es `tu-proyecto-supabase` (sa-east-1). El esquema ya está aplicado. No vuelvas a correr la migración: `supabase/migrations/0001_initial_sheets_import.sql` queda en el repo como referencia.

En Vercel (o en `.env.local`, que no se commitea):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_clave_anon_o_publishable
```

También se acepta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en lugar de la anon.

Con esas variables el acceso pasa a Supabase Auth (correo y clave). Creá el usuario del dueño en Authentication → Users. La app lee con la clave anónima y la sesión del usuario (RLS: solo `SELECT` para `authenticated`). No usa la service role. La tabla `contactos` no se muestra. Si Supabase está configurado, las tablas vacías dicen “Sin datos cargados todavía” y no se mezclan con la semilla.

RLS está activo: `anon` no lee nada y `authenticated` solo tiene `SELECT`. Por eso hace falta una sesión. Si la variable está definida y la consulta falla, la pantalla muestra el error.

Las tablas sin cargar (labores, equipos, combustible, inspecciones y otras) muestran “Sin datos cargados todavía”.

La capa de datos está en `lib/data`. Los tipos de `lib/domain/types.ts` usan los nombres de columna (`id_lote`, `superficie_ha`, `cultivo_actual`, …). Una pantalla nueva debería leer `loadFarm()` y no hablarle a Supabase desde el componente.

## Seguridad

- La clave del piloto y el secreto de la cookie están en el repo mientras no definas las variables. No alcanza para datos sensibles.
- Cualquier usuario autenticado de Supabase puede leer todas las filas. Antes de invitar encargados, agregá políticas por rol. No uses `user_metadata` para autorizar: el usuario puede editarlo.
- No subas la `service_role` ni la secret key. La anon / publishable es pública por diseño y queda contenida por RLS.
- El sitio manda `noindex` y no acepta ser embebido en un iframe.

## Estructura

- `app/(panel)` — una ruta por módulo: `/`, `/mapa`, `/agro`, `/hacienda`, `/maquinaria`, `/compras`, `/pendientes`.
- `app/components/ui` — piezas de interfaz.
- `app/components/map` — mapa Leaflet.
- `lib/data` — semilla o Supabase, según las variables.
- `data/seed` — CSV de la hoja y JSON generado.
- `supabase/migrations` — esquema ya aplicado, no ejecutarlo de nuevo.
