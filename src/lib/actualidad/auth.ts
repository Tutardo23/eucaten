import { auth, currentUser } from "@clerk/nextjs/server";

export type ActualidadAdminAccess =
  | { status: "not_configured" }
  | { status: "signed_out" }
  | {
      status: "denied";
      userId: string;
      identifier?: string;
    }
  | {
      status: "authorized";
      userId: string;
      identifier: string;
      email?: string;
      username?: string;
    };

export function isActualidadClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

function parseAllowedValues(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getAllowedAdminUserIds() {
  // Los IDs de Clerk son case-sensitive en la práctica, pero los normalizamos
  // igual que las variables para evitar espacios accidentales.
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_USER_IDS);
}

function getAllowedAdminEmails() {
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_EMAILS);
}

function getAllowedAdminUsernames() {
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_USERNAMES);
}

export async function getActualidadAdminAccess(): Promise<ActualidadAdminAccess> {
  if (!isActualidadClerkConfigured()) {
    return { status: "not_configured" };
  }

  const session = await auth();
  const userId = session.userId;

  if (!session.isAuthenticated || !userId) {
    return { status: "signed_out" };
  }

  const allowedUserIds = getAllowedAdminUserIds();
  const allowedEmails = getAllowedAdminEmails();
  const allowedUsernames = getAllowedAdminUsernames();

  // Fail closed: si no se configuró ningún administrador, nadie entra.
  if (
    !allowedUserIds.length &&
    !allowedEmails.length &&
    !allowedUsernames.length
  ) {
    return { status: "denied", userId, identifier: userId };
  }

  // Método principal y más robusto: el ID viene directamente de la sesión
  // validada por Clerk y no requiere una segunda consulta al Backend API.
  if (allowedUserIds.includes(userId.toLowerCase())) {
    return {
      status: "authorized",
      userId,
      identifier: userId,
    };
  }

  // Métodos secundarios: username / email. Si Clerk no devuelve el perfil,
  // el acceso sigue cerrado y mostramos el userId para poder autorizarlo.
  try {
    const user = await currentUser();

    if (user) {
      const username = user.username?.trim() || undefined;
      const normalizedUsername = username?.toLowerCase();

      const userEmails = user.emailAddresses
        .map((entry: { emailAddress: string }) =>
          entry.emailAddress.trim().toLowerCase(),
        )
        .filter(Boolean);

      const matchedEmail = userEmails.find((email: string) =>
        allowedEmails.includes(email),
      );

      const usernameAllowed = Boolean(
        normalizedUsername &&
          allowedUsernames.includes(normalizedUsername),
      );

      if (matchedEmail || usernameAllowed) {
        const identifier = usernameAllowed
          ? username!
          : matchedEmail!;

        return {
          status: "authorized",
          userId,
          identifier,
          email: matchedEmail,
          username,
        };
      }

      return {
        status: "denied",
        userId,
        identifier:
          username ??
          user.primaryEmailAddress?.emailAddress ??
          userId,
      };
    }
  } catch {
    // No relajamos la seguridad si falla la consulta al perfil.
  }

  return {
    status: "denied",
    userId,
    identifier: userId,
  };
}

export async function requireActualidadAdmin() {
  const access = await getActualidadAdminAccess();

  if (access.status !== "authorized") {
    throw new Error("No tenés permisos para administrar Actualidad.");
  }

  return access;
}
