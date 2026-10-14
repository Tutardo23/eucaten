"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActualidadAdmin } from "@/lib/actualidad/auth";
import { collectActualidadSources } from "@/lib/actualidad/collectors";
import {
  completeActualidadOnboarding,
  markActualidadReviewedNow,
} from "@/lib/actualidad/review-state";
import { writeActualidadAuditSafe } from "@/lib/actualidad/audit";
import { evaluatePublicationReadiness } from "@/lib/actualidad/publication-readiness";
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

function buildRedirect(
  type: "ok" | "error",
  message: string,
  status?: string,
  focus?: string,
) {
  const params = new URLSearchParams({ tipo: type, mensaje: message });
  if (status) params.set("estado", status);
  if (status === "pending" && ["start", "new", "high", "all", "history"].includes(focus ?? "")) {
    params.set("foco", focus!);
  }
  return `/admin/actualidad?${params.toString()}`;
}

function safeMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

export async function collectActualidadNowAction() {
  const admin = await requireActualidadAdmin();

  let destination = buildRedirect("ok", "Búsqueda completada.", "pending");

  try {
    const result = await collectActualidadSources();
    const withNews = result.sources.filter((source) => source.created > 0);
    const withErrors = result.sources.filter((source) => source.errors.length > 0);
    const newsSummary = withNews.length
      ? ` Nuevas por fuente: ${withNews.map((source) => `${source.source.toUpperCase()} ${source.created}`).join(" · ")}.`
      : "";
    const errorSummary = withErrors.length
      ? ` ${withErrors.length} ${withErrors.length === 1 ? "fuente tuvo" : "fuentes tuvieron"} observaciones; las demás continuaron normalmente.`
      : "";

    const message = result.totals.created > 0
      ? `Radar completado: ${result.totals.created} novedades nuevas.${newsSummary}${errorSummary}`
      : `Radar completado: no hay novedades nuevas.${errorSummary}`;

    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action: "radar_run",
      detail: `${result.totals.created} nuevas · ${result.totals.existing} conocidas · ${result.totals.skipped} omitidas`,
    });

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
    destination = buildRedirect("ok", message, "pending", "new");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), "pending");
  }

  redirect(destination);
}

export async function markActualidadReviewedAction() {
  const admin = await requireActualidadAdmin();

  try {
    await markActualidadReviewedNow(admin.userId);
    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action: "review_marked",
      detail: "Marcó su punto personal de revisión al día.",
    });
    revalidatePath("/admin/actualidad");
  } catch (error) {
    redirect(buildRedirect("error", safeMessage(error), "pending"));
  }

  redirect(
    "/admin/actualidad?estado=pending&foco=all&tipo=ok&mensaje=" +
      encodeURIComponent(
        "Revisión marcada al día. No se aprobó ni descartó nada; tus pendientes siguen disponibles en “Todas desde mi inicio”.",
      ),
  );
}

export async function completeActualidadOnboardingAction(_formData: FormData) {
  const admin = await requireActualidadAdmin();

  try {
    await completeActualidadOnboarding(admin.userId);
    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action: "onboarding_completed",
      detail: "Completó la guía. Su bandeja editorial personal comienza desde este momento; el contenido previo queda como histórico.",
    });
    revalidatePath("/admin/actualidad");
  } catch (error) {
    redirect(buildRedirect("error", safeMessage(error), "pending", "start"));
  }

  redirect(
    "/admin/actualidad?estado=pending&foco=start&tipo=ok&mensaje=" +
      encodeURIComponent(
        "Bienvenida/o a Actualidad. Tu bandeja comienza desde ahora; el contenido anterior quedó separado como histórico.",
      ),
  );
}

export async function createActualidadAction(formData: FormData) {
  const admin = await requireActualidadAdmin();

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

    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action: "item_created",
      detail: "Creó una publicación manual como pendiente.",
    });

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), "pending");
  }

  redirect(destination);
}

export async function updateActualidadAction(formData: FormData) {
  const admin = await requireActualidadAdmin();

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

    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action: "item_updated",
      itemId: id,
      detail: `Editó: ${existing.title}`,
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
  const returnFocus = optionalText(formData, "returnFocus");

  if (!(ACTUALIDAD_STATUSES as readonly string[]).includes(statusValue)) {
    redirect(buildRedirect("error", "Estado inválido.", returnStatus, returnFocus));
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
    returnFocus,
  );

  try {
    const existing = await getActualidadById(id);
    if (!existing) throw new Error("La publicación ya no existe.");

    if (status === "published") {
      const readiness = evaluatePublicationReadiness(existing);
      if (!readiness.ready) {
        throw new Error(`Antes de publicar: ${readiness.blockers.join(" ")}`);
      }
    }

    const updated = await setActualidadStatus(id, status, admin.identifier);
    if (!updated) throw new Error("La publicación ya no existe.");

    await writeActualidadAuditSafe({
      actorKey: admin.userId,
      actorLabel: admin.identifier,
      action:
        status === "published"
          ? "item_published"
          : status === "rejected"
            ? "item_rejected"
            : "item_pending",
      itemId: id,
      detail: `${status === "published" ? "Publicó" : status === "rejected" ? "Descartó" : "Devolvió a pendientes"}: ${existing.title}`,
    });

    revalidatePath("/admin/actualidad");
    revalidatePath("/actualidad");
  } catch (error) {
    destination = buildRedirect("error", safeMessage(error), returnStatus, returnFocus);
  }

  redirect(destination);
}
