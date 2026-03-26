"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"

type PublicTreeResponse = {
  id: string
  imageUrl: string | null
  latitude: number | null
  longitude: number | null
  project: { id: string; name: string; city: string | null; state: string | null; country: string | null } | null
  species: string | null
  status: string | null
  nftId: string | null
  txHash: string | null
  metadataUrl: string
  tokenURI: string
  polygonUrl: string | null
}

const LeafletMap = dynamic(() => import("./tree-map"), { ssr: false })

function getApiPublicBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
  const explicit = process.env.NEXT_PUBLIC_PUBLIC_API_URL || ""

  const base = (explicit || apiUrl || "").replace(/\/+$/, "")
  if (base) {
    return base.endsWith("/api") ? base.slice(0, -4) : base
  }

  return "https://api.sementetoken.com"
}

export default function PublicTreePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PublicTreeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apiBase = useMemo(() => getApiPublicBase(), [])
  const id = params.id

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      setData(null)
      try {
        const res = await fetch(`${apiBase}/tree/${encodeURIComponent(id)}`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`Falha ao carregar árvore (${res.status})`)
        }
        const json = (await res.json()) as PublicTreeResponse
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erro ao carregar árvore")
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiBase, id])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-6">
        <div className="bg-slate-900/60 border border-emerald-900/60 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-200/80">
                Verificação Pública
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                Árvore {id}
              </h1>
              {data?.project?.name ? (
                <p className="text-sm text-emerald-100/80 mt-2">
                  Projeto: <span className="font-semibold text-emerald-100">{data.project.name}</span>
                </p>
              ) : null}
            </div>
            <div className="text-xs text-emerald-100/80 space-y-1">
              {data?.status ? <div>Status: <span className="text-emerald-100">{data.status}</span></div> : null}
              {data?.species ? <div>Espécie: <span className="text-emerald-100">{data.species}</span></div> : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-950/50 border border-rose-900/60 rounded-2xl p-6 text-rose-100">
            {error}
          </div>
        ) : null}

        {data ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-emerald-900/60">
                <h2 className="text-lg font-semibold">Imagem</h2>
              </div>
              <div className="p-6">
                {data.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={`Árvore ${data.id}`}
                    className="w-full max-h-[420px] object-contain rounded-xl border border-emerald-900/60 bg-black/30"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-sm text-emerald-100/70">
                    Sem imagem cadastrada.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-emerald-900/60">
                <h2 className="text-lg font-semibold">Localização</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">Latitude</div>
                    <div className="mt-1 font-mono text-emerald-100">{data.latitude ?? "null"}</div>
                  </div>
                  <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">Longitude</div>
                    <div className="mt-1 font-mono text-emerald-100">{data.longitude ?? "null"}</div>
                  </div>
                </div>

                {data.latitude != null && data.longitude != null ? (
                  <div className="rounded-xl overflow-hidden border border-emerald-900/60">
                    <LeafletMap latitude={data.latitude} longitude={data.longitude} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {data ? (
          <div className="bg-slate-900/60 border border-emerald-900/60 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Links e Dados</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">Metadata</div>
                <a className="mt-1 block text-sky-200 hover:text-sky-100 break-all" href={data.metadataUrl} target="_blank" rel="noreferrer">
                  {data.metadataUrl}
                </a>
              </div>
              <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">TokenURI</div>
                <div className="mt-1 font-mono text-emerald-100 break-all">{data.tokenURI}</div>
              </div>
              <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">txHash</div>
                <div className="mt-1 font-mono text-emerald-100 break-all">{data.txHash ?? "null"}</div>
              </div>
              <div className="bg-slate-950/50 border border-emerald-900/40 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">PolygonScan</div>
                {data.polygonUrl ? (
                  <a className="mt-1 block text-sky-200 hover:text-sky-100 break-all" href={data.polygonUrl} target="_blank" rel="noreferrer">
                    {data.polygonUrl}
                  </a>
                ) : (
                  <div className="mt-1 text-emerald-100/70">Não disponível</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
