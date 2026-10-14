# EUCATEN — Actualidad — Mejora de bandeja editorial

## Objetivo

Evitar que la revisión diaria se convierta en una lista larga y agotadora cuando aumente
la cantidad de fuentes y publicaciones.

## Cambios

- Los pendientes se agrupan por fuente.
- Cada fuente muestra un contador.
- Solo el primer grupo queda abierto inicialmente.
- Las publicaciones pendientes usan una tarjeta compacta.
- El resumen y la edición quedan detrás de "Ver detalle / editar".
- Aprobar, descartar y abrir la fuente original siguen disponibles sin expandir la tarjeta.
- Se elimina de la vista principal el bloque de carga manual.
- Se agrega "Buscar novedades ahora" dentro del panel.
- La búsqueda manual desde el panel está protegida por Clerk y usa el mismo recolector del cron.
- El cron diario sigue funcionando exactamente igual.

## Seguridad

El nuevo botón no expone `CRON_SECRET`.
La acción se ejecuta del lado del servidor y vuelve a validar que el usuario sea un
administrador autorizado antes de iniciar la recopilación.

## Alcance

No cambia la base de datos.
No cambia el cron.
No cambia la página pública.
No se publican noticias automáticamente.
