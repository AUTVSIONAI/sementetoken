"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const MapBrazil = dynamic(() => import("@/components/MapBrazil"), {
  ssr: false
})

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

type Project = {
  id: string
  name: string
  description?: string
  city?: string
  state?: string
  country?: string
  totalArea?: number
}

type MarketplaceProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  carbonCashbackKg: number
  projectName?: string | null
  projectState?: string | null
  projectCountry?: string | null
}

type Species = {
  id: string
  commonName: string
  scientificName?: string
  biome?: string
  imageUrl?: string
}

type ChatMessage = {
  role: "assistant" | "user"
  content: string
}

export default function Marketplace() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [filterText, setFilterText] = useState("")
  const [filterRegion, setFilterRegion] = useState<string>("")
  const [filterImpact, setFilterImpact] = useState<"any" | "with" | "without">(
    "any"
  )
  const [filterBiome, setFilterBiome] = useState<string>("")
  const [speciesImageCache, setSpeciesImageCache] = useState<
    Record<string, string>
  >({})
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingProducts, setLoadingProductsState] = useState(true)
  const [errorProjects, setErrorProjects] = useState("")
  const [errorProducts, setErrorProducts] = useState("")
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null)
  const [techModalProduct, setTechModalProduct] =
    useState<MarketplaceProduct | null>(null)
  const [agentProduct, setAgentProduct] =
    useState<MarketplaceProduct | null>(null)
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([])
  const [agentInput, setAgentInput] = useState("")
  const [agentLoading, setAgentLoading] = useState(false)

  const techModalSpecies =
    techModalProduct
      ? species.find(
          (s) =>
            s.commonName.toLowerCase() ===
            techModalProduct.name.toLowerCase()
        ) || null
      : null

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        const [projectsRes, productsRes, speciesRes] = await Promise.all([
          fetch(`${API_URL}/projects`),
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/species`)
        ])

        if (!cancelled) {
          if (projectsRes.ok) {
            const data = await projectsRes.json()
            setProjects(Array.isArray(data) ? data : [])
          } else {
            setErrorProjects("Não foi possível carregar os projetos")
          }

          if (productsRes.ok) {
            const data = await productsRes.json()
            setProducts(
              Array.isArray(data)
                ? data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description ?? null,
                    price: p.price ?? 0,
                    carbonCashbackKg: p.carbonCashbackKg ?? 0,
                    projectName: p.project?.name ?? null,
                    projectState: p.project?.state ?? null,
                    projectCountry: p.project?.country ?? null
                  }))
                : []
            )
          } else {
            setErrorProducts("Não foi possível carregar os produtos de árvores")
          }

          if (speciesRes.ok) {
            const data = await speciesRes.json()
            setSpecies(Array.isArray(data) ? data : [])
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          if (!projects.length) {
            setErrorProjects(
              err?.message || "Erro ao carregar projetos do marketplace"
            )
          }
          if (!products.length) {
            setErrorProducts(
              err?.message ||
                "Erro ao carregar produtos de árvores do marketplace"
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false)
          setLoadingProductsState(false)
        }
      }
    }

    loadAll()

    return () => {
      cancelled = true
    }
  }, [])

  async function handlePlant(projectId: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null

    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`${API_URL}/trees/plant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ projectId })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao plantar árvore")
      }
      alert("Sua semente digital foi plantada com sucesso! 🌱")
      router.push("/dashboard")
    } catch (err: any) {
      alert(err.message || "Erro ao plantar árvore")
    }
  }

  function handleViewProject(projectId: string) {
    router.push(`/projetos/${projectId}`)
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    })
  }

  function getImageUrl(url: string | undefined | null) {
    if (!url) return undefined
    if (url.startsWith("http")) return url
    if (url.startsWith("/api/")) return url
    if (url.startsWith("/")) return `/api${url}`
    return `/api/${url}`
  }

  // Imagens de espécies são carregadas preferencialmente via imageUrl vindo do backend.

  const regions = Array.from(
    new Set(
      projects
        .map((p) => p.state || "")
        .filter((s): s is string => !!s && s.trim().length > 0)
    )
  ).sort()

  const biomes = Array.from(
    new Set(
      species
        .map((s) => s.biome || "")
        .filter((b): b is string => !!b && b.trim().length > 0)
    )
  ).sort()

  const filteredProducts = products.filter((p) => {
    const normalizedProductName = p.name.toLowerCase().trim()
    const related =
      species.find((s) => {
        const common = s.commonName.toLowerCase().trim()
        return (
          common === normalizedProductName ||
          common.includes(normalizedProductName) ||
          normalizedProductName.includes(common)
        )
      }) || null
    const scientific = (related?.scientificName || "").toLowerCase()
    const name = p.name.toLowerCase()
    const q = filterText.trim().toLowerCase()
    if (q && !(name.includes(q) || scientific.includes(q))) {
      return false
    }
    // filtro de região (estado)
    if (filterRegion && p.projectState !== filterRegion) {
      return false
    }
    // filtro de bioma
    if (filterBiome && related?.biome !== filterBiome) {
      return false
    }
    // filtro de impacto (cashback)
    if (filterImpact === "with" && !(p.carbonCashbackKg > 0)) {
      return false
    }
    if (filterImpact === "without" && p.carbonCashbackKg > 0) {
      return false
    }
    return true
  })

  async function handleBuyProduct(productId: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null

    if (!token) {
      router.push("/login")
      return
    }

    setBuyingProductId(productId)

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [
            {
              productId,
              quantity: 1
            }
          ]
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao finalizar a compra")
      }

      alert(
        "Compra realizada! Você recebeu tokens de carbono vinculados a esta árvore."
      )
      router.push("/dashboard")
    } catch (err: any) {
      alert(err?.message || "Erro ao finalizar compra")
    } finally {
      setBuyingProductId(null)
    }
  }

  function openAgentForProduct(product: MarketplaceProduct) {
    setAgentProduct(product)
    const relatedSpecies =
      species.find(
        (s) => s.commonName.toLowerCase() === product.name.toLowerCase()
      ) || null
    const commonDisplayName = relatedSpecies?.commonName || product.name
    const speciesName =
      relatedSpecies?.scientificName ||
      relatedSpecies?.commonName ||
      product.name
    const biome = relatedSpecies?.biome || ""
    const locationParts = [product.projectState, product.projectCountry].filter(
      Boolean
    )
    const locationLabel = locationParts.length
      ? locationParts.join(", ")
      : "projetos de floresta conectados à SementeToken"

    const parts: string[] = []
    parts.push(
      `Olá, eu sou a árvore digital da espécie ${commonDisplayName} (${speciesName}).`
    )
    if (biome) {
      parts.push(`Eu represento plantios em áreas de bioma ${biome}.`)
    }
    parts.push(
      `Quando você compra este produto, novas árvores reais são plantadas em ${locationLabel}, gerando impacto positivo em carbono e biodiversidade.`
    )
    parts.push(
      "Você pode me perguntar sobre benefícios ambientais, carbono, biodiversidade ou como este projeto funciona."
    )

    setAgentMessages([
      {
        role: "assistant",
        content: parts.join(" ")
      }
    ])
    setAgentInput("")
  }

  async function sendAgentMessage() {
    if (!agentProduct) return
    if (!agentInput.trim() || agentLoading) return

    const messageToSend = agentInput
    const nextMessages: ChatMessage[] = [
      ...agentMessages,
      { role: "user", content: messageToSend }
    ]
    setAgentMessages(nextMessages)
    setAgentInput("")
    setAgentLoading(true)

    try {
      const relatedSpecies =
        species.find(
          (s) =>
            s.commonName.toLowerCase() === agentProduct.name.toLowerCase()
        ) || null
      const speciesName =
        relatedSpecies?.scientificName ||
        relatedSpecies?.commonName ||
        agentProduct.name
      const locationParts = [
        agentProduct.projectName
          ? `Projeto ${agentProduct.projectName}`
          : null,
        [agentProduct.projectState, agentProduct.projectCountry]
          .filter(Boolean)
          .join(", ") || null
      ]
        .filter(Boolean)
        .join(" • ") || "Projeto de floresta da SementeToken"

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          treeId: `marketplace-product-${agentProduct.id}`,
          message: messageToSend,
          species: speciesName,
          locationDescription: locationParts,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      setAgentMessages([
        ...nextMessages,
        { role: "assistant", content: data.response as string }
      ])
    } catch {
      setAgentMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Não consegui responder agora, mas continuo aqui enraizada na floresta digital aguardando você."
        }
      ])
    } finally {
      setAgentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-8">
        <header className="space-y-3">
          <p className="uppercase tracking-[0.2em] text-xs text-emerald-200">
            Escolha um projeto • Plante • Acompanhe
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Marketplace de reflorestamento inteligente
          </h1>
          <p className="text-sm md:text-base text-emerald-50/90 max-w-2xl">
            Explore projetos reais cadastrados pela SementeToken e parceiros,
            conectando cada compra a uma árvore digital única.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/80 rounded-2xl border border-emerald-900 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-emerald-100">
                Filtros rápidos
              </h2>
              <input
                type="text"
                placeholder="Buscar por nome comum ou científico..."
                className="p-2 border border-emerald-900 rounded w-full text-sm bg-slate-950 text-emerald-100 placeholder:text-emerald-500/60"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
              <select
                className="p-2 border border-emerald-900 rounded w-full text-sm bg-slate-950 text-emerald-100"
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="">Todas as regiões</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border border-emerald-900 rounded w-full text-sm bg-slate-950 text-emerald-100"
                value={filterBiome}
                onChange={(e) => setFilterBiome(e.target.value)}
              >
                <option value="">Todos os biomas</option>
                {biomes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border border-emerald-900 rounded w-full text-sm bg-slate-950 text-emerald-100"
                value={filterImpact}
                onChange={(e) =>
                  setFilterImpact(e.target.value as "any" | "with" | "without")
                }
              >
                <option value="any">Qualquer impacto de CO₂</option>
                <option value="with">Com cashback de CO₂</option>
                <option value="without">Sem cashback de CO₂</option>
              </select>
              <p className="text-[11px] text-emerald-400/70">
                Dica: combine busca por nome com bioma, região e impacto.
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-sky-900 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-emerald-100">
                Projetos em destaque
              </h2>
              {loadingProjects && (
                <p className="text-xs text-emerald-300/80">
                  Carregando projetos do backend...
                </p>
              )}
              {!loadingProjects && errorProjects && (
                <p className="text-xs text-red-400">{errorProjects}</p>
              )}
              {!loadingProjects && !errorProjects && projects.length === 0 && (
                <p className="text-xs text-emerald-300/80">
                  Nenhum projeto cadastrado ainda. Use o painel admin para criar
                  os primeiros.
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                {projects.map((project) => {
                  const location = [project.city, project.state, project.country]
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <div
                      key={project.id}
                      className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition"
                    >
                      <div className="h-20 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-300 flex items-center justify-center text-xs text-emerald-950 font-semibold px-4 text-center">
                        {project.name}
                      </div>
                      <div className="p-3 space-y-1">
                        {location && (
                          <p className="text-xs text-emerald-100/80">
                            📍 {location}
                          </p>
                        )}
                        {project.description && (
                          <p className="text-xs text-emerald-200/80 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        {typeof project.totalArea === "number" && (
                          <p className="text-[11px] text-emerald-300/80">
                            Área total: {project.totalArea} ha
                          </p>
                        )}
                        <div className="mt-2 flex flex-col gap-2">
                          <button
                            className="w-full bg-emerald-400 text-emerald-950 text-xs py-2 rounded-full hover:bg-emerald-300 transition"
                            onClick={() => handlePlant(project.id)}
                          >
                            Plantar neste projeto
                          </button>
                          <button
                            type="button"
                            className="w-full text-[11px] text-emerald-300 hover:text-emerald-100"
                            onClick={() => handleViewProject(project.id)}
                          >
                            Ver detalhes do projeto
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-100">
                    Mapa de árvores
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Cada ponto representa uma árvore ou grupo de árvores com
                    coordenadas reais cadastradas pelos projetos.
                  </p>
                </div>
                <div className="hidden md:flex gap-3 text-xs text-emerald-200/80">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full" />
                    Alta densidade
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-3 h-3 bg-lime-300 rounded-full" />
                    Plantios recentes
                  </span>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-emerald-900 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
                <MapBrazil />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-100">
                    Catálogo de árvores como produto
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Espécies configuradas no painel admin aparecem aqui como
                    produtos prontos para compra.
                  </p>
                </div>
                {products.length > 0 && (
                  <div className="hidden md:flex items-center gap-2 text-[11px] text-emerald-200/80">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Token verde
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                      Cashback CO₂
                    </span>
                  </div>
                )}
              </div>
              {loadingProducts && (
                <p className="text-xs text-emerald-300/80">
                  Carregando produtos de árvores...
                </p>
              )}
              {!loadingProducts && errorProducts && (
                <p className="text-xs text-red-400">{errorProducts}</p>
              )}
              {!loadingProducts &&
                !errorProducts &&
                products.length === 0 && (
                  <p className="text-xs text-emerald-300/80">
                    Nenhum produto de árvore cadastrado ainda. Use o painel admin
                    para publicar espécies como produtos.
                  </p>
                )}
              {!loadingProducts && products.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => {
                    const normalizedProductName = product.name
                      .toLowerCase()
                      .trim()
                    const candidates = species.filter((s) => {
                      const common = (s.commonName || "").toLowerCase().trim()
                      if (!common) return false
                      return (
                        common === normalizedProductName ||
                        common.includes(normalizedProductName) ||
                        normalizedProductName.includes(common)
                      )
                    })
                    const relatedSpecies =
                      candidates.find((s) => !!s.imageUrl) ||
                      candidates[0] ||
                      null

                    return (
                      <div
                        key={product.id}
                        className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition flex flex-col"
                      >
                        {relatedSpecies?.imageUrl ||
                        speciesImageCache[product.id] ? (
                          <div className="h-32 bg-slate-900 overflow-hidden">
                            <img
                              src={
                                getImageUrl(relatedSpecies?.imageUrl) ||
                                speciesImageCache[product.id]
                              }
                              alt={relatedSpecies?.commonName || product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-400 flex items-center justify-center text-xs text-emerald-950 font-semibold px-4 text-center">
                            {product.name}
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col gap-2 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-emerald-100 font-medium">
                                {product.name}
                              </p>
                              {relatedSpecies?.scientificName && (
                                <p className="text-[11px] text-emerald-300/80 italic">
                                  {relatedSpecies.scientificName}
                                </p>
                              )}
                              {relatedSpecies?.biome && (
                                <p className="text-[11px] text-emerald-200/80">
                                  Bioma: {relatedSpecies.biome}
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] text-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  1 árvore tokenizada
                                </span>
                            {(product.projectState || product.projectCountry) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-[10px] text-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                                {[product.projectState, product.projectCountry]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                                {product.carbonCashbackKg > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40 text-[10px] text-sky-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                                    Cashback verde
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-300">
                                {formatCurrency(product.price)}
                              </p>
                              <p className="text-[11px] text-sky-300">
                                {(product.carbonCashbackKg / 1000).toFixed(2)} t
                                CO₂
                              </p>
                            </div>
                          </div>
                          {product.description && (
                            <p className="text-xs text-emerald-200/80 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <div className="flex flex-col gap-2">
                              <button
                                className="w-full bg-emerald-400 text-emerald-950 text-xs py-2 rounded-full hover:bg-emerald-300 transition disabled:opacity-50"
                                onClick={() => handleBuyProduct(product.id)}
                                disabled={buyingProductId === product.id}
                              >
                                {buyingProductId === product.id
                                  ? "Processando compra..."
                                  : "Comprar esta árvore"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openAgentForProduct(product)}
                                className="w-full border border-emerald-700/70 text-[11px] text-emerald-100 rounded-full py-1.5 hover:bg-emerald-900/60"
                              >
                                Conversar com a IA desta árvore
                              </button>
                              <button
                                type="button"
                                onClick={() => setTechModalProduct(product)}
                                className="w-full text-[11px] text-emerald-300 hover:text-emerald-100"
                              >
                                Ver ficha técnica da árvore
                              </button>
                            </div>
                          </div>
                          {agentProduct && agentProduct.id === product.id && (
                            <div className="mt-3 border border-emerald-900 rounded-2xl bg-slate-950/90 p-3 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <h3 className="text-xs font-semibold text-emerald-100">
                                    Agente IA desta árvore
                                  </h3>
                                  <p className="text-[11px] text-emerald-200/80">
                                    Converse com a árvore antes de finalizar a compra.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAgentProduct(null)
                                    setAgentMessages([])
                                    setAgentInput("")
                                  }}
                                  className="text-[11px] text-emerald-300 hover:text-emerald-100"
                                >
                                  Fechar
                                </button>
                              </div>
                              <div className="h-40 rounded border border-emerald-800 bg-slate-900/80 p-2 overflow-y-auto space-y-2">
                                {agentMessages.map((m, index) => (
                                  <div key={index} className="mb-1">
                                    <p className="text-[10px] text-emerald-200/80">
                                      {m.role === "assistant" ? "Árvore diz:" : "Você:"}
                                    </p>
                                    <div
                                      className={
                                        m.role === "assistant"
                                          ? "bg-emerald-500/20 border border-emerald-500/60 p-1.5 rounded-xl inline-block max-w-xs"
                                          : "bg-sky-500/20 border border-sky-500/60 p-1.5 rounded-xl inline-block max-w-xs self-end"
                                      }
                                    >
                                      {m.content}
                                    </div>
                                  </div>
                                ))}
                                {!agentMessages.length && (
                                  <p className="text-[11px] text-emerald-200/70">
                                    Envie uma pergunta para começar a conversa com a árvore deste
                                    produto.
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  className="flex-grow p-2 border border-emerald-800 rounded text-xs bg-slate-950 text-emerald-50 placeholder:text-emerald-500/70"
                                  placeholder="Pergunte algo para a árvore..."
                                  value={agentInput}
                                  onChange={(e) => setAgentInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") sendAgentMessage()
                                  }}
                                  disabled={agentLoading}
                                />
                                <button
                                  type="button"
                                  onClick={sendAgentMessage}
                                  disabled={agentLoading}
                                  className="bg-emerald-400 text-emerald-950 px-3 py-1.5 rounded-full text-xs disabled:opacity-50 hover:bg-emerald-300"
                                >
                                  {agentLoading ? "Enviando..." : "Enviar"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
        {techModalProduct && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-xl mx-4 bg-slate-950 border border-emerald-800 rounded-2xl p-5 relative">
              <button
                onClick={() => setTechModalProduct(null)}
                className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full border border-emerald-700 text-emerald-200 hover:bg-emerald-900/60"
              >
                Fechar
              </button>
              <div className="flex flex-col md:flex-row gap-4">
                {(techModalSpecies?.imageUrl ||
                  (techModalProduct &&
                    speciesImageCache[techModalProduct.id])) && (
                  <div className="w-full md:w-40 h-32 md:h-40 rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={
                        getImageUrl(techModalSpecies?.imageUrl) ||
                        (techModalProduct
                          ? speciesImageCache[techModalProduct.id]
                          : "")
                      }
                      alt={
                        techModalSpecies?.commonName ||
                        techModalProduct?.name ||
                        ""
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2 text-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-100">
                      {techModalProduct?.name}
                    </h2>
                    {techModalSpecies?.scientificName && (
                      <p className="text-[11px] text-emerald-300/80 italic">
                        {techModalSpecies.scientificName}
                      </p>
                    )}
                    {techModalSpecies?.biome && (
                      <p className="text-[11px] text-emerald-200/80">
                        Bioma: {techModalSpecies.biome}
                      </p>
                    )}
                    {(techModalProduct?.projectState ||
                      techModalProduct?.projectCountry) && (
                      <p className="text-[11px] text-emerald-200/80">
                        Região:{" "}
                        {[
                          techModalProduct?.projectState,
                          techModalProduct?.projectCountry
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  {techModalProduct?.description && (
                    <p className="text-[11px] text-emerald-200/80">
                      {techModalProduct.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-emerald-200/80">
                    <div>
                      <p className="text-emerald-300/90">Preço</p>
                      <p className="text-base font-semibold text-emerald-100">
                        {techModalProduct &&
                          formatCurrency(techModalProduct.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-300/90">Cashback de carbono</p>
                      <p className="text-base font-semibold text-sky-300">
                        {techModalProduct &&
                          (techModalProduct.carbonCashbackKg / 1000).toFixed(2)}{" "}
                        t CO₂
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    Ao comprar esta árvore, você apoia um projeto de floresta e
                    recebe tokens de carbono vinculados a esta espécie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
