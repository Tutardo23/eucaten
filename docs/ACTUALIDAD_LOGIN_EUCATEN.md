# EUCATEN — Acceso privado dentro del sitio

Este parche mantiene la autenticación segura de Clerk pero reemplaza la pantalla alojada en `accounts.dev` por una ruta propia de EUCATEN.

## Resultado

- `/admin/actualidad` redirige a `/sign-in` cuando no hay sesión.
- `/sign-in` vive dentro del sitio de EUCATEN y utiliza la identidad visual del proyecto.
- Clerk sigue gestionando credenciales, contraseña y sesión.
- El método de acceso sigue siendo el que esté configurado en Clerk Dashboard; si configuraste usuario, el formulario pide usuario.
- Después de iniciar sesión se vuelve siempre a `/admin/actualidad`.
- El link de alta de cuenta queda oculto en esta pantalla porque el panel es privado.
- La autorización adicional por `ACTUALIDAD_ADMIN_EMAILS` sigue intacta.

## Variables nuevas

Agregar también a `.env.local`:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/admin/actualidad
```

Reiniciar `npm run dev` después de cambiar `.env.local`.

## Prueba

1. Cerrar la sesión de Clerk si ya existe una.
2. Abrir `http://localhost:3000/admin/actualidad`.
3. Debe redirigir a `http://localhost:3000/sign-in` y NO a `*.accounts.dev`.
4. Iniciar sesión con el usuario configurado en Clerk.
5. Debe volver a `/admin/actualidad`.

La pantalla de acceso no cambia las reglas de seguridad del panel: una cuenta autenticada que no esté autorizada continúa sin poder administrar Actualidad.
