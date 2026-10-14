# EUCATEN — Actualidad — Etapa 10: Tutorial y cierre operativo

## Objetivo

Hacer que Catalina pueda usar el panel sin depender de Matías para recordar cómo funciona,
y preparar el sistema para trabajar con más de una cuenta editorial sin mezclar el punto de
revisión personal de cada persona.

## Tutorial

En el primer ingreso de cada cuenta se abre una guía de cinco pasos:

1. No hace falta vaciar la bandeja.
2. Cómo usar “Para empezar” y “Revisar primero”.
3. Verificación de la fuente original.
4. Aprobar, editar y descartar.
5. Punto de revisión personal.

La guía puede volver a abrirse siempre desde “¿Cómo uso este panel?”.

## Primera vez de una cuenta nueva

Una cuenta nueva puede elegir:

### Empezar desde hoy — recomendado

El sistema marca el momento actual como su punto personal de revisión.

Las publicaciones pendientes anteriores:
- NO se eliminan;
- NO se descartan;
- siguen disponibles en “Todas las pendientes”;
- simplemente no aparecen como “nuevas” para esa cuenta.

### Revisar también lo pendiente actual

No se crea un punto de corte inicial y todos los pendientes existentes se consideran nuevos
para esa cuenta.

## Datos compartidos vs. personales

Compartido entre administradores:
- Pendientes
- Publicadas
- Descartadas
- Radar y estado de fuentes
- Contenido y categorías

Personal por cuenta Clerk:
- Último punto de revisión
- Estado del tutorial / onboarding

## Auditoría

Se incorpora un historial editorial liviano que registra desde esta etapa:

- publicación aprobada;
- publicación descartada;
- vuelta a pendientes;
- edición;
- creación manual;
- ejecución manual del radar;
- marcar revisión al día;
- finalización del tutorial.

La auditoría no bloquea la operación si su registro falla.

## Seguridad

La autorización continúa dependiendo principalmente del User ID de Clerk.
La consulta de username/email se usa solamente para mostrar una identidad más legible y
para el historial. Si esa consulta secundaria falla, un User ID correctamente autorizado
sigue teniendo acceso.

## Sin configuración manual

Las columnas/tablas auxiliares se crean automáticamente en Neon con `IF NOT EXISTS`.

No requiere:
- nuevo paquete;
- nueva variable de entorno;
- SQL manual;
- cambios en el cron.
