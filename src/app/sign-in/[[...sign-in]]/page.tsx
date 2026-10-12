import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isActualidadClerkConfigured } from "@/lib/actualidad/auth";
import styles from "./sign-in.module.css";

export const metadata: Metadata = {
  title: "Acceso privado",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (!isActualidadClerkConfigured()) {
    return (
      <main className={styles.page}>
        <div className={styles.configCard}>
          <Image
            src="/brand/eucaten-isotipo.png"
            alt=""
            width={489}
            height={475}
            className={styles.configSymbol}
            priority
          />
          <p className={styles.eyebrow}>EUCATEN / ACTUALIDAD</p>
          <h1>Falta configurar el acceso privado.</h1>
          <p>Clerk todavía no está configurado en este entorno.</p>
          <Link href="/">Volver al sitio</Link>
        </div>
      </main>
    );
  }

  const { isAuthenticated } = await auth();
  if (isAuthenticated) {
    redirect("/admin/actualidad");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="EUCATEN, volver al inicio">
          <Image
            src="/brand/eucaten-isotipo.png"
            alt=""
            width={489}
            height={475}
            className={styles.brandSymbol}
            priority
          />
          <Image
            src="/brand/eucaten-wordmark-cream.png"
            alt="EUCATEN"
            width={567}
            height={80}
            className={styles.brandWordmark}
            priority
          />
        </Link>
        <Link className={styles.backLink} href="/">
          Volver al sitio
        </Link>
      </header>

      <section className={styles.content}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>ÁREA PRIVADA</p>
          <h1>Actualidad EUCATEN</h1>
          <p className={styles.lead}>
            Acceso al espacio editorial para revisar, editar y publicar novedades jurídicas y regulatorias.
          </p>
          <div className={styles.securityNote}>
            <span aria-hidden="true">01</span>
            <p>Solo las cuentas previamente autorizadas pueden ingresar al panel.</p>
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.formIntro}>
            <p>Acceso privado</p>
            <h2>Ingresá a tu cuenta</h2>
          </div>

          <div className={styles.clerkFrame}>
            <SignIn
              path="/sign-in"
              routing="path"
              forceRedirectUrl="/admin/actualidad"
              appearance={{
                variables: {
                  colorPrimary: "#b18a4b",
                  colorBackground: "#f7f6f2",
                  colorForeground: "#101e31",
                  colorMutedForeground: "#5f6874",
                  colorInput: "#ffffff",
                  colorInputForeground: "#101e31",
                  borderRadius: "2px",
                  fontFamily: "var(--font-body), Inter, sans-serif",
                },
              }}
            />
          </div>

          <p className={styles.helpText}>
            Si no podés ingresar, verificá que estés usando el usuario habilitado para EUCATEN.
          </p>
        </div>
      </section>
    </main>
  );
}
