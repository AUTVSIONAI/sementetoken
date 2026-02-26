"use client"
import { useEffect, useState } from "react"

export default function EmbedCarbonCalculator() {
  const [carbonCalc, setCarbonCalc] = useState({
    carKmPerMonth: 0,
    energyKwhPerMonth: 0,
    shortFlightsPerYear: 0,
    longFlightsPerYear: 0
  })

  const [products, setProducts] = useState<
    {
      id: string
      name: string
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
            carbonCashbackKg: p.carbonCashbackKg ?? 0,
            projectName: p.project?.name ?? null
          }))
        )
      } catch {}
    }
    loadProducts()
  }, [API_URL])

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
            if (perUnitTons <= 0) return null
            const units = Math.ceil(annualTotalTons / perUnitTons)
            const compensated = units * perUnitTons
            return { product: p, units, compensated }
          })
          .filter(
            (x): x is {
              product: { id: string; name: string; carbonCashbackKg: number; projectName?: string | null }
              units: number
              compensated: number
            } => !!x
          )
          .sort((a, b) => a.units - b.units)
          .slice(0, 8)
      : []

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-emerald-200">
            Calculadora de carbono
            <span className="ml-2 opacity-70">•</span>
            <span className="ml-2 text-emerald-300">SementeToken</span>
          </p>
          <a
            href="https://sementetoken.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-300 hover:text-emerald-200"
          >
            by SementeToken
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-[11px] bg-slate-900/70 border border-emerald-800 rounded-xl p-3">
            <div className="space-y-1">
              <p className="text-emerald-200/80">Km de carro por mês</p>
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
              <p className="text-emerald-200/80">kWh de energia por mês</p>
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
              <p className="text-emerald-200/80">Voos curtos por ano</p>
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
              <p className="text-emerald-200/80">Voos longos por ano</p>
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

          <div className="space-y-2">
            <div className="bg-slate-900/70 border border-emerald-800 rounded-xl p-3 text-[11px] text-emerald-200/80">
              <p>
                Emissões anuais:{" "}
                <span className="font-semibold text-emerald-300">
                  {annualTotalTons.toFixed(2)} t CO₂/ano
                </span>
              </p>
              <p className="mt-1">
                Árvores sugeridas:{" "}
                <span className="font-semibold text-emerald-300">
                  {suggestedTrees}
                </span>
              </p>
            </div>

            <div className="bg-slate-900/70 border border-emerald-800 rounded-xl p-3 text-[11px]">
              <p className="text-emerald-100 font-semibold mb-2">
                Sugestões de compensação
              </p>
              {suggestionItems.length === 0 ? (
                <p className="text-emerald-200/80">
                  Preencha os dados para ver projetos e produtos que compensam sua pegada.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {suggestionItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="min-w-[160px] border border-emerald-800 rounded-lg bg-slate-950/80 p-3"
                    >
                      <p className="text-[12px] font-semibold text-emerald-100">
                        {item.product.name}
                      </p>
                      {item.product.projectName && (
                        <p className="text-emerald-200/80">
                          Projeto {item.product.projectName}
                        </p>
                      )}
                      <p className="text-emerald-200/80 mt-1">
                        {item.units} unidade{item.units > 1 ? "s" : ""} •{" "}
                        {item.compensated.toFixed(2)} t CO₂
                      </p>
                      <p className="text-emerald-200/80">
                        ≈{" "}
                        {Math.round(
                          ((item.product.carbonCashbackKg ?? 0) * item.units) / 10
                        )}{" "}
                        créditos verdes
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {suggestionItems.length > 0 && (
                <p className="mt-2 text-emerald-200/80">
                  Dica: compras sugeridas rendem créditos verdes que podem ser trocados por benefícios.
                </p>
              )}
              <p className="mt-2 text-emerald-200/80">
                Integre este widget via iframe:{" "}
                <span className="text-emerald-300">/embed/calculadora-carbono</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-emerald-200/80 text-right">
          <a
            href="https://sementetoken.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-100"
          >
            SementeToken • ESG • Florestas Reais
          </a>
        </div>
      </div>
    </div>
  )
}
