# Actualidad — Etapa 5

Esta etapa conecta la primera fuente real: **Resoluciones UIF**.

## Qué hace automáticamente

1. Vercel invoca `/api/actualidad/collect` una vez por día.
2. El endpoint solo responde si recibe `Authorization: Bearer <CRON_SECRET>`.
3. Se consulta exclusivamente la página oficial de Resoluciones UIF.
4. Se detectan las resoluciones del año más reciente disponible.
5. Se verifica la fecha usando la URL del Boletín Oficial o la ficha oficial de Argentina.gob.ar.
6. Se usan únicamente dominios oficiales permitidos.
7. Se aplican las reglas locales de categorías (sin IA).
8. Se verifica si la URL ya existe en Neon.
9. Las novedades nuevas se guardan siempre como `pending`.
10. Nunca se publica nada automáticamente.

## Seguridad

- No existe endpoint público de escritura libre.
- El recolector exige `CRON_SECRET`.
- `CRON_SECRET` nunca debe llevar prefijo `NEXT_PUBLIC_`.
- Los enlaces seguidos por el recolector están limitados a `argentina.gob.ar` y `boletinoficial.gob.ar`.
- Si no se puede verificar la fecha oficial de una resolución, esa resolución se omite en lugar de inventar una fecha.
- La inserción es idempotente: volver a ejecutar la recopilación no duplica una noticia ya almacenada.

## Producción

Configurar en Vercel las variables que ya usa el sitio y agregar:

```env
CRON_SECRET=<secreto-largo-y-aleatorio>
```

`vercel.json` programa la recopilación a las `10:00 UTC` (aprox. 07:00 de Argentina).

La primera ejecución puede incorporar varias resoluciones del año vigente como pendientes. Las ejecuciones siguientes solo agregan las que todavía no existan.
