import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SementeToken",
  description: "Plataforma de Reflorestamento e Tokenização ESG"
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className + " bg-slate-950 text-white"}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-gradient-to-r from-emerald-950 via-sky-950 to-emerald-900 border-b border-emerald-800/60">
            <nav className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 flex items-center justify-center text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/40">
                  ST
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-wide">
                    SementeToken
                  </span>
                  <span className="text-[11px] text-emerald-200/80">
                    Reflorestamento digital • ESG SaaS
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-900/40 border border-emerald-700/60 px-2 py-1 text-xs">
                <a
                  href="/"
                  className="px-3 py-1 rounded-full hover:bg-emerald-800/80 transition-colors"
                >
                  Home
                </a>
                <a
                  href="/marketplace"
                  className="px-3 py-1 rounded-full hover:bg-emerald-800/80 transition-colors"
                >
                  Marketplace
                </a>
                <a
                  href="/dashboard"
                  className="hidden sm:inline-flex px-3 py-1 rounded-full hover:bg-emerald-800/80 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/login"
                  className="ml-1 px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition-colors"
                >
                  Entrar
                </a>
              </div>
            </nav>
          </header>
          <main className="flex-grow">{children}</main>
          <footer className="bg-slate-950 border-t border-emerald-900/80">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] text-emerald-100/80">
              <p>
                &copy; 2024 SementeToken. Todos os direitos reservados.
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800/50">
                  v2.2.0 (Deploy VPS)
                </span>
              </p>
              <p className="flex flex-wrap gap-3 md:justify-end">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Reflorestamento digital
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Dados geoespaciais
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-300" />
                  Tokens verdes
                </span>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
