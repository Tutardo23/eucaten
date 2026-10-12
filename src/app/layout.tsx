import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import "lenis/dist/lenis.css";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eucaten.vercel.app"),
  title: {
    default: "EUCATEN | Estudio Jurídico & Consultoría",
    template: "%s | EUCATEN",
  },
  description:
    "Soluciones legales y de cumplimiento normativo para empresas: constitución, adecuación regulatoria, defensa y gestión cotidiana del cumplimiento.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "EUCATEN | Estudio Jurídico & Consultoría",
    description:
      "Soluciones legales y de cumplimiento normativo para empresas en movimiento.",
    url: "/",
    siteName: "EUCATEN",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/brand/eucaten-isotipo.png", width: 489, height: 475, alt: "EUCATEN" }],
  },
};

function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = (
    <>
      <SmoothScroll />
      {children}
    </>
  );

  return (
    <html lang="es">
      <body className={`${heading.variable} ${body.variable}`}>
        {isClerkConfigured() ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
