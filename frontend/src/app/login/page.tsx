"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login"
      const body: any = { email, password }
      if (isRegister) {
        body.name = name
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao autenticar")
      }

      const data = await res.json()
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)

      try {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`
          }
        })
        if (meRes.ok) {
          const me = await meRes.json()
          if (me.role === "admin") {
            router.push("/admin")
            return
          }
        }
      } catch {
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
        <div className="hidden md:block md:col-span-2">
          <div className="relative rounded-3xl bg-gradient-to-br from-emerald-500 via-sky-500 to-emerald-300 p-[1px] shadow-[0_0_60px_rgba(16,185,129,0.5)]">
            <div className="relative h-full w-full rounded-3xl bg-slate-950 px-6 py-8 overflow-hidden">
              <div className="absolute -top-20 -right-10 w-40 h-40 bg-emerald-400/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-16 w-52 h-52 bg-sky-500/25 rounded-full blur-3xl" />
              <div className="absolute top-2 left-2 text-[10px] text-emerald-500/50">
                v3.1.9-FINAL (STORE FIX)
              </div>
              <div className="relative space-y-4">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20 mb-4">
                  <Image src="/logo/logo.jpeg" alt="SementeToken Logo" fill className="object-cover" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">
                  Floresta digital
                </p>
                <h2 className="text-2xl font-bold text-emerald-50">
                  Entre para cuidar da sua floresta.
                </h2>
                <p className="text-sm text-emerald-50/90">
                  Use o SementeToken para acompanhar árvores, tokens verdes e o
                  impacto de carbono em tempo quase real.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/40 p-3">
                    <p className="text-emerald-200 mb-1">Para pessoas</p>
                    <p className="text-emerald-50/80">
                      Plante árvores digitais, converse com a IA da floresta e
                      acompanhe seu impacto.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 border border-sky-500/40 p-3">
                    <p className="text-sky-200 mb-1">Para empresas</p>
                    <p className="text-emerald-50/80">
                      Tenha um painel ESG para comunicar projetos de
                      reflorestamento de forma transparente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-slate-900/80 border border-emerald-900 rounded-3xl p-7 sm:p-8 shadow-[0_0_40px_rgba(15,118,110,0.35)]">
            <h1 className="text-2xl font-bold text-emerald-50 mb-2">
              {isRegister ? "Criar conta" : "Entrar no SementeToken"}
            </h1>
            <p className="text-sm text-emerald-50/80 mb-6">
              {isRegister
                ? "Crie sua conta para começar a plantar árvores digitais."
                : "Acesse sua floresta digital e acompanhe suas árvores."}
            </p>

            {error && (
              <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-emerald-200">
                    Nome
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-emerald-200">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-200">
                  Senha
                </label>
                <input
                  type="password"
                  className="mt-1 w-full border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-400 text-emerald-950 py-2 rounded-full text-sm font-semibold hover:bg-emerald-300 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Enviando..."
                  : isRegister
                  ? "Criar conta"
                  : "Entrar"}
              </button>
            </form>

            <button
              className="mt-4 text-xs text-emerald-200 hover:text-emerald-100"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? "Já tem conta? Entrar"
                : "Ainda não tem conta? Criar conta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
