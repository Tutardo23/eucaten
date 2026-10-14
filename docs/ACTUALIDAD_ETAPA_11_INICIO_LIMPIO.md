# EUCATEN — Actualidad — Etapa 11: inicio limpio por cuenta

## Regla definitiva

Cada nueva cuenta editorial comienza con una bandeja personal limpia desde el momento en
que completa la guía de ingreso.

Esto NO crea una base separada.

## Qué se comparte

Todas las cuentas autorizadas trabajan sobre las mismas:

- publicaciones pendientes;
- publicaciones aprobadas;
- publicaciones descartadas;
- categorías;
- fuentes;
- estado del radar;
- historial editorial.

Por eso, si Catalina aprueba una publicación, queda publicada para todos.

## Qué es personal

Se guarda por `Clerk userId`:

- fecha de inicio editorial (`started_at`);
- último punto de revisión;
- tutorial completado.

## Primer ingreso de Catalina

El flujo queda:

1. Inicia sesión.
2. Ve una guía corta.
3. Toca `Empezar`.
4. Se registra ese instante como su `Día 1`.
5. Su bandeja diaria muestra `0` novedades.
6. Todo lo recopilado previamente queda en `Histórico previo a tu inicio`.
7. Lo que entre después comienza a aparecer en `Para empezar`, `Nuevas` y `Revisar primero`.

No tiene que elegir entre modos de inicio.

## Histórico

El histórico previo:

- no se borra;
- no cuenta como nuevo;
- no incrementa los pendientes personales;
- no aparece mezclado con el trabajo diario;
- puede consultarse expresamente desde el panel;
- mantiene trazabilidad.

Si una persona decide actuar sobre una publicación histórica, la decisión sí afecta al
contenido compartido, porque las publicaciones son comunes a todos los administradores.

## Compatibilidad

Si una cuenta ya venía usando Actualidad antes de esta etapa, el sistema intenta conservar
su referencia anterior usando, en este orden:

1. `started_at`;
2. fecha de onboarding;
3. último punto de revisión.

Así se evita reiniciar accidentalmente a un usuario existente.

## Sin configuración adicional

La nueva columna `started_at` se crea automáticamente con `ADD COLUMN IF NOT EXISTS`.

No requiere:

- SQL manual;
- paquetes nuevos;
- variables nuevas;
- cambios en Clerk;
- cambios en cron;
- otra base de Neon.
