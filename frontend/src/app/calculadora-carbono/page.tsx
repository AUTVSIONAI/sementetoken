"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PublicCarbonCalculator() {
  const [carbonCalc, setCarbonCalc] = useState({
    carKmPerMonth: 0,
    energyKwhPerMonth: 0,
    shortFlightsPerYear: 0,
    longFlightsPerYear: 0
  })

  const [hasSavedProfile, setHasSavedProfile] = useState(false)

  const [products, setProducts] = useState<
    {
      id: string
      name: string
      description?: string | null
      price: number
      carbonCashbackKg: number
      projectName?: string | null
    }[]
  >([])

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "/api"

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${API_URL}/products`)
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data)) return
        setProducts(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price ?? 0,
            carbonCashbackKg: p.carbonCashbackKg ?? 0,
            projectName: p.project?.name ?? null
          }))
        )
      } catch {
      }
    }
    loadProducts()
  }, [API_URL])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("st_carbon_profile")
      if (saved) {
        setHasSavedProfile(true)
      }
    } catch {}
  }, [])

  function handleSaveProfile() {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("st_carbon_profile", JSON.stringify(carbonCalc))
      setHasSavedProfile(true)
    } catch {}
  }

  function handleApplyProfile() {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("st_carbon_profile")
      if (!saved) return
      const parsed = JSON.parse(saved)
      setCarbonCalc((prev) => ({
        ...prev,
        ...parsed
      }))
    } catch {}
  }

  const annualCarTons =
    (carbonCalc.carKmPerMonth * 12 * 0.000192) || 0
  const annualEnergyTons =
    (carbonCalc.energyKwhPerMonth * 12 * 0.00005) || 0
  const annualShortFlightsTons =
    carbonCalc.shortFlightsPerYear * 0.15 || 0
  const annualLongFlightsTons =
    carbonCalc.longFlightsPerYear * 0.5 || 0
  const annualTotalTons =
    annualCarTons +
    annualEnergyTons +
    annualShortFlightsTons +
    annualLongFlightsTons

  const treeCo2CapacityTons = 0.15
  const suggestedTrees =
    annualTotalTons > 0
      ? Math.ceil(annualTotalTons / treeCo2CapacityTons)
      : 0

  const suggestionItems =
    annualTotalTons > 0
      ? products
          .filter((p) => (p.carbonCashbackKg ?? 0) > 0)
          .map((p) => {
            const perUnitTons = (p.carbonCashbackKg ?? 0) / 1000
            if (perUnitTons <= 0) {
              return null
            }
            const units = Math.ceil(annualTotalTons / perUnitTons)
            const compensated = units * perUnitTons
            return { product: p, units, compensated }
          })
          .filter(
            (x): x is {
              product: {
                id: string
                name: string
                description?: string | null
                price: number
                carbonCashbackKg: number
                projectName?: string | null
              }
              units: number
              compensated: number
            } => !!x
          )
          .sort((a, b) => a.units - b.units)
          .slice(0, 10)
      : []

  const summaryText =
    annualTotalTons > 0
      ? [
          `Estimativa anual de emissões: ${annualTotalTons.toFixed(2)} t CO₂/ano.`,
          `Transporte (carro): ${annualCarTons.toFixed(2)} t; energia elétrica: ${annualEnergyTons.toFixed(
            2
          )} t; voos: ${(annualShortFlightsTons + annualLongFlightsTons).toFixed(
            2
          )} t.`,
          `Para compensar esse cenário, seriam necessárias cerca de ${suggestedTrees} árvores em projetos da SementeToken, gerando créditos verdes e acesso a benefícios do nosso ecossistema de parceiros.`
        ].join(" ")
      : ""

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="uppercase tracking-[0.25em] text-emerald-200 text-[11px] mb-3">
              Calculadora pública de carbono
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
              Descubra sua pegada de carbono
              <span className="text-emerald-300"> e como compensar</span>.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-emerald-50/90 max-w-xl">
              Estime suas emissões anuais e veja quantas árvores e produtos
              verdes da SementeToken podem compensar esse impacto com projetos
              reais de reflorestamento e agrofloresta.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition"
            >
              Criar conta e acompanhar minha floresta
            </Link>
            <a
              href="mailto:contato@sementetoken.com"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-emerald-600 text-emerald-50 hover:bg-emerald-900/40 transition"
            >
              Falar com time ESG da SementeToken
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3 text-[11px] bg-slate-900/80 border border-emerald-800 rounded-2xl p-5">
            <p className="text-emerald-200 text-xs font-semibold">
              Preencha seus dados
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() =>
                  setCarbonCalc({
                    carKmPerMonth: 800,
                    energyKwhPerMonth: 250,
                    shortFlightsPerYear: 1,
                    longFlightsPerYear: 0
                  })
                }
                className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-100 hover:bg-emerald-900/60"
              >
                Pessoa física padrão
              </button>
              <button
                type="button"
                onClick={() =>
                  setCarbonCalc({
                    carKmPerMonth: 4000,
                    energyKwhPerMonth: 2000,
                    shortFlightsPerYear: 4,
                    longFlightsPerYear: 1
                  })
                }
                className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-100 hover:bg-emerald-900/60"
              >
                Pequena empresa
              </button>
              <button
                type="button"
                onClick={() =>
                  setCarbonCalc({
                    carKmPerMonth: 12000,
                    energyKwhPerMonth: 8000,
                    shortFlightsPerYear: 12,
                    longFlightsPerYear: 4
                  })
                }
                className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-100 hover:bg-emerald-900/60"
              >
                Grande empresa
              </button>
              <button
                type="button"
                onClick={() =>
                  setCarbonCalc({
                    carKmPerMonth: 0,
                    energyKwhPerMonth: 0,
                    shortFlightsPerYear: 0,
                    longFlightsPerYear: 0
                  })
                }
                className="px-3 py-1 rounded-full border border-slate-600 text-emerald-100 hover:bg-slate-900/60"
              >
                Limpar
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px]">
              <span className="text-emerald-200/70">Meu perfil:</span>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-100 hover:bg-emerald-900/60"
              >
                Salvar perfil atual
              </button>
              <button
                type="button"
                onClick={handleApplyProfile}
                disabled={!hasSavedProfile}
                className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
              >
                Usar perfil salvo
              </button>
              {hasSavedProfile && (
                <span className="text-emerald-300/80">
                  perfil salvo disponível
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-emerald-200/80">
                  Quilômetros de carro por mês
                </p>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                  value={carbonCalc.carKmPerMonth}
                  onChange={(e) =>
                    setCarbonCalc((prev) => ({
                      ...prev,
                      carKmPerMonth: Number(e.target.value) || 0
                    }))
                  }
                  placeholder="Ex: 800"
                />
              </div>
              <div className="space-y-1">
                <p className="text-emerald-200/80">
                  Consumo de energia elétrica por mês (kWh)
                </p>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                  value={carbonCalc.energyKwhPerMonth}
                  onChange={(e) =>
                    setCarbonCalc((prev) => ({
                      ...prev,
                      energyKwhPerMonth: Number(e.target.value) || 0
                    }))
                  }
                  placeholder="Ex: 250"
                />
              </div>
              <div className="space-y-1">
                <p className="text-emerald-200/80">
                  Voos curtos por ano (domésticos)
                </p>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                  value={carbonCalc.shortFlightsPerYear}
                  onChange={(e) =>
                    setCarbonCalc((prev) => ({
                      ...prev,
                      shortFlightsPerYear: Number(e.target.value) || 0
                    }))
                  }
                  placeholder="Ex: 2"
                />
              </div>
              <div className="space-y-1">
                <p className="text-emerald-200/80">
                  Voos longos por ano (internacionais)
                </p>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                  value={carbonCalc.longFlightsPerYear}
                  onChange={(e) =>
                    setCarbonCalc((prev) => ({
                      ...prev,
                      longFlightsPerYear: Number(e.target.value) || 0
                    }))
                  }
                  placeholder="Ex: 1"
                />
              </div>
            </div>
            <p className="text-emerald-200/70 mt-3">
              Os valores são estimativas médias e servem como referência
              inicial. Para relatórios oficiais, use inventários mais
              detalhados.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-emerald-800 rounded-2xl p-5 text-[11px] text-emerald-200/80">
              <p className="font-semibold text-emerald-100 text-sm mb-2">
                Resultado estimado
              </p>
              <p>
                Emissões anuais aproximadas:
                <span className="ml-1 font-semibold text-emerald-300 text-base">
                  {annualTotalTons.toFixed(2)} t CO₂/ano
                </span>
              </p>
              <p className="mt-1">
                Número sugerido de árvores para compensar:
                <span className="ml-1 font-semibold text-emerald-300 text-base">
                  {suggestedTrees}
                </span>
              </p>
              {suggestedTrees > 0 && (
                <p className="mt-1">
                  Considerando que cada árvore compensa em média{" "}
                  <span className="font-semibold">
                    {treeCo2CapacityTons.toFixed(2)} t CO₂
                  </span>{" "}
                  ao longo da vida.
                </p>
              )}
            </div>

            <div className="bg-slate-900/80 border border-emerald-800 rounded-2xl p-5 space-y-2 text-[11px] text-emerald-200/80">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-emerald-100 text-sm">
                  Resumo rápido ESG
                </p>
                <button
                  type="button"
                  disabled={!summaryText}
                  onClick={() => {
                    if (!summaryText || typeof navigator === "undefined") return
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(summaryText).catch(() => {})
                    }
                  }}
                  className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
                >
                  Copiar resumo
                </button>
              </div>
              {summaryText ? (
                <p className="text-emerald-200/80 leading-relaxed">
                  {summaryText}
                </p>
              ) : (
                <p className="text-emerald-200/60">
                  Preencha os dados ao lado para gerar um resumo que pode ser
                  colado em relatórios e apresentações.
                </p>
              )}
            </div>

            <div className="bg-slate-900/80 border border-emerald-800 rounded-2xl p-5 text-[11px] text-emerald-200/80 space-y-2">
              <p className="font-semibold text-emerald-100 text-sm">
                De onde vem suas emissões
              </p>
              <div className="space-y-2">
                {annualTotalTons > 0 && (
                  <>
                    {[
                      {
                        label: "Transporte (carro)",
                        value: annualCarTons
                      },
                      {
                        label: "Energia elétrica",
                        value: annualEnergyTons
                      },
                      {
                        label: "Voos (curtos e longos)",
                        value: annualShortFlightsTons + annualLongFlightsTons
                      }
                    ].map((item) => {
                      const pct =
                        annualTotalTons > 0
                          ? (item.value / annualTotalTons) * 100
                          : 0
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span>{item.label}</span>
                            <span>
                              {item.value.toFixed(2)} t • {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-300"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
                {annualTotalTons === 0 && (
                  <p className="text-emerald-200/70">
                    Preencha os campos ao lado para ver o peso de cada fonte de
                    emissão.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-emerald-800 rounded-2xl p-5 space-y-3 text-[11px]">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-emerald-100 text-sm">
                  Sugestões de produtos e árvores
                </p>
                <p className="text-emerald-200/70">
                  Baseado nos projetos atuais da SementeToken.
                </p>
              </div>
              {suggestionItems.length === 0 ? (
                <p className="text-emerald-200/80">
                  Informe seus dados ao lado para ver uma lista de árvores e
                  produtos que podem compensar sua pegada de carbono.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {suggestionItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="min-w-[180px] max-w-[220px] border border-emerald-800 rounded-xl bg-slate-950/80 p-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-[12px] font-semibold text-emerald-100">
                          {item.product.name}
                        </p>
                        {item.product.projectName && (
                          <p className="text-emerald-200/80">
                            Projeto {item.product.projectName}
                          </p>
                        )}
                        <p className="text-emerald-200/80">
                          Compensa cerca de{" "}
                          <span className="font-semibold">
                            {(item.product.carbonCashbackKg / 1000).toFixed(
                              3
                            )}{" "}
                            t CO₂
                          </span>{" "}
                          por unidade.
                        </p>
                        <p className="text-emerald-200/80">
                          Sugestão:{" "}
                          <span className="font-semibold">
                            {item.units} unidade
                            {item.units > 1 ? "s" : ""}
                          </span>
                        </p>
                        <p className="text-emerald-300/90">
                          Compensação estimada:{" "}
                          <span className="font-semibold">
                            {item.compensated.toFixed(2)} t CO₂
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {suggestionItems.length > 0 && (
                <p className="text-emerald-200/80">
                  Dica: cada compra rende créditos verdes — estimativa por
                  sugestão:{" "}
                  <span className="font-semibold">
                    {Math.round(
                      suggestionItems.reduce(
                        (acc, it) =>
                          acc + ((it.product.carbonCashbackKg ?? 0) * it.units) / 10,
                        0
                      )
                    )}
                  </span>{" "}
                  créditos.
                </p>
              )}
              <div className="pt-3 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold text-xs hover:bg-emerald-300 transition"
                >
                  Criar conta e compensar agora
                </Link>
                <Link
                  href="/marketplace"
                  className="px-4 py-2 rounded-full border border-emerald-600 text-xs text-emerald-50 hover:bg-emerald-900/40 transition"
                >
                  Ver projetos disponíveis
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-emerald-900 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Quer levar essa calculadora para dentro da sua empresa?
            </h2>
            <p className="text-emerald-50/90 mt-1">
              O módulo corporativo da SementeToken permite acompanhar metas de
              compensação, relatórios ESG e brigadas ambientais em um só lugar.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="mailto:contato@sementetoken.com"
              className="px-5 py-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition"
            >
              Falar com nosso time ESG
            </a>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border border-emerald-600 text-emerald-50 hover:bg-emerald-900/40 transition"
            >
              Acessar painel da plataforma
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
