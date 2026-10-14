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
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_USER_IDS);
}

function getAllowedAdminEmails() {
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_EMAILS);
}

function getAllowedAdminUsernames() {
  return parseAllowedValues(process.env.ACTUALIDAD_ADMIN_USERNAMES);
}

async function readOptionalProfile() {
  try {
    const user = await currentUser();
    if (!user) return null;

    const username = user.username?.trim() || undefined;
    const emails = user.emailAddresses
      .map((entry) => entry.emailAddress.trim().toLowerCase())
      .filter(Boolean);
    const primaryEmail =
      user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ||
      emails[0] ||
      undefined;

    return { username, emails, primaryEmail };
  } catch {
    return null;
  }
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

  if (
    !allowedUserIds.length &&
    !allowedEmails.length &&
    !allowedUsernames.length
  ) {
    return { status: "denied", userId, identifier: userId };
  }

  const userIdAllowed = allowedUserIds.includes(userId.toLowerCase());

  // El User ID de Clerk sigue siendo la autorización principal.
  // El perfil solo se consulta para mostrar un nombre legible y auditar mejor;
  // si esa consulta falla, el acceso por User ID continúa funcionando.
  if (userIdAllowed) {
    const profile = await readOptionalProfile();
    const identifier =
      profile?.username ??
      profile?.primaryEmail ??
      userId;

    return {
      status: "authorized",
      userId,
      identifier,
      email: profile?.primaryEmail,
      username: profile?.username,
    };
  }

  const profile = await readOptionalProfile();
  if (!profile) {
    return { status: "denied", userId, identifier: userId };
  }

  const normalizedUsername = profile.username?.toLowerCase();
  const matchedEmail = profile.emails.find((email) =>
    allowedEmails.includes(email),
  );
  const usernameAllowed = Boolean(
    normalizedUsername &&
      allowedUsernames.includes(normalizedUsername),
  );

  if (matchedEmail || usernameAllowed) {
    const identifier = usernameAllowed
      ? profile.username!
      : matchedEmail!;

    return {
      status: "authorized",
      userId,
      identifier,
      email: matchedEmail ?? profile.primaryEmail,
      username: profile.username,
    };
  }

  return {
    status: "denied",
    userId,
    identifier:
      profile.username ??
      profile.primaryEmail ??
      userId,
  };
}

export async function requireActualidadAdmin() {
  const access = await getActualidadAdminAccess();

  if (access.status !== "authorized") {
    throw new Error("No tenés permisos para administrar Actualidad.");
  }

  return access;
}
