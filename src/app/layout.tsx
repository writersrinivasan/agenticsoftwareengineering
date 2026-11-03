import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import GroqKeyProvider from "@/components/GroqKeyProvider";
import Nav from "@/components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic SE Lab",
  description:
    "Agentic Software Engineering: From Requirements to Production. Learning resources and LangGraph hands-on labs for Hexaware Americas (Mexico team).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="aurora" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <GroqKeyProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-muted">
            Agentic Software Engineering · Hexaware Americas, Mexico Team 🇲🇽 · Built with Next.js, LangGraph & Groq (BYOK)
          </footer>
        </GroqKeyProvider>
      </body>
    </html>
  );
}
