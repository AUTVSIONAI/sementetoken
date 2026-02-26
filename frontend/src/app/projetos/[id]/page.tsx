 "use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import("react-leaflet").then((m) => m.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

type Project = {
  id: string
  name: string
  description?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  totalArea?: number | null
}

type FeedItem = {
  id: string
  type: string
  description: string | null
  createdAt: string
  brigadistName: string | null
  brigadeName: string | null
  latitude: number | null
  longitude: number | null
  treeSpecies: string | null
  mediaUrl: string | null
  mediaType: string | null
  mediaDurationSeconds: number | null
}

export default function ProjetoPage() {
  const params = useParams()
  const router = useRouter()
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : ""

  const [project, setProject] = useState<Project | null>(null)
  const [projectCenter, setProjectCenter] = useState<[number, number] | null>(
    null
  )
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [projectRes, feedRes] = await Promise.all([
          fetch(`${API_URL}/projects/${id}`),
          fetch(`${API_URL}/brigades/feed?projectId=${id}`)
        ])

        if (cancelled) return

        if (projectRes.ok) {
          const p = await projectRes.json()
          setProject({
            id: p.id,
            name: p.name,
            description: p.description ?? null,
            city: p.city ?? null,
            state: p.state ?? null,
            country: p.country ?? null,
            totalArea:
              typeof p.totalArea === "number" ? p.totalArea : p.total_area ?? null
          })
        } else {
          setError("Projeto não encontrado.")
        }

        if (feedRes.ok) {
          const list = await feedRes.json()
          if (Array.isArray(list)) {
            setFeedItems(
              list.map((item: any) => ({
                id: item.id,
                type: item.type,
                description: item.description ?? null,
                createdAt: item.createdAt ?? item.created_at ?? "",
                brigadistName:
                  item.brigadistName ?? item.brigadist_name ?? null,
                brigadeName: item.brigadeName ?? item.brigade_name ?? null,
                latitude:
                  typeof item.latitude === "number" ||
                  typeof item.latitude === "string"
                    ? Number(item.latitude)
                    : null,
                longitude:
                  typeof item.longitude === "number" ||
                  typeof item.longitude === "string"
                    ? Number(item.longitude)
                    : null,
                treeSpecies: item.treeSpecies ?? item.tree_species ?? null,
                mediaUrl: item.mediaUrl ?? item.media_url ?? null,
                mediaType: item.mediaType ?? item.media_type ?? null,
                mediaDurationSeconds:
                  typeof item.mediaDurationSeconds === "number"
                    ? item.mediaDurationSeconds
                    : typeof item.media_duration_seconds === "number"
                    ? item.media_duration_seconds
                    : null
              }))
            )
          }
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar os dados do projeto.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  const locationLabel = useMemo(() => {
    if (!project) return ""
    return [project.city, project.state, project.country]
      .filter((p) => !!p && String(p).trim().length > 0)
      .join(", ")
  }, [project])

  const coordinatesLabel = useMemo(() => {
    if (!project?.description) return ""
    const match = project.description.match(/Coordenadas:\s*([-\d.,\s]+)/i)
    if (!match || !match[1]) return ""
    return match[1].trim()
  }, [project])

  const projectCoordinates = useMemo<[number, number] | null>(() => {
    if (!coordinatesLabel) return null
    const cleaned = coordinatesLabel.replace(/[^\d\-,.\s]/g, "").trim()
    const parts = cleaned
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length < 2) return null
    const lat = Number(parts[0].replace(",", "."))
    const lon = Number(parts[1].replace(",", "."))
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Number.isNaN(lat) ||
      Number.isNaN(lon)
    ) {
      return null
    }
    return [lat, lon]
  }, [coordinatesLabel])

  const hasMapData = useMemo(() => {
    const hasFeedCoords = feedItems.some(
      (i) =>
        typeof i.latitude === "number" &&
        typeof i.longitude === "number" &&
        !Number.isNaN(i.latitude) &&
        !Number.isNaN(i.longitude)
    )
    return hasFeedCoords || !!projectCenter || !!projectCoordinates
  }, [feedItems, projectCenter, projectCoordinates])

  useEffect(() => {
    if (!project) return
    const parts = [project.city, project.state, project.country].filter(
      (p) => !!p && String(p).trim().length > 0
    )
    if (parts.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const query = parts.join(", ")
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&limit=1`
        )
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return
        const first = data[0] as any
        const lat = first.lat ? Number(first.lat) : NaN
        const lon = first.lon ? Number(first.lon) : NaN
        if (
          !cancelled &&
          typeof lat === "number" &&
          typeof lon === "number" &&
          !Number.isNaN(lat) &&
          !Number.isNaN(lon)
        ) {
          setProjectCenter([lat, lon])
        }
      } catch {
      }
    })()
    return () => {
      cancelled = true
    }
  }, [project])

  const mapCenter: [number, number] = useMemo(() => {
    const itemsWithCoords = feedItems.filter(
      (i) =>
        typeof i.latitude === "number" &&
        typeof i.longitude === "number" &&
        !Number.isNaN(i.latitude) &&
        !Number.isNaN(i.longitude)
    )
    if (itemsWithCoords.length > 0) {
      const latSum = itemsWithCoords.reduce(
        (sum, i) => sum + (i.latitude ?? 0),
        0
      )
      const lngSum = itemsWithCoords.reduce(
        (sum, i) => sum + (i.longitude ?? 0),
        0
      )
      return [latSum / itemsWithCoords.length, lngSum / itemsWithCoords.length]
    }
    if (projectCoordinates) {
      return projectCoordinates
    }
    if (projectCenter) {
      return projectCenter
    }
    return [-14.235, -51.9253]
  }, [feedItems, projectCenter, projectCoordinates])

  const projectMarkerPosition = useMemo<[number, number] | null>(() => {
    if (projectCoordinates) {
      return projectCoordinates
    }
    if (projectCenter) {
      return projectCenter
    }
    return null
  }, [projectCoordinates, projectCenter])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-8">
        <header className="space-y-3">
          <button
            type="button"
            onClick={() => router.push("/marketplace")}
            className="text-xs px-3 py-1 rounded-full border border-emerald-700 text-emerald-200 hover:bg-emerald-900/60"
          >
            Voltar para o marketplace
          </button>
          <div>
            <p className="uppercase tracking-[0.2em] text-xs text-emerald-200 mt-2">
              Projeto de reflorestamento
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-50 mt-1">
              {project ? project.name : "Carregando projeto..."}
            </h1>
            {locationLabel && (
              <p className="text-sm text-emerald-200/80 mt-1">
                📍 {locationLabel}
              </p>
            )}
            {project?.totalArea && (
              <p className="text-xs text-emerald-300/80 mt-1">
                Área total: {project.totalArea} ha
              </p>
            )}
          </div>
        </header>

        {error && (
          <div className="text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {project?.description && (
              <div className="bg-slate-900/80 border border-emerald-900 rounded-2xl p-5 text-sm text-emerald-100">
                {project.description}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-emerald-900 rounded-2xl p-4 text-xs text-emerald-100">
              <h2 className="text-[11px] font-semibold text-emerald-200 mb-2">
                Localização do projeto
              </h2>
              {locationLabel ? (
                <p className="mb-1">📍 {locationLabel}</p>
              ) : (
                <p className="mb-1 text-emerald-200/70">
                  Localização ainda não informada no cadastro do projeto.
                </p>
              )}
              {typeof project?.totalArea === "number" && project.totalArea > 0 && (
                <p className="mb-1">
                  Área total estimada:{" "}
                  <span className="font-semibold">{project.totalArea} ha</span>
                </p>
              )}
              {coordinatesLabel && (
                <p className="mb-1">
                  Coordenadas aproximadas:{" "}
                  <span className="font-mono text-emerald-200">
                    {coordinatesLabel}
                  </span>
                </p>
              )}
              {!coordinatesLabel && (
                <p className="text-emerald-200/70">
                  Para precisão máxima, preencha latitude e longitude no painel
                  administrativo ao editar o projeto.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-emerald-100">
                  Ações em campo neste projeto
                </h2>
                <p className="text-xs text-emerald-200/80">
                  Plantios, inspeções e alertas de fogo ligados às coordenadas
                  deste projeto.
                </p>
              </div>
              <div className="text-[11px] text-emerald-200/80">
                {loading
                  ? "Carregando..."
                  : `${feedItems.length} ação${
                      feedItems.length === 1 ? "" : "es"
                    } registrada`}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-emerald-900 bg-slate-950/80 min-h-[260px]">
              {hasMapData ? (
                <MapContainer
                  center={mapCenter}
                  zoom={6}
                  scrollWheelZoom={false}
                  className="w-full h-72"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {projectMarkerPosition && (
                    <CircleMarker
                      center={projectMarkerPosition}
                      radius={10}
                      color="#22c55e"
                      fillColor="#22c55e"
                      fillOpacity={0.9}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-bold">
                            Centro aproximado do projeto
                          </div>
                          {locationLabel && <div>{locationLabel}</div>}
                          {coordinatesLabel && (
                            <div className="font-mono text-emerald-100 mt-1">
                              {coordinatesLabel}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  )}
                  {feedItems.map((item) => {
                    if (
                      typeof item.latitude !== "number" ||
                      typeof item.longitude !== "number" ||
                      Number.isNaN(item.latitude) ||
                      Number.isNaN(item.longitude)
                    ) {
                      return null
                    }
                    return (
                      <Marker
                        key={item.id}
                        position={[item.latitude, item.longitude]}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-bold">
                              {item.type === "planting"
                                ? "Plantio registrado"
                                : item.type === "inspection"
                                ? "Inspeção registrada"
                                : item.type === "fire_alert"
                                ? "Alerta de fogo"
                                : "Ação registrada"}
                            </div>
                            {item.brigadeName && (
                              <div>Brigada: {item.brigadeName}</div>
                            )}
                            {item.treeSpecies && (
                              <div>Espécie: {item.treeSpecies}</div>
                            )}
                            {item.description && <div>{item.description}</div>}
                            {item.createdAt && (
                              <div>
                                {new Date(
                                  item.createdAt
                                ).toLocaleString("pt-BR")}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              ) : (
                <div className="w-full h-72 flex items-center justify-center text-xs text-emerald-200/70">
                  Nenhuma ação com coordenadas registrada ainda para este
                  projeto.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-emerald-100">
              Linha do tempo das ações
            </h2>
            <p className="text-xs text-emerald-200/80">
              Acompanhe o histórico de plantios, inspeções e alertas vinculados
              a este projeto.
            </p>
            <div className="bg-slate-900/80 border border-emerald-900 rounded-2xl p-4 max-h-[420px] overflow-y-auto">
              {loading && feedItems.length === 0 ? (
                <p className="text-[11px] text-emerald-200/80">
                  Carregando ações...
                </p>
              ) : feedItems.length === 0 ? (
                <p className="text-[11px] text-emerald-200/80">
                  Nenhuma ação registrada ainda para este projeto.
                </p>
              ) : (
                <ul className="space-y-2 text-[11px]">
                  {feedItems.map((item) => (
                    <li
                      key={item.id}
                      className="border border-emerald-900/60 rounded-xl px-3 py-2 bg-slate-950/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] text-emerald-300">
                          {item.type === "planting"
                            ? "Plantio"
                            : item.type === "inspection"
                            ? "Inspeção"
                            : item.type === "fire_alert"
                            ? "Alerta de fogo"
                            : item.type}
                        </span>
                        <span className="text-[10px] text-emerald-200/70">
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString("pt-BR")
                            : ""}
                        </span>
                      </div>
                      {item.brigadeName && (
                        <p className="mt-1 text-emerald-200/80">
                          Brigada:{" "}
                          <span className="font-medium">
                            {item.brigadeName}
                          </span>
                        </p>
                      )}
                      {item.brigadistName && (
                        <p className="text-emerald-200/80">
                          Brigadista:{" "}
                          <span className="font-medium">
                            {item.brigadistName}
                          </span>
                        </p>
                      )}
                      {item.treeSpecies && (
                        <p className="text-emerald-200/80">
                          Espécie: {item.treeSpecies}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-1 text-emerald-200/80">
                          {item.description}
                        </p>
                      )}
                      {item.mediaUrl && item.mediaType && (
                        <div className="mt-2">
                          {item.mediaType === "image" ? (
                            <img
                              src={
                                item.mediaUrl.startsWith("/")
                                  ? `${API_URL}${item.mediaUrl}`
                                  : item.mediaUrl
                              }
                              alt="Mídia da ação"
                              className="max-h-40 rounded-lg border border-emerald-900/70 object-cover"
                            />
                          ) : (
                            <video
                              controls
                              className="w-full max-h-48 rounded-lg border border-emerald-900/70"
                            >
                              <source
                                src={
                                  item.mediaUrl.startsWith("/")
                                    ? `${API_URL}${item.mediaUrl}`
                                    : item.mediaUrl
                                }
                                type="video/mp4"
                              />
                            </video>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
