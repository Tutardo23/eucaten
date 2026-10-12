"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActualidadAdmin } from "@/lib/actualidad/auth";
import {
  createActualidadItem,
  getActualidadById,
  setActualidadStatus,
  updateActualidadItem,
} from "@/lib/actualidad/repository";
import {
  ACTUALIDAD_CATEGORIES,
  ACTUALIDAD_SOURCE_TYPES,
  ACTUALIDAD_STATUSES,
  type ActualidadCategory,
  type ActualidadSourceType,
  type ActualidadStatus,
} from "@/lib/actualidad/types";
import { ACTUALIDAD_SOURCES, type ActualidadSourceKey } from "@/lib/actualidad/sources";

function requiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`Falta completar ${key}.`);
  return value;
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function parseCategories(formData: FormData): ActualidadCategory[] {
  const values = formData
    .getAll("categories")
    .map((value) => String(value))
    .filter((value): value is ActualidadCategory =>
      (ACTUALIDAD_CATEGORIES as readonly string[]).includes(value),
    );

  if (!values.length) {
    throw new Error("Elegí al menos una categoría.");
  }

  return values;
}

function parseSourceType(formData: FormData): ActualidadSourceType {
  const value = requiredText(formData, "sourceType");
  if (!(ACTUALIDAD_SOURCE_TYPES as readonly string[]).includes(value)) {
    throw new Error("Tipo de fuente inválido.");
  }
  return value as ActualidadSourceType;
}

function parsePublishedAt(formData: FormData) {
  const value = requiredText(formData, "publishedAt");
  const parsed = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("La fecha no es válida.");
  }
  return parsed.toISOString();
}

function parseSourceKey(formData: FormData) {
  const value = optionalText(formData, "sourceKey");
  if (!value) return undefined;

  const allowedKeys = ACTUALIDAD_SOURCES.map((source) => source.key) as readonly string[];
  if (!allowedKeys.includes(value)) {
    throw new Error("Fuente configurada inválida.");
  }

  return value as ActualidadSourceKey;
}

function buildRedirect(type: "ok" | "error", message: string, status?: string) {
  const params = new URLSearchParams({ tipo: type, mensaje: message });
  if (status) params.set("estado", status);
  return `/admin/actualidad?${params.toString()}`;
}

function safeMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export async function createActualidadAction(formData: FormData) {
  await requireActualidadAdmin();

  let destination = buildRedirect("ok", "Publicación creada como pendiente.", "pending");

  try {
    await createActualidadItem({
      title: requiredText(formData, "title"),
      summary: optionalText(formData, "summary"),
      sourceKey: parseSourceKey(formData),
      sourceName: requiredText(formData, "sourceName"),
      sourceUrl: requiredText(formData, "sourceUrl"),
      sourceType: parseSourceType(formData),
      publishedAt: parsePublishedAt(formData),
      categories: parseCategories(formData),
    });

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), "pending");
  }

  redirect(destination);
}

export async function updateActualidadAction(formData: FormData) {
  await requireActualidadAdmin();

  const id = requiredText(formData, "id");
  const requestedStatus = optionalText(formData, "currentStatus") ?? "pending";
  let destination = buildRedirect("ok", "Cambios guardados.", requestedStatus);

  try {
    const existing = await getActualidadById(id);
    if (!existing) throw new Error("La publicación ya no existe.");

    await updateActualidadItem(id, {
      title: requiredText(formData, "title"),
      summary: optionalText(formData, "summary"),
      sourceKey: parseSourceKey(formData),
      sourceName: requiredText(formData, "sourceName"),
      sourceUrl: requiredText(formData, "sourceUrl"),
      sourceType: parseSourceType(formData),
      publishedAt: parsePublishedAt(formData),
      categories: parseCategories(formData),
      jurisprudence: existing.jurisprudence,
    });

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), requestedStatus);
  }

  redirect(destination);
}

export async function setActualidadStatusAction(formData: FormData) {
  const admin = await requireActualidadAdmin();

  const id = requiredText(formData, "id");
  const statusValue = requiredText(formData, "status");
  const returnStatus = optionalText(formData, "returnStatus") ?? "pending";

  if (!(ACTUALIDAD_STATUSES as readonly string[]).includes(statusValue)) {
    redirect(buildRedirect("error", "Estado inválido.", returnStatus));
  }

  const status = statusValue as ActualidadStatus;
  let destination = buildRedirect(
    "ok",
    status === "published"
      ? "Publicación aprobada y publicada."
      : status === "rejected"
        ? "Publicación descartada."
        : "Publicación devuelta a pendientes.",
    returnStatus,
  );

  try {
    const updated = await setActualidadStatus(id, status, admin.email || admin.userId);
    if (!updated) throw new Error("La publicación ya no existe.");

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), returnStatus);
  }

  redirect(destination);
}
