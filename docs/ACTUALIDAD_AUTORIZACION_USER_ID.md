# Parche Etapa 3 — autorización robusta por Clerk User ID

La autenticación ya funcionaba, pero la lectura del perfil completo de Clerk no estaba
devolviendo el `username` de forma confiable en este entorno.

Este parche usa como permiso principal el `userId` que viene directamente de la sesión
autenticada por Clerk.

## Pasos

1. Aplicar el parche.
2. Reiniciar `npm run dev`.
3. Entrar en `/admin/actualidad`.
4. Si la cuenta todavía no está autorizada, la pantalla mostrará únicamente el ID de
   Clerk de la cuenta que acaba de iniciar sesión, por ejemplo:

   `user_2abc123...`

5. Copiar ese valor en `.env.local`:

```env
ACTUALIDAD_ADMIN_USER_IDS=user_2abc123...
```

6. Reiniciar `npm run dev` otra vez.

Se pueden autorizar varias cuentas separándolas por coma:

```env
ACTUALIDAD_ADMIN_USER_IDS=user_abc,user_xyz
```

`ACTUALIDAD_ADMIN_USERNAMES` y `ACTUALIDAD_ADMIN_EMAILS` siguen disponibles como
métodos secundarios.

La autorización continúa siendo fail-closed: si ninguna lista contiene una cuenta
permitida, el panel permanece bloqueado.
