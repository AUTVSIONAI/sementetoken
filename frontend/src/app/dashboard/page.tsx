"use client"

import { useEffect, useState } from "react"
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
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
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
)

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type UserTree = {
  id: string
  species: string
  estimatedCo2Total: number
  plantedAt: string | null
  growthStage?: string | null
  projectName?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  carbonCashbackKg: number
  projectName?: string | null
  projectCity?: string | null
  projectState?: string | null
  projectCountry?: string | null
}

type StoreSpecies = {
  id: string
  commonName: string
  scientificName?: string | null
  biome?: string | null
  imageUrl?: string | null
}

type SemeTransactionSummary = {
  id: string
  walletAddress: string
  amountSeme: string
  treesEquivalent: number
  txHash: string
  status: string
  createdAt: string
}

function buildTreeIntroText(options: {
  speciesName: string
  commonDisplayName: string
  biome?: string | null
  projectName?: string | null
  locationLabel: string
  growthStage?: string | null
  context: "guardian" | "product"
}): string {
  const speciesName = options.speciesName
  const commonDisplayName = options.commonDisplayName
  const biome = options.biome || ""
  const projectName = options.projectName || null
  const locationLabel = options.locationLabel
  const growthStage = options.growthStage || null
  const context = options.context

  const biomeLower = biome.toLowerCase()
  const commonLower = commonDisplayName.toLowerCase()
  const growthLower = growthStage ? growthStage.toLowerCase() : ""

  let speciesHighlight = ""
  if (commonLower.includes("castanha") || commonLower.includes("castanheira")) {
    speciesHighlight =
      "Sou uma grande guardiã da floresta, famosa pelas castanhas nutritivas que sustentam pessoas e animais."
  } else if (commonLower.includes("ipê")) {
    speciesHighlight =
      "Sou uma árvore de flores marcantes, muito importante para a beleza e a biodiversidade das cidades e florestas."
  } else if (commonLower.includes("araucária")) {
    speciesHighlight =
      "Sou uma árvore símbolo das florestas de altitude, com pinhões que alimentam a fauna e as pessoas."
  } else if (commonLower.includes("mangue") || biomeLower.includes("mangue")) {
    speciesHighlight =
      "Sou uma árvore de manguezal, essencial para proteger a costa, filtrar a água e abrigar muitas espécies."
  }

  let biomeHighlight = ""
  if (biomeLower.includes("amaz")) {
    biomeHighlight =
      "Faço parte de ecossistemas ligados à Amazônia, uma das florestas mais importantes do planeta."
  } else if (biomeLower.includes("cerrado")) {
    biomeHighlight =
      "Estou ligada ao Cerrado, berço das águas e um dos biomas mais ricos em biodiversidade do mundo."
  } else if (
    biomeLower.includes("mata atl") ||
    biomeLower.includes("atlântica")
  ) {
    biomeHighlight =
      "Ajudo a restaurar a Mata Atlântica, uma floresta muito ameaçada, mas cheia de vida."
  } else if (biomeLower.includes("caatinga")) {
    biomeHighlight =
      "Sou adaptada a paisagens mais secas da Caatinga, contribuindo para manter a vida mesmo em climas desafiadores."
  } else if (biomeLower.includes("pampa")) {
    biomeHighlight =
      "Minha presença ajuda a proteger campos e paisagens abertas do Pampa, importantes para muitas espécies."
  } else if (biomeLower.includes("pantanal")) {
    biomeHighlight =
      "Estou conectada a áreas úmidas como o Pantanal, fundamentais para a água, a fauna e o clima."
  }

  let growthHighlight = ""
  if (growthLower) {
    if (
      growthLower.includes("muda") ||
      growthLower.includes("recém") ||
      growthLower.includes("recem")
    ) {
      growthHighlight =
        "Sou uma muda recém-plantada, saudável e em fase de adaptação ao novo solo."
    } else if (growthLower.includes("jovem")) {
      growthHighlight =
        "Sou uma árvore jovem, com raízes se aprofundando e copa crescendo de forma saudável."
    } else if (growthLower.includes("adulta") || growthLower.includes("madura")) {
      growthHighlight =
        "Sou uma árvore adulta, com boa saúde e contribuindo bastante para o equilíbrio do clima ao meu redor."
    } else {
      growthHighlight =
        "Estou em um estágio de desenvolvimento saudável, acompanhada pela equipe do projeto e pela IA da floresta."
    }
  } else if (context === "product") {
    growthHighlight =
      "Quando eu for plantada, começarei minha jornada como uma muda saudável, crescendo passo a passo junto com o projeto."
  }

  const parts = [
    `Olá, eu sou o espírito digital de uma árvore da espécie ${speciesName}, conhecida como ${commonDisplayName}.`,
    speciesHighlight || null,
    biomeHighlight || null,
    projectName ? `Estou ligada ao projeto ${projectName}` : null,
    `e crio raízes em ${locationLabel}.`,
    growthHighlight || null,
    context === "product"
      ? "Você pode me perguntar sobre a espécie, o projeto e como sua compra ajuda a restaurar essa região."
      : "Você pode conversar comigo sobre como está a floresta, o projeto e o impacto das suas árvores."
  ].filter(Boolean)

  return parts.join(" ")
}

type Benefit = {
  id: string
  title: string
  description: string
  minCredits: number
  discountPercent: number
}

type BrigadeSummary = {
  brigade: {
    id: string
    name: string
    description?: string | null
    city: string | null
    state: string | null
    country: string | null
  }
  stats: {
    totalTrees: number
    plantings: number
    inspections: number
    fireAlerts: number
    actionsCount: number
  }
  brigadists: {
    id: string
    name: string
    role: string | null
    email: string | null
  }[]
}

type FireAlert = {
  id: string
  latitude: number
  longitude: number
  description: string | null
  createdAt: string
  projectId: string | null
}

type BrigadeActionTimeline = {
  id: string
  type: string
  description: string | null
  createdAt: string
  brigadistName: string | null
}

type BrigadistTask = {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  createdAt: string
}

type WalletSummary = {
  greenBalance: number
  seedBalance: number
  createdAt: string
  updatedAt: string
}

type ConversionSummary = {
  id: string
  greenSpent: number
  seedGenerated: number
  treeId: string | null
  blockchainTxId: string | null
  status: string
  createdAt: string
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
  ownerRole: string | null
  treeSpecies: string | null
  mediaUrl: string | null
  mediaType: string | null
  mediaDurationSeconds: number | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

function getImageUrl(url: string | undefined | null) {
  if (!url) return undefined
  if (url.startsWith("http")) return url
  if (url.startsWith("/api/")) return url
  if (url.startsWith("/")) return `/api${url}`
  return `/api/${url}`
}
const SEME_ADDRESS =
  process.env.NEXT_PUBLIC_SEME_ADDRESS ||
  process.env.NEXT_PUBLIC_SEME_TOKEN_ADDRESS ||
  process.env.SEME_ADDRESS ||
  ""
const TREE_ADDRESS =
  process.env.NEXT_PUBLIC_TREE_ADDRESS || process.env.TREE_ADDRESS || ""
const NFT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_ADDRESS || process.env.NFT_ADDRESS || ""
const POLYGON_CHAIN_ID_HEX = "0x89"

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalTrees: 0,
    totalCo2: 0,
    nfts: 0,
    greenCredits: 0
  })
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá, eu sou o espírito digital da sua árvore. Obrigada por cuidar de mim! 🌱"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<
    | "overview"
    | "wallet"
    | "trees"
    | "chat"
    | "ranking"
    | "store"
    | "brigade"
    | "feed"
  >("overview")
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [lastSpokenIndex, setLastSpokenIndex] = useState<number | null>(null)
  const [userTrees, setUserTrees] = useState<UserTree[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({})
  const [selectedBrigadistId, setSelectedBrigadistId] = useState<string | null>(
    null
  )
  const [brigadistTasks, setBrigadistTasks] = useState<BrigadistTask[]>([])
  const [ordering, setOrdering] = useState(false)
  const [orderMessage, setOrderMessage] = useState<string | null>(null)
  const [treeMood, setTreeMood] = useState<"neutral" | "positive" | "negative">(
    "neutral"
  )
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [brigade, setBrigade] = useState<BrigadeSummary | null>(null)
  const [brigadistForm, setBrigadistForm] = useState({
    name: "",
    role: "",
    email: ""
  })
  const [brigadeMessage, setBrigadeMessage] = useState<string | null>(null)
  const [fireAlerts, setFireAlerts] = useState<FireAlert[]>([])
  const [brigadeActions, setBrigadeActions] = useState<BrigadeActionTimeline[]>(
    []
  )
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletChainId, setWalletChainId] = useState<string | null>(null)
  const [semeBalance, setSemeBalance] = useState<string | null>(null)
  const [metamaskConnecting, setMetamaskConnecting] = useState(false)
  const [metamaskError, setMetamaskError] = useState<string | null>(null)
  const [semeAmount, setSemeAmount] = useState("")
  const [semeActionMessage, setSemeActionMessage] = useState<string | null>(null)
  const [semeApproving, setSemeApproving] = useState(false)
  const [semePlanting, setSemePlanting] = useState(false)
  const [semeTransactions, setSemeTransactions] = useState<
    SemeTransactionSummary[]
  >([])
  const [conversions, setConversions] = useState<ConversionSummary[]>([])
  const [conversionAmount, setConversionAmount] = useState("")
  const [conversionMessage, setConversionMessage] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [carbonCalc, setCarbonCalc] = useState({
    carKmPerMonth: 0,
    energyKwhPerMonth: 0,
    shortFlightsPerYear: 0,
    longFlightsPerYear: 0
  })
  const [hasSavedCarbonProfile, setHasSavedCarbonProfile] = useState(false)
  const [calcProductId, setCalcProductId] = useState<string | null>(null)
  const [distSelected, setDistSelected] = useState<Record<string, boolean>>({})
  const [showCarbonModal, setShowCarbonModal] = useState(false)
  const [storeSpecies, setStoreSpecies] = useState<StoreSpecies[]>([])
  const [techModalProduct, setTechModalProduct] = useState<Product | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [newAction, setNewAction] = useState({
    type: "planting" as "planting" | "inspection" | "fire_alert",
    description: "",
    treeId: "",
    latitude: "",
    longitude: "",
    mediaFile: null as File | null,
    mediaPreviewUrl: "" as string,
    mediaDurationSeconds: 0 as number
  })
  const [marketChatProduct, setMarketChatProduct] = useState<Product | null>(null)
  const [marketChatMessages, setMarketChatMessages] = useState<ChatMessage[]>([])
  const [marketChatInput, setMarketChatInput] = useState("")
  const [marketChatLoading, setMarketChatLoading] = useState(false)

  const [chatMode, setChatMode] = useState<"guardian" | "forest">("guardian")
  const [forestMessages, setForestMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Olá, eu sou a inteligência coletiva da floresta SementeToken. Consigo enxergar suas árvores, projetos, brigadas e créditos verdes para te ajudar a tomar decisões melhores. 🌳🌎"
    }
  ])
  const [forestInput, setForestInput] = useState("")
  const [forestLoading, setForestLoading] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<
    { title: string; description?: string; selected?: boolean }[]
  >([])
  const [aiError, setAiError] = useState<string | null>(null)
  const [autoFireSuggestionsSeeded, setAutoFireSuggestionsSeeded] = useState(false)
  const [autoFromFireLoading, setAutoFromFireLoading] = useState(false)

  const techModalSpecies =
    techModalProduct
      ? storeSpecies.find(
          (s) =>
            s.commonName.toLowerCase() ===
            techModalProduct.name.toLowerCase()
        ) || null
      : null

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
          .filter((x): x is { product: Product; units: number; compensated: number } => !!x)
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

  const guardianTree = userTrees.length > 0 ? userTrees[0] : null
  const seedlingTreesCount = userTrees.filter((t) => {
    const label = (t.growthStage || "").toLowerCase()
    return (
      label.includes("muda") ||
      label.includes("recém") ||
      label.includes("recem")
    )
  }).length
  const youngTreesCount = userTrees.filter((t) =>
    (t.growthStage || "").toLowerCase().includes("jovem")
  ).length
  const adultTreesCount = userTrees.filter((t) => {
    const label = (t.growthStage || "").toLowerCase()
    return label.includes("adulta") || label.includes("madura")
  }).length

  const isTreeTalking =
    chatMode === "forest"
      ? forestMessages.length > 0 &&
        forestMessages[forestMessages.length - 1].role === "assistant"
      : messages.length > 0 &&
        messages[messages.length - 1].role === "assistant"

  useEffect(() => {
    if (!guardianTree) return
    if (messages.length !== 1) return
    if (messages[0].role !== "assistant") return

    const relatedSpecies =
      storeSpecies.find(
        (s) =>
          s.commonName.toLowerCase() === guardianTree.species.toLowerCase()
      ) || null

    const commonDisplayName =
      relatedSpecies?.commonName || guardianTree.species
    const speciesName =
      relatedSpecies?.scientificName ||
      relatedSpecies?.commonName ||
      guardianTree.species

    const locationParts = [
      guardianTree.city,
      guardianTree.state,
      guardianTree.country
    ].filter(Boolean)

    const locationLabel = locationParts.length
      ? locationParts.join(", ")
      : "projetos da SementeToken"

    const biome = relatedSpecies?.biome || ""

    const introText = buildTreeIntroText({
      speciesName,
      commonDisplayName,
      biome,
      projectName: guardianTree.projectName,
      locationLabel,
      growthStage: guardianTree.growthStage,
      context: "guardian"
    })

    setMessages([
      {
        role: "assistant",
        content: introText
      }
    ])
  }, [guardianTree, storeSpecies, messages])

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      router.push("/login")
      return
    }

    async function loadSummary(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        setStats({
          totalTrees: data.totalTrees ?? 0,
          totalCo2: data.totalCo2 ?? 0,
          nfts: data.nfts ?? 0,
          greenCredits: data.greenCredits ?? 0
        })
      } catch {
      }
    }

    async function loadProfile(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.role) {
          setRole(data.role)
        }
      } catch {
      }
    }

    async function loadUserTrees(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/dashboard/trees`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        setUserTrees(
          Array.isArray(data)
            ? data.map((t: any) => ({
                id: t.id,
                species: t.species,
                estimatedCo2Total: t.estimatedCo2Total ?? 0,
                plantedAt: t.plantedAt,
                growthStage: t.growthStage ?? null,
                projectName: t.projectName,
                city: t.city,
                state: t.state,
                country: t.country
              }))
            : []
        )
      } catch {
      }
    }

    async function loadProducts() {
      try {
        const res = await fetch(`${API_URL}/products`)
        if (!res.ok) return
        const data = await res.json()
        setProducts(
          Array.isArray(data)
            ? data.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price ?? 0,
                carbonCashbackKg: p.carbonCashbackKg ?? 0,
                projectName: p.project?.name ?? null,
                projectCity: p.project?.city ?? null,
                projectState: p.project?.state ?? null,
                projectCountry: p.project?.country ?? null
              }))
            : []
        )
      } catch {
      }
    }

    async function loadSpecies() {
      try {
        const res = await fetch(`${API_URL}/species`)
        if (!res.ok) return
        const data = await res.json()
        setStoreSpecies(
          Array.isArray(data)
            ? data.map((s: any) => ({
                id: s.id,
                commonName: s.commonName,
                scientificName: s.scientificName ?? null,
                biome: s.biome ?? null,
                imageUrl: s.imageUrl ?? null
              }))
            : []
        )
      } catch {
      }
    }

    async function loadBenefits(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/dashboard/benefits`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.benefits)) {
          setBenefits(
            data.benefits.map((b: any) => ({
              id: b.id,
              title: b.title,
              description: b.description,
              minCredits: b.minCredits,
              discountPercent: b.discountPercent
            }))
          )
        }
      } catch {
      }
    }

    async function loadWallet(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/wallet/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        setWallet({
          greenBalance: data.greenBalance ?? 0,
          seedBalance: data.seedBalance ?? 0,
          createdAt: data.createdAt ?? "",
          updatedAt: data.updatedAt ?? ""
        })
      } catch {
      }
    }

    async function loadConversions(currentToken: string) {
      try {
        const res = await fetch(`${API_URL}/conversions`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data)) {
          setConversions(
            data.map((c: any) => ({
              id: c.id,
              greenSpent: c.greenSpent ?? c.green_spent ?? 0,
              seedGenerated: c.seedGenerated ?? c.seed_generated ?? 0,
              treeId: c.treeId ?? c.tree_id ?? null,
              blockchainTxId: c.blockchainTxId ?? c.blockchain_tx_id ?? null,
              status: c.status ?? "confirmed",
              createdAt: c.createdAt ?? c.created_at ?? ""
            }))
          )
        }
      } catch {
      }
    }

    loadSummary(token)
    loadProfile(token)
    loadUserTrees(token)
    loadProducts()
    loadSpecies()
    loadBenefits(token)
    loadWallet(token)
    loadConversions(token)
  }, [router])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("st_carbon_profile")
      if (saved) {
        setHasSavedCarbonProfile(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("st_carbon_calc")
      if (saved) {
        const parsed = JSON.parse(saved)
        setCarbonCalc((prev) => ({
          ...prev,
          ...parsed
        }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("st_carbon_calc", JSON.stringify(carbonCalc))
    } catch {}
  }, [carbonCalc])

  useEffect(() => {
    if (!calcProductId && products.length > 0) {
      setCalcProductId(products[0].id)
    }
  }, [products, calcProductId])

  function handleBuySuggested() {
    if (suggestedTrees <= 0) return
    if (!calcProductId) return
    setSelectedQuantities((prev) => ({
      ...prev,
      [calcProductId]: suggestedTrees
    }))
    setActiveSection("store")
  }

  function toggleDistSelected(id: string) {
    setDistSelected((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  function handleDistributeEven() {
    if (suggestedTrees <= 0) return
    const selectedIds = Object.entries(distSelected)
      .filter(([, v]) => v)
      .map(([k]) => k)
    const ids = selectedIds.length > 0 ? selectedIds : products.map((p) => p.id)
    if (ids.length === 0) return

    const base = Math.floor(suggestedTrees / ids.length)
    let remainder = suggestedTrees % ids.length
    const newQuantities: Record<string, number> = {}
    ids.forEach((id) => {
      newQuantities[id] = base + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
    })
    setSelectedQuantities((prev) => ({ ...prev, ...newQuantities }))
    setActiveSection("store")
  }

  function handleSaveCarbonProfile() {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("st_carbon_profile", JSON.stringify(carbonCalc))
      setHasSavedCarbonProfile(true)
    } catch {}
  }

  function handleApplyCarbonProfile() {
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

  async function handleConvertGreenToSeed() {
    if (converting) return
    setConversionMessage(null)

    if (typeof window === "undefined") return
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setConversionMessage("Você precisa estar logado para converter.")
      return
    }

    const value = parseInt(conversionAmount, 10)
    if (!value || value <= 0) {
      setConversionMessage("Informe uma quantidade válida de Green Tokens.")
      return
    }

    setConverting(true)
    try {
      const res = await fetch(`${API_URL}/conversions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ greenToSpend: value })
      })

      if (!res.ok) {
        setConversionMessage("Não foi possível converter seus Green Tokens agora.")
        return
      }

      const data = await res.json()
      setConversionMessage(
        `Conversão concluída: ${data.greenSpent} Green Tokens viraram ${data.seedGenerated} Semente Tokens.`
      )
      setConversionAmount("")

      try {
        const [walletRes, convRes] = await Promise.all([
          fetch(`${API_URL}/wallet/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/conversions`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ])

        if (walletRes.ok) {
          const w = await walletRes.json()
          setWallet({
            greenBalance: w.greenBalance ?? 0,
            seedBalance: w.seedBalance ?? 0,
            createdAt: w.createdAt ?? "",
            updatedAt: w.updatedAt ?? ""
          })
        }

        if (convRes.ok) {
          const list = await convRes.json()
          if (Array.isArray(list)) {
            setConversions(
              list.map((c: any) => ({
                id: c.id,
                greenSpent: c.greenSpent ?? c.green_spent ?? 0,
                seedGenerated: c.seedGenerated ?? c.seed_generated ?? 0,
                treeId: c.treeId ?? c.tree_id ?? null,
                blockchainTxId: c.blockchainTxId ?? c.blockchain_tx_id ?? null,
                status: c.status ?? "confirmed",
                createdAt: c.createdAt ?? c.created_at ?? ""
              }))
            )
          }
        }
      } catch {
      }
    } catch {
      setConversionMessage("Ocorreu um erro ao conversar com a carteira.")
    } finally {
      setConverting(false)
    }
  }

  async function connectMetamaskAndLoadSeme() {
    if (metamaskConnecting) return
    setMetamaskError(null)

    if (typeof window === "undefined") {
      setMetamaskError("MetaMask só funciona no navegador.")
      return
    }

    if (!SEME_ADDRESS) {
      setMetamaskError(
        "Endereço do token SEME não configurado. Fale com o administrador."
      )
      return
    }

    const anyWindow = window as any
    const ethereum = anyWindow.ethereum
    if (!ethereum) {
      setMetamaskError("MetaMask não encontrada. Instale a extensão para continuar.")
      return
    }

    setMetamaskConnecting(true)
    try {
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts"
      })
      if (!accounts || accounts.length === 0) {
        setMetamaskError("Nenhuma conta encontrada na MetaMask.")
        return
      }

      const account = accounts[0]
      setWalletAddress(account)

      const chainId: string = await ethereum.request({
        method: "eth_chainId"
      })
      setWalletChainId(chainId)

      if (chainId !== POLYGON_CHAIN_ID_HEX) {
        setMetamaskError(
          "Rede incorreta na MetaMask. Selecione Polygon Mainnet (chainId 137)."
        )
        setSemeBalance(null)
        return
      }

      const provider = new BrowserProvider(ethereum)
      const contract = new Contract(
        SEME_ADDRESS,
        ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"],
        provider
      )

      const [rawBalance, decimals] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals()
      ])

      const formatted = formatUnits(rawBalance, decimals)
      setSemeBalance(formatted)
      setMetamaskError(null)

      try {
        const txRes = await fetch(
          `${API_URL}/seme/transactions?walletAddress=${encodeURIComponent(
            account
          )}`
        )
        if (txRes.ok) {
          const list = await txRes.json()
          if (Array.isArray(list)) {
            setSemeTransactions(
              list.map((t: any) => ({
                id: t.id,
                walletAddress: t.walletAddress ?? t.wallet_address ?? account,
                amountSeme: String(t.amountSeme ?? t.amount_seme ?? "0"),
                treesEquivalent:
                  (t.treesEquivalent ?? t.trees_equivalent ?? parseInt(formatted, 10)) || 0,
                txHash: t.txHash ?? t.tx_hash ?? "",
                status: t.status ?? "confirmed",
                createdAt: t.createdAt ?? t.created_at ?? ""
              }))
            )
          }
        }
      } catch {
      }
    } catch (error: any) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Erro ao conectar à MetaMask."
      setMetamaskError(message)
    } finally {
      setMetamaskConnecting(false)
    }
  }

  async function approveSeme(amount: string) {
    setSemeActionMessage(null)
    if (typeof window === "undefined") {
      setSemeActionMessage("MetaMask só funciona no navegador.")
      return
    }

    if (!SEME_ADDRESS || !TREE_ADDRESS) {
      setSemeActionMessage(
        "Endereços do token SEME ou contrato TreePlanting não configurados."
      )
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setSemeActionMessage("Informe uma quantidade válida de SEME para aprovar.")
      return
    }

    const anyWindow = window as any
    const ethereum = anyWindow.ethereum
    if (!ethereum) {
      setSemeActionMessage("MetaMask não encontrada. Instale a extensão para continuar.")
      return
    }

    if (!walletAddress) {
      setSemeActionMessage("Conecte sua carteira MetaMask antes de aprovar.")
      return
    }

    if (!walletChainId || walletChainId !== POLYGON_CHAIN_ID_HEX) {
      setSemeActionMessage(
        "Rede incorreta na MetaMask. Use Polygon Mainnet (chainId 137)."
      )
      return
    }

    setSemeApproving(true)
    try {
      const provider = new BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()

      const tokenContract = new Contract(
        SEME_ADDRESS,
        [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address owner) view returns (uint256)"
        ],
        signer
      )

      const value = parseUnits(amount, 18)
      console.log("--- Approve Debug ---")
      console.log("Token Address:", SEME_ADDRESS)
      console.log("Approve Spender (TREE_ADDRESS):", TREE_ADDRESS)
      console.log("Approve Amount (Wei):", value.toString())
      console.log("Signer Address:", signerAddress)

      // Check balance before approving
      const balance = await tokenContract.balanceOf(signerAddress)
      console.log("Current Balance (Wei):", balance.toString())
      if (balance < value) {
        throw new Error(
          `Saldo insuficiente para aprovar. Você tem ${formatUnits(
            balance,
            18
          )} SEME, mas tentou aprovar ${amount} SEME.`
        )
      }

      const tx = await tokenContract.approve(TREE_ADDRESS, value)
      setSemeActionMessage("Transação de approve enviada. Aguardando confirmação...")
      console.log("Approve Tx Hash:", tx.hash)
      
      await tx.wait()
      console.log("Approve Confirmed")

      // Verify allowance after tx
      const newAllowance = await tokenContract.allowance(
        signerAddress,
        TREE_ADDRESS
      )
      console.log("New Allowance (Wei):", newAllowance.toString())

      setSemeActionMessage("Approve confirmado na blockchain. Agora você pode plantar.")
    } catch (error: any) {
      console.error("Approve Error:", error)
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Erro ao aprovar SEME para o contrato de plantio."
      setSemeActionMessage(message)
    } finally {
      setSemeApproving(false)
    }
  }

  async function plantTreeOnChain(amount: string) {
    setSemeActionMessage(null)
    if (typeof window === "undefined") {
      setSemeActionMessage("MetaMask só funciona no navegador.")
      return
    }

    if (!TREE_ADDRESS) {
      setSemeActionMessage("Endereço do contrato TreePlanting não configurado.")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setSemeActionMessage("Informe uma quantidade válida de SEME/árvores.")
      return
    }

    const anyWindow = window as any
    const ethereum = anyWindow.ethereum
    if (!ethereum) {
      setSemeActionMessage("MetaMask não encontrada. Instale a extensão para continuar.")
      return
    }

    if (!walletAddress) {
      setSemeActionMessage("Conecte sua carteira MetaMask antes de plantar.")
      return
    }

    if (!walletChainId || walletChainId !== POLYGON_CHAIN_ID_HEX) {
      setSemeActionMessage(
        "Rede incorreta na MetaMask. Use Polygon Mainnet (chainId 137)."
      )
      return
    }

    setSemePlanting(true)
    try {
      const provider = new BrowserProvider(ethereum)
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()

      const treeContract = new Contract(
        TREE_ADDRESS,
        ["function plantTree(uint256 amount)"],
        signer
      )

      const tokenContract = new Contract(
        SEME_ADDRESS,
        ["function allowance(address owner, address spender) view returns (uint256)", "function balanceOf(address) view returns (uint256)"],
        signer
      )

      const value = parseUnits(amount, 18)

      console.log("--- DEBUG CHECKLIST (User Request) ---")
      console.log("1. Amount Original:", amount)
      console.log("2. Parsed Amount (Wei):", value.toString())
      console.log("3. Tree Contract Address (Destino):", TREE_ADDRESS)
      console.log("4. Token Contract Address (Origem):", SEME_ADDRESS)
      console.log("5. Signer Address (Quem planta):", signerAddress)

      // Check Balance
      const balance = await tokenContract.balanceOf(signerAddress)
      console.log("6. Current Balance (Wei):", balance.toString())
      if (balance < value) {
         const msg = `Saldo insuficiente. Você tem ${formatUnits(balance, 18)} SEME, mas precisa de ${amount} SEME.`
         console.error(msg)
         throw new Error(msg)
      }

      // Check Allowance
      const currentAllowance = await tokenContract.allowance(signerAddress, TREE_ADDRESS)
      console.log("7. Current Allowance (Wei):", currentAllowance.toString())

      if (currentAllowance < value) {
        const msg = `Aprovação insuficiente. Atual: ${formatUnits(currentAllowance, 18)} SEME, Necessário: ${amount} SEME. Por favor, clique em "Aprovar SEME" primeiro e aguarde a confirmação.`
        console.error(msg)
        throw new Error(msg)
      }

      console.log("8. Fluxo: Balance OK -> Allowance OK -> Chamando plantTree...")
      
      // Tentativa direta sem estimateGas, pois o erro de gas estimation pode ser misleading
      // em algumas redes ou versões de nós RPC.
      // Adicionamos gasLimit manual como fallback seguro.
      try {
        const tx = await treeContract.plantTree(value, {
          gasLimit: 300000 // Limite de gás fixo e seguro para essa operação
        })
        console.log("PlantTree Tx Hash:", tx.hash)
        setSemeActionMessage("Transação de plantio enviada. Aguardando confirmação...")
        
        const receipt = await tx.wait()
        console.log("PlantTree Confirmed:", receipt)
        
        setSemeActionMessage(
          `Plantio confirmado na blockchain. Tx: ${tx.hash.slice(0, 10)}...`
        )
      } catch (txError: any) {
         console.error("Transação falhou ao enviar:", txError)
         throw txError
      }

      try {
        await connectMetamaskAndLoadSeme()
      } catch {
      }
    } catch (error: any) {
      console.error("PlantTree Error:", error)
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Erro ao realizar o plantio on-chain."
      setSemeActionMessage(message)
    } finally {
      setSemePlanting(false)
    }
  }

  useEffect(() => {
    async function loadBrigadeAndAlerts(currentRole: string | null) {
      if (currentRole !== "corporate") return
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null
      if (!token) return

      try {
        const [summaryRes, alertsRes, actionsRes] = await Promise.all([
          fetch(`${API_URL}/brigades/summary`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/brigades/fire-alerts`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/brigades/actions`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ])

        if (summaryRes.ok) {
          const data = await summaryRes.json()
          setBrigade(data)
        }

        if (alertsRes.ok) {
          const list = await alertsRes.json()
          if (Array.isArray(list)) {
            setFireAlerts(
              list.map((a: any) => ({
                id: a.id,
                latitude: a.latitude,
                longitude: a.longitude,
                description: a.description ?? null,
                createdAt: a.createdAt ?? a.created_at ?? "",
                projectId: a.projectId ?? a.project_id ?? null
              }))
            )
          }
        }

        if (actionsRes.ok) {
          const list = await actionsRes.json()
          if (Array.isArray(list)) {
            setBrigadeActions(
              list.map((a: any) => ({
                id: a.id,
                type: a.type,
                description: a.description ?? null,
                createdAt: a.createdAt ?? a.created_at ?? "",
                brigadistName: a.brigadistName ?? a.brigadist_name ?? null
              }))
            )
          }
        }
      } catch {
      }
    }

    loadBrigadeAndAlerts(role)
  }, [role])

  useEffect(() => {
    async function loadFeed() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null
      if (!token) return
      setFeedLoading(true)
      setFeedError(null)
      try {
        const res = await fetch(`${API_URL}/brigades/feed`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!res.ok) {
          setFeedError("Não foi possível carregar o feed agora.")
          return
        }
        const list = await res.json()
        if (Array.isArray(list)) {
          setFeedItems(
            list.map((item: any) => ({
              id: item.id,
              type: item.type,
              description: item.description ?? null,
              createdAt: item.createdAt ?? item.created_at ?? "",
              brigadistName: item.brigadistName ?? item.brigadist_name ?? null,
              brigadeName: item.brigadeName ?? item.brigade_name ?? null,
              ownerRole: item.ownerRole ?? item.owner_role ?? null,
              treeSpecies: item.treeSpecies ?? item.tree_species ?? null,
              mediaUrl: item.mediaUrl ?? item.media_url ?? null,
              mediaType: item.mediaType ?? item.media_type ?? null,
              mediaDurationSeconds:
                typeof item.mediaDurationSeconds === "number"
                  ? item.mediaDurationSeconds
                  : typeof item.media_duration_seconds === "number"
                  ? item.media_duration_seconds
                  : null,
              latitude:
                typeof item.latitude === "number" ||
                typeof item.latitude === "string"
                  ? Number(item.latitude)
                  : null,
              longitude:
                typeof item.longitude === "number" ||
                typeof item.longitude === "string"
                  ? Number(item.longitude)
                  : null
            }))
          )
        }
      } catch {
        setFeedError("Erro inesperado ao carregar o feed.")
      } finally {
        setFeedLoading(false)
      }
    }

    loadFeed()
  }, [])

  useEffect(() => {
    if (!selectedBrigadistId) return
    if (autoFireSuggestionsSeeded) return
    if (!fireAlerts.length) return

    const now = Date.now()
    const recentAlerts = fireAlerts.filter((a) => {
      if (!a.createdAt) return false
      const t = new Date(a.createdAt).getTime()
      if (!t || Number.isNaN(t)) return false
      const diffHours = (now - t) / (1000 * 60 * 60)
      return diffHours <= 48
    })

    const sourceList = recentAlerts.length > 0 ? recentAlerts : fireAlerts
    const generated = sourceList.slice(0, 3).map((alert, index) => {
      const dateLabel = alert.createdAt
        ? new Date(alert.createdAt).toLocaleDateString("pt-BR")
        : "recente"
      const title = `Patrulhar área do alerta de fogo (${dateLabel})`
      const descriptionParts: string[] = []
      if (alert.description) {
        descriptionParts.push(alert.description)
      }
      descriptionParts.push(
        `Verificar risco na região e registrar inspeção se necessário. Coordenadas aproximadas: ${alert.latitude.toFixed(
          4
        )}, ${alert.longitude.toFixed(4)}.`
      )
      return {
        title,
        description: descriptionParts.join(" "),
        selected: true
      }
    })

    if (!generated.length) return

    setAiSuggestions((prev) => (prev.length ? prev : generated))
    setAutoFireSuggestionsSeeded(true)
  }, [selectedBrigadistId, fireAlerts, autoFireSuggestionsSeeded])

  function updateQuantity(productId: string, value: number) {
    const quantity = isNaN(value) || value < 0 ? 0 : Math.floor(value)
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: quantity
    }))
  }

  async function handleCreateOrder() {
    if (ordering) return
    setOrderMessage(null)

    if (typeof window === "undefined") return
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setOrderMessage("Você precisa estar logado para comprar.")
      return
    }

    const items = Object.entries(selectedQuantities)
      .filter(([, qty]) => qty && qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    if (!items.length) {
      setOrderMessage("Selecione pelo menos 1 unidade de algum produto.")
      return
    }

    setOrdering(true)
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      })

      if (!res.ok) {
        setOrderMessage("Não foi possível finalizar sua compra agora.")
        return
      }

      const data = await res.json()
      setOrderMessage(
        `Compra confirmada! Você ganhou ${(
          data.totalCarbonCashbackKg / 1000
        ).toFixed(2)} t de CO₂ em cashback.`
      )
      setSelectedQuantities({})
    } catch {
      setOrderMessage("Ocorreu um erro ao criar o pedido.")
    } finally {
      setOrdering(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input }
    ]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const locationParts = guardianTree
        ? [guardianTree.city, guardianTree.state, guardianTree.country].filter(
            Boolean
          )
        : []
      const locationDescription =
        guardianTree && locationParts.length
          ? locationParts.join(", ")
          : "Floresta digital SementeToken"

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          treeId: guardianTree ? guardianTree.id : "tree-1",
          message: input,
          species: guardianTree ? guardianTree.species : "Árvore guardiã",
          locationDescription,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      const sentimentRaw = (data.sentiment as string | undefined) || ""
      const normalized = sentimentRaw.toLowerCase()
      let mood: "neutral" | "positive" | "negative" = "neutral"
      if (
        normalized.includes("pos") ||
        normalized.includes("feliz") ||
        normalized.includes("alegre")
      ) {
        mood = "positive"
      } else if (
        normalized.includes("neg") ||
        normalized.includes("triste") ||
        normalized.includes("raiva")
      ) {
        mood = "negative"
      }
      setTreeMood(mood)

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.response as string }
      ])
    } catch (e) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Tive um probleminha para falar agora, mas continuo aqui crescendo em silêncio. 🌿"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAction() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) return

    if (!newAction.description) {
      alert("Por favor, descreva a ação.")
      return
    }

    let uploadedMedia: {
      mediaUrl: string
      mediaType: string
      mediaDurationSeconds: number | null
    } | null = null

    if (newAction.mediaFile) {
      try {
        const formData = new FormData()
        formData.append("file", newAction.mediaFile)
        if (newAction.mediaDurationSeconds) {
          formData.append(
            "durationSeconds",
            String(newAction.mediaDurationSeconds)
          )
        }

        const uploadRes = await fetch(`${API_URL}/brigades/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        })

        if (!uploadRes.ok) {
          throw new Error("Erro ao fazer upload da mídia.")
        }

        uploadedMedia = await uploadRes.json()
      } catch (e) {
        alert("Erro no upload da mídia.")
        return
      }
    }

    try {
      const res = await fetch(`${API_URL}/brigades/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newAction.type,
          description: newAction.description,
          latitude: newAction.latitude ? parseFloat(newAction.latitude) : null,
          longitude: newAction.longitude
            ? parseFloat(newAction.longitude)
            : null,
          mediaUrl: uploadedMedia?.mediaUrl || null,
          mediaType: uploadedMedia?.mediaType || null,
          mediaDurationSeconds: uploadedMedia?.mediaDurationSeconds || null
        })
      })

      if (!res.ok) {
        throw new Error("Erro ao criar ação")
      }

      const createdAction = await res.json()

      setFeedItems((prev) => [
        {
          id: createdAction.id,
          type: createdAction.type,
          description: createdAction.description,
          createdAt: createdAction.createdAt || new Date().toISOString(),
          brigadistName: "Você",
          brigadeName: brigade?.brigade?.name || null,
          ownerRole: role || null,
          treeSpecies: null,
          mediaUrl: createdAction.mediaUrl,
          mediaType: createdAction.mediaType,
          mediaDurationSeconds: createdAction.mediaDurationSeconds,
          latitude: createdAction.latitude,
          longitude: createdAction.longitude
        },
        ...prev
      ])

      setNewAction({
        type: "planting",
        description: "",
        treeId: "",
        latitude: "",
        longitude: "",
        mediaFile: null,
        mediaPreviewUrl: "",
        mediaDurationSeconds: 0
      })

      alert("Ação publicada com sucesso!")
    } catch (err) {
      console.error(err)
      alert("Erro ao publicar ação.")
    }
  }

  async function sendForestMessage() {
    if (!forestInput.trim() || forestLoading) return

    const messageToSend = forestInput
    const nextMessages: ChatMessage[] = [
      ...forestMessages,
      { role: "user", content: messageToSend }
    ]
    setForestMessages(nextMessages)
    setForestInput("")
    setForestLoading(true)

    try {
      const parts: string[] = []
      if (stats.totalTrees > 0) {
        parts.push(
          `Você tem ${stats.totalTrees} árvore${
            stats.totalTrees === 1 ? "" : "s"
          } registradas na plataforma.`
        )
      }
      if (seedlingTreesCount || youngTreesCount || adultTreesCount) {
        parts.push(
          `Distribuição por estágio: ${seedlingTreesCount} muda${
            seedlingTreesCount === 1 ? "" : "s"
          }, ${youngTreesCount} jovem${
            youngTreesCount === 1 ? "" : "s"
          } e ${adultTreesCount} adulta${
            adultTreesCount === 1 ? "" : "s"
          }.`
        )
      }
      if (stats.totalCo2 > 0) {
        parts.push(
          `CO₂ estimado total das suas árvores e cashback: ${(stats.totalCo2 / 1000).toFixed(
            2
          )} toneladas.`
        )
      }
      if (wallet) {
        parts.push(
          `Saldos atuais aproximados: ${wallet.greenBalance} Green Tokens e ${wallet.seedBalance} Semente Tokens.`
        )
      }
      if (benefits.length > 0) {
        parts.push(
          `Você tem acesso a ${benefits.length} benefício${
            benefits.length === 1 ? "" : "s"
          } verde${
            benefits.length === 1 ? "" : "s"
          } com descontos e vantagens.`
        )
      }
      if (brigade) {
        parts.push(
          `Sua brigada ${brigade.brigade.name} cuida de ${brigade.stats.totalTrees} árvore${
            brigade.stats.totalTrees === 1 ? "" : "s"
          } e já registrou ${brigade.stats.actionsCount} ação${
            brigade.stats.actionsCount === 1 ? "" : "s"
          } de campo.`
        )
      }

      if (brigade && selectedBrigadistId) {
        const selectedTasks = brigadistTasks.slice(0, 5)
        if (selectedTasks.length > 0) {
          const tasksSummary = selectedTasks
            .map((t, index) => {
              const statusLabel =
                t.status === "done"
                  ? "concluída"
                  : t.status === "in_progress"
                  ? "em andamento"
                  : "pendente"
              return `${index + 1}. ${t.title} (${statusLabel})`
            })
            .join(" ")
          parts.push(
            `Contexto de brigadista: estou focado agora em um brigadista da brigada, com as seguintes tarefas principais: ${tasksSummary}.`
          )
        } else {
          parts.push(
            "Contexto de brigadista: estou focado em um brigadista da brigada que ainda não tem tarefas cadastradas."
          )
        }
      }

      const accountContext = parts.join(" ")
      const composedMessage = accountContext
        ? `${accountContext}\n\nPergunta do usuário: ${messageToSend}`
        : messageToSend

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          treeId: "forest-brain",
          message: composedMessage,
          species:
            "Floresta SementeToken, inteligência coletiva formada por todas as árvores, projetos e brigadas da plataforma",
          locationDescription:
            "Floresta digital SementeToken, conectando projetos em diferentes biomas do Brasil",
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      const sentimentRaw = (data.sentiment as string | undefined) || ""
      const normalized = sentimentRaw.toLowerCase()
      let mood: "neutral" | "positive" | "negative" = "neutral"
      if (
        normalized.includes("pos") ||
        normalized.includes("feliz") ||
        normalized.includes("alegre")
      ) {
        mood = "positive"
      } else if (
        normalized.includes("neg") ||
        normalized.includes("triste") ||
        normalized.includes("raiva")
      ) {
        mood = "negative"
      }
      setTreeMood(mood)

      setForestMessages([
        ...nextMessages,
        { role: "assistant", content: data.response as string }
      ])
    } catch {
      setForestMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "A floresta não conseguiu responder agora, mas continua te observando e cuidando das suas árvores."
        }
      ])
    } finally {
      setForestLoading(false)
    }
  }

  function openProductAgent(product: Product) {
    setMarketChatProduct(product)
    const relatedSpecies =
      storeSpecies.find(
        (s) =>
          s.commonName.toLowerCase() === product.name.toLowerCase()
      ) || null
    const commonDisplayName = relatedSpecies?.commonName || product.name
    const speciesName =
      relatedSpecies?.scientificName ||
      relatedSpecies?.commonName ||
      product.name
    const locationParts = [
      product.projectCity,
      product.projectState,
      product.projectCountry
    ].filter(Boolean)
    const locationLabel = locationParts.length
      ? locationParts.join(", ")
      : "nos projetos de floresta da SementeToken"
    const biome = relatedSpecies?.biome || ""

    const introText = buildTreeIntroText({
      speciesName,
      commonDisplayName,
      biome,
      projectName: product.projectName,
      locationLabel,
      context: "product"
    })
    setMarketChatMessages([
      {
        role: "assistant",
        content: introText
      }
    ])
    setMarketChatInput("")
  }

  async function sendMarketMessage() {
    if (!marketChatProduct) return
    if (!marketChatInput.trim() || marketChatLoading) return

    const messageToSend = marketChatInput
    const nextMessages: ChatMessage[] = [
      ...marketChatMessages,
      { role: "user", content: messageToSend }
    ]
    setMarketChatMessages(nextMessages)
    setMarketChatInput("")
    setMarketChatLoading(true)

    try {
      const relatedSpecies =
        storeSpecies.find(
          (s) =>
            s.commonName.toLowerCase() ===
            marketChatProduct.name.toLowerCase()
        ) || null
      const speciesName =
        relatedSpecies?.scientificName ||
        relatedSpecies?.commonName ||
        marketChatProduct.name
      const locationParts = [
        marketChatProduct.projectCity,
        marketChatProduct.projectState,
        marketChatProduct.projectCountry
      ].filter(Boolean)
      const locationDescription =
        [
          marketChatProduct.projectName
            ? `Projeto ${marketChatProduct.projectName}`
            : null,
          locationParts.length ? locationParts.join(", ") : null
        ]
          .filter(Boolean)
          .join(" • ") || "Projeto de floresta da SementeToken"

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          treeId: `product-${marketChatProduct.id}`,
          message: messageToSend,
          species: speciesName,
          locationDescription,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      setMarketChatMessages([
        ...nextMessages,
        { role: "assistant", content: data.response as string }
      ])
    } catch {
      setMarketChatMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Não consegui responder agora, mas continuo aqui aguardando você na floresta."
        }
      ])
    } finally {
      setMarketChatLoading(false)
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("userRole")
    }
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="hidden md:flex flex-col w-60 bg-slate-950 border-r border-emerald-900 px-6 py-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
            SementeToken
          </p>
          <p className="mt-1 font-semibold text-sm text-emerald-50">
            Painel do usuário
          </p>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          <button
            className={
              activeSection === "overview"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("overview")}
          >
            Visão geral
          </button>
          <button
            className={
              activeSection === "wallet"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("wallet")}
          >
            Minha carteira
          </button>
          <button
            className={
              activeSection === "trees"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("trees")}
          >
            Minhas árvores
          </button>
          <button
            className={
              activeSection === "chat"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("chat")}
          >
            Chat com a árvore
          </button>
          <button
            className={
              activeSection === "ranking"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("ranking")}
          >
            Ranking
          </button>
          <button
            className={
              activeSection === "store"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("store")}
          >
            Loja verde
          </button>
          <button
            className={
              activeSection === "feed"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("feed")}
          >
            Feed da floresta
          </button>
          {(role === "corporate" || role === "admin") && (
            <button
              className={
                activeSection === "brigade"
                  ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                  : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
              }
              onClick={() => setActiveSection("brigade")}
            >
              Brigada ambiental
            </button>
          )}
          {role === "admin" && (
            <button
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50 text-emerald-50"
              onClick={() => router.push("/admin")}
            >
              Painel admin
            </button>
          )}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-emerald-900 hover:bg-red-600 hover:text-white transition-colors"
        >
          <span>Sair</span>
          <span>↪</span>
        </button>
      </aside>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                Minha floresta digital
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">
                Olá, guardião da floresta.
              </h1>
              <p className="text-sm md:text-base text-emerald-50/80 max-w-xl">
                Aqui você acompanha o impacto das suas árvores, conversa com a
                IA da floresta e se conecta com os projetos que está ajudando a
                manter vivos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {role && (
                <div className="bg-emerald-900/60 border border-emerald-700 px-4 py-2 rounded-full text-xs flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  <span>
                    Perfil:{" "}
                    {role === "admin"
                      ? "Administrador"
                      : role === "corporate"
                      ? "Empresa"
                      : "Usuário"}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="md:hidden text-xs px-3 py-2 rounded-full border border-emerald-700 text-emerald-50 hover:bg-emerald-900/60"
              >
                Sair
              </button>
            </div>
          </header>

          {activeSection === "overview" && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-900">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                      Árvores sob seus cuidados
                    </h3>
                    {userTrees.length > 0 && (
                      <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] text-emerald-200">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                          {seedlingTreesCount} muda
                          {seedlingTreesCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {youngTreesCount} jovem
                          {youngTreesCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {adultTreesCount} adulta
                          {adultTreesCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-3xl font-bold text-emerald-300">
                    {stats.totalTrees}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Contamos todas as árvores cadastradas no sistema até agora.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-sky-900">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sky-200 text-xs font-semibold tracking-wide">
                      CO₂ compensado estimado
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/50 text-[10px] text-sky-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                      Score ESG
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-sky-300">
                    {(stats.totalCo2 / 1000).toFixed(2)} t
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Inclui árvores registradas e cashback de carbono da loja verde.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-purple-900">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-purple-200 text-xs font-semibold tracking-wide">
                      NFTs verdes
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/50 text-[10px] text-purple-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                      Web3 clima
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-purple-300">
                    {stats.nfts}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Em breve, seus tokens na Blockchain Waves aparecerão aqui.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-800">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                      Créditos verdes
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/50 text-[10px] text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Desconto na loja
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-emerald-300">
                    {stats.greenCredits}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Calculado a partir do CO₂ das suas árvores e compras verdes.
                  </p>
                </div>
              </section>
              <section className="mt-6 bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-100">
                      Calculadora de carbono
                    </h2>
                    <p className="text-xs text-emerald-200/80 max-w-xl">
                      Estime suas emissões anuais e veja quantas árvores seriam
                      necessárias para compensar usando a floresta SementeToken.
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-emerald-200/80">
                    <p>
                      1 árvore ≈ 0,15 t de CO₂ compensadas ao longo da vida.
                    </p>
                    <p>
                      Valores aproximados com base em médias de emissão.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-[11px]">
                    <div className="flex flex-wrap gap-2">
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
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="text-emerald-200/70">Meu perfil:</span>
                      <button
                        type="button"
                        onClick={handleSaveCarbonProfile}
                        className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-100 hover:bg-emerald-900/60"
                      >
                        Salvar perfil atual
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCarbonProfile}
                        disabled={!hasSavedCarbonProfile}
                        className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-100 hover:bg-emerald-900/60 disabled:opacity-40"
                      >
                        Usar perfil salvo
                      </button>
                      {hasSavedCarbonProfile && (
                        <span className="text-emerald-300/80">
                          perfil salvo disponível
                        </span>
                      )}
                    </div>
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
                  <div className="bg-slate-950/70 border border-emerald-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-2 text-[11px] text-emerald-200/80">
                      <p className="font-semibold text-emerald-100 text-sm">
                        Resultado estimado
                      </p>
                      <p>
                        Emissões anuais aproximadas:
                        <span className="ml-1 font-semibold text-emerald-300 text-base">
                          {annualTotalTons.toFixed(2)} t CO₂/ano
                        </span>
                      </p>
                      <p>
                        Número sugerido de árvores para compensar:
                        <span className="ml-1 font-semibold text-emerald-300 text-base">
                          {suggestedTrees}
                        </span>
                      </p>
                      {suggestedTrees > 0 && (
                        <p className="mt-1">
                          Isso equivale a aproximadamente{" "}
                          <span className="font-semibold">
                            {(suggestedTrees * treeCo2CapacityTons).toFixed(2)} t
                          </span>{" "}
                          de CO₂ compensadas ao longo da vida das árvores.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-[11px] text-emerald-200/80">
                      <p className="font-semibold text-emerald-100 text-sm">
                        De onde vem suas emissões
                      </p>
                      {annualTotalTons > 0 ? (
                        <div className="space-y-2">
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
                                <div className="flex justify-between mb-1">
                                  <span>{item.label}</span>
                                  <span>
                                    {item.value.toFixed(2)} t • {pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-300"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-emerald-200/70">
                          Preencha os campos para ver qual fonte pesa mais na sua
                          pegada de carbono.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-[11px] text-emerald-200/80">
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
                          Preencha os campos para gerar um resumo que pode ser
                          usado em relatórios e apresentações.
                        </p>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 text-[11px]">
                      <div className="space-y-1">
                        <p className="text-emerald-200/80">
                          Escolher produto/projeto para comprar
                        </p>
                        <select
                          className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          value={calcProductId ?? ""}
                          onChange={(e) => setCalcProductId(e.target.value || null)}
                        >
                          {products.length === 0 && (
                            <option value="">Sem produtos disponíveis</option>
                          )}
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.projectName ? ` • Projeto ${p.projectName}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={handleBuySuggested}
                          disabled={suggestedTrees === 0 || !calcProductId}
                          className="text-xs px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
                        >
                          {suggestedTrees > 0
                            ? `Comprar ${suggestedTrees} árvores sugeridas`
                            : "Informe dados para sugerir árvores"}
                        </button>
                        <p className="text-emerald-200/80">
                          Use a sugestão como ponto de partida.
                        </p>
                      </div>
                      <div className="pt-2 space-y-2">
                        <p className="text-emerald-200/80">
                          Distribuir árvores sugeridas entre múltiplos projetos
                        </p>
                        <div className="max-h-28 overflow-y-auto border border-emerald-800/60 rounded-lg p-2">
                          {products.length === 0 ? (
                            <p className="text-emerald-200/60">
                              Nenhum produto disponível.
                            </p>
                          ) : (
                            <ul className="space-y-1">
                              {products.map((p) => (
                                <li key={p.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="accent-emerald-500"
                                    checked={!!distSelected[p.id]}
                                    onChange={() => toggleDistSelected(p.id)}
                                  />
                                  <span className="text-emerald-100">
                                    {p.name}
                                    {p.projectName ? ` • Projeto ${p.projectName}` : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={handleDistributeEven}
                            disabled={suggestedTrees === 0 || products.length === 0}
                            className="text-xs px-4 py-2 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                          >
                            Distribuir igualmente e ir para a Loja
                          </button>
                          <p className="text-emerald-200/70">
                            Sem seleção: distribui entre todos os projetos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === "wallet" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Minha carteira
                  </h2>
                  <p className="text-xs text-emerald-200/80 max-w-xl">
                    Acompanhe seus Green Tokens internos e Semente Tokens na rede
                    Polygon vinculados às suas árvores.
                  </p>
                  {wallet && (wallet.createdAt || wallet.updatedAt) && (
                    <p className="mt-1 text-[11px] text-emerald-200/70">
                      {wallet.updatedAt
                        ? `Última atualização: ${new Date(
                            wallet.updatedAt
                          ).toLocaleString("pt-BR")}`
                        : wallet.createdAt
                        ? `Carteira criada em ${new Date(
                            wallet.createdAt
                          ).toLocaleDateString("pt-BR")}`
                        : null}
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Regra atual:{" "}
                  <span className="font-semibold text-emerald-300">
                    100 Green Tokens = 1 Semente Token
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-emerald-800 rounded-2xl p-4">
                  <p className="text-[11px] text-emerald-200/80 mb-1">
                    Saldo de Green Tokens
                  </p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {wallet ? wallet.greenBalance : 0}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-200/70">
                    Moeda interna obtida com compras, calculadora e ações verdes.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-purple-800 rounded-2xl p-4">
                  <p className="text-[11px] text-emerald-200/80 mb-1">
                    Saldo de Semente Tokens
                  </p>
                  <p className="text-3xl font-bold text-purple-300">
                    {wallet ? wallet.seedBalance : 0}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-200/70">
                    Tokens on-chain 1:1 com árvores reais na Polygon.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-emerald-700 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] text-emerald-200/80">
                    Converter Green Tokens em Semente Tokens
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-28 border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                      value={conversionAmount}
                      onChange={(e) => setConversionAmount(e.target.value)}
                      placeholder="Ex: 100"
                    />
                    <button
                      onClick={handleConvertGreenToSeed}
                      disabled={converting}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {converting ? "Convertendo..." : "Converter em árvore"}
                    </button>
                  </div>
                  {conversionMessage && (
                    <p className="text-[11px] text-emerald-200/80">
                      {conversionMessage}
                    </p>
                  )}
                  {!conversionMessage && (
                    <p className="text-[11px] text-emerald-200/70">
                      Informe quantos Green Tokens deseja usar. O sistema calcula
                      automaticamente quantos Semente Tokens serão gerados.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-emerald-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-emerald-200/80 mb-1">
                        Carteira Polygon (MetaMask)
                      </p>
                      <p className="text-[11px] text-emerald-200/70">
                        Conecte sua carteira para ver seu saldo de SEME on-chain.
                      </p>
                    </div>
                    <button
                      onClick={connectMetamaskAndLoadSeme}
                      disabled={metamaskConnecting}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {walletAddress
                        ? metamaskConnecting
                          ? "Atualizando..."
                          : "Atualizar saldo"
                        : metamaskConnecting
                        ? "Conectando..."
                        : "Conectar MetaMask"}
                    </button>
                  </div>
                  {walletAddress && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] text-emerald-200/80 break-all">
                        Endereço: {walletAddress}
                      </p>
                      <p className="text-[11px] text-emerald-200/80">
                        Rede:{" "}
                        {walletChainId === "0x89"
                          ? "Polygon Mainnet"
                          : walletChainId || "desconhecida"}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] text-emerald-200/80 mb-1">
                        Saldo SEME (on-chain)
                      </p>
                      <p className="text-xl font-semibold text-emerald-300">
                        {semeBalance ?? (walletAddress ? "0" : "-")}
                      </p>
                    </div>
                    {walletAddress && (
                      <a
                        href={`https://polygonscan.com/address/${walletAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/10"
                      >
                        Ver na MetaMask
                      </a>
                    )}
                  </div>
                  {metamaskError && (
                    <p className="mt-2 text-[10px] text-red-300">{metamaskError}</p>
                  )}
                </div>
                <div className="bg-slate-950/60 border border-purple-800 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] text-emerald-200/80 mb-1">
                    Plantar árvores com SEME V2 (on-chain)
                  </p>
                  <p className="text-[11px] text-emerald-200/70">
                    Regra atual:{" "}
                    <span className="font-semibold text-emerald-300">
                      1 SEME = 1 árvore
                    </span>
                    . Primeiro aprove o uso de SEME pelo contrato TreePlanting,
                    depois envie a transação de plantio.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-24 border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                      value={semeAmount}
                      onChange={(e) => setSemeAmount(e.target.value)}
                      placeholder="Qtd. árvores"
                    />
                    <button
                      onClick={() => approveSeme(semeAmount)}
                      disabled={semeApproving || !walletAddress}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {semeApproving ? "Aprovando..." : "Aprovar SEME"}
                    </button>
                    <button
                      onClick={() => plantTreeOnChain(semeAmount)}
                      disabled={semePlanting || !walletAddress}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-purple-500 text-emerald-950 hover:bg-purple-400 disabled:opacity-60"
                    >
                      {semePlanting ? "Plantando..." : "Plantar árvores"}
                    </button>
                  </div>
                  {semeActionMessage && (
                    <p className="mt-2 text-[10px] text-emerald-200/80">
                      {semeActionMessage}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-100 mb-2 flex items-center gap-2">
                    <span>Histórico de plantios on-chain (SEME V2)</span>
                    {semeTransactions.length > 0 && (
                      <span className="text-[10px] font-normal text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        {semeTransactions.length} registro
                        {semeTransactions.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
                  {semeTransactions.length === 0 ? (
                    <p className="text-[11px] text-emerald-200/70">
                      Assim que você plantar árvores on-chain com SEME V2, os
                      registros aparecerão aqui com quantidade de SEME usada e
                      link para a transação na Polygon.
                    </p>
                  ) : (
                    <div className="border border-emerald-900 rounded-2xl overflow-hidden bg-slate-950/60">
                      <table className="w-full text-[11px] text-emerald-100">
                        <thead className="bg-slate-900/80">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">
                              Data
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              SEME usado
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Árvores
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Status
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Tx Polygon
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {semeTransactions.map((t) => (
                            <tr
                              key={t.id}
                              className="border-t border-emerald-900/60 hover:bg-slate-900/60"
                            >
                              <td className="px-3 py-2">
                                {t.createdAt
                                  ? new Date(t.createdAt).toLocaleString("pt-BR")
                                  : "-"}
                              </td>
                              <td className="px-3 py-2">{t.amountSeme}</td>
                              <td className="px-3 py-2">{t.treesEquivalent}</td>
                              <td className="px-3 py-2 capitalize">
                                {t.status}
                              </td>
                              <td className="px-3 py-2">
                                {t.txHash ? (
                                  <a
                                    href={`https://polygonscan.com/tx/${t.txHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-300 hover:text-emerald-100"
                                  >
                                    {`${t.txHash.slice(0, 10)}...`}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                <h3 className="text-sm font-semibold text-emerald-100 mb-2 flex items-center gap-2">
                  <span>Histórico de conversões</span>
                  {conversions.length > 0 && (
                    <span className="text-[10px] font-normal text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      {conversions.length} registro
                      {conversions.length > 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
                {conversions.length === 0 ? (
                  <p className="text-[11px] text-emerald-200/70">
                    Assim que você converter Green Tokens em Semente Tokens, as
                    conversões aparecerão aqui com status e identificação on-chain.
                  </p>
                ) : (
                  <div className="border border-emerald-900 rounded-2xl overflow-hidden bg-slate-950/60">
                    <table className="w-full text-[11px] text-emerald-100">
                      <thead className="bg-slate-900/80">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Data
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Green gasto
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Semente gerado
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Tx Polygon
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversions.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-emerald-900/60 hover:bg-slate-900/60"
                          >
                            <td className="px-3 py-2">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleString("pt-BR")
                                : "-"}
                            </td>
                            <td className="px-3 py-2">{c.greenSpent}</td>
                            <td className="px-3 py-2">{c.seedGenerated}</td>
                            <td className="px-3 py-2 capitalize">
                              {c.status}
                            </td>
                            <td className="px-3 py-2">
                              {c.blockchainTxId
                                ? `${c.blockchainTxId.slice(0, 10)}...`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {activeSection === "trees" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-1 text-emerald-100">
                    Minhas árvores
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Visualize suas árvores digitais, projetos e CO₂ estimado de
                    cada guardiã.
                  </p>
                </div>
                {userTrees.length > 0 && (
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-emerald-200/80">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                      Muda / recém-plantada
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Jovem
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Adulta
                    </span>
                  </div>
                )}
              </div>
              {userTrees.length === 0 ? (
                <p className="text-xs text-emerald-200/80">
                  Assim que você adquirir árvores no marketplace, elas
                  aparecerão aqui com detalhes do projeto e CO₂ estimado.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userTrees.map((tree) => {
                    const locationParts = [
                      tree.city,
                      tree.state,
                      tree.country
                    ].filter(Boolean)
                    const location = locationParts.join(", ")
                    const plantedLabel = tree.plantedAt
                      ? new Date(tree.plantedAt).toLocaleDateString("pt-BR")
                      : null
                    const co2Tons = tree.estimatedCo2Total / 1000
                    const co2Percent = Math.max(
                      10,
                      Math.min(100, (co2Tons / 10) * 100)
                    )

                    const growthLabel = (tree.growthStage || "").toLowerCase()
                    const isSeedling =
                      growthLabel.includes("muda") ||
                      growthLabel.includes("recém") ||
                      growthLabel.includes("recem")
                    const isYoung = growthLabel.includes("jovem")
                    const isAdult =
                      growthLabel.includes("adulta") ||
                      growthLabel.includes("madura")

                    let statusColor = "bg-emerald-400"
                    let statusBorder = "border-emerald-500/40"
                    let statusBg = "bg-emerald-500/10"
                    let statusText = "text-emerald-300"
                    let statusLabel = "Saudável"

                    if (isSeedling) {
                      statusColor = "bg-amber-300"
                      statusBorder = "border-amber-400/50"
                      statusBg = "bg-amber-400/10"
                      statusText = "text-amber-200"
                      statusLabel = "Muda / recém-plantada"
                    } else if (isYoung) {
                      statusColor = "bg-emerald-400"
                      statusBorder = "border-emerald-500/40"
                      statusBg = "bg-emerald-500/10"
                      statusText = "text-emerald-300"
                      statusLabel = "Jovem saudável"
                    } else if (isAdult) {
                      statusColor = "bg-emerald-500"
                      statusBorder = "border-emerald-500/60"
                      statusBg = "bg-emerald-500/15"
                      statusText = "text-emerald-200"
                      statusLabel = "Adulta saudável"
                    }

                    return (
                      <div
                        key={tree.id}
                        className="border border-emerald-900 rounded-2xl p-4 bg-slate-950/70 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-emerald-100">
                              {tree.species}
                            </p>
                            <p className="text-[11px] text-emerald-200/80">
                              {tree.projectName && `Projeto ${tree.projectName}`}{" "}
                              {location && `• ${location}`}
                            </p>
                          </div>
                          <span
                            className={
                              "inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border " +
                              statusBg +
                              " " +
                              statusText +
                              " " +
                              statusBorder
                            }
                          >
                            <span
                              className={"w-1.5 h-1.5 rounded-full " + statusColor}
                            />
                            {statusLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-200/80">
                          {plantedLabel && (
                            <span className="mr-1">Plantada em {plantedLabel}</span>
                          )}
                        </div>
                        <div className="mt-1">
                          <p className="text-[11px] text-emerald-200/80 mb-1">
                            CO₂ estimado da guardiã
                          </p>
                          <div className="h-2 rounded-full bg-emerald-900/60 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-400"
                              style={{ width: `${co2Percent}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-emerald-300 font-medium">
                            {co2Tons.toFixed(2)} t CO₂
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {activeSection === "chat" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Chat da floresta 🌳🧠
                  </h2>
                  <div className="mt-1 inline-flex rounded-full bg-slate-950/60 p-1 border border-emerald-800/60 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setChatMode("guardian")}
                      className={
                        (chatMode === "guardian"
                          ? "bg-emerald-500 text-emerald-950 "
                          : "text-emerald-200 ") + "px-3 py-1 rounded-full"
                      }
                    >
                      Árvore guardiã
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode("forest")}
                      className={
                        (chatMode === "forest"
                          ? "bg-emerald-500 text-emerald-950 "
                          : "text-emerald-200 ") + "px-3 py-1 rounded-full"
                      }
                    >
                      Floresta inteira
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-emerald-200/80">
                    {chatMode === "guardian"
                      ? "Converse com o espírito digital da sua árvore guardiã."
                      : "Converse com a inteligência coletiva da floresta SementeToken, que enxerga todas as suas árvores, projetos, brigadas e créditos verdes."}
                  </p>
                  {chatMode === "forest" && selectedBrigadistId && (
                    <div className="mt-2 inline-flex flex-wrap gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const texto =
                            "Planeje o dia do brigadista selecionado considerando as tarefas pendentes e as prioridades de plantio, inspeção e focos de incêndio. Estruture em passos objetivos com justificativa curta."
                          setForestInput(texto)
                          setTimeout(() => {
                            ;(document.activeElement as HTMLElement)?.blur?.()
                          }, 0)
                        }}
                        className="px-3 py-1 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                      >
                        Planejar dia do brigadista
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const texto =
                            "Analise as tarefas do brigadista selecionado e priorize as 3 próximas ações com base em urgência, impacto ambiental e logística. Explique brevemente."
                          setForestInput(texto)
                          setTimeout(() => {
                            ;(document.activeElement as HTMLElement)?.blur?.()
                          }, 0)
                        }}
                        className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-50 hover:bg-emerald-900/60"
                      >
                        Priorizar próximas ações
                      </button>
                    </div>
                  )}
                  {chatMode === "guardian" && guardianTree && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <p className="text-emerald-300">
                        Guardiã atual: {guardianTree.species}
                        {guardianTree.projectName
                          ? ` • Projeto ${guardianTree.projectName}`
                          : ""}{" "}
                        {guardianTree.city ||
                        guardianTree.state ||
                        guardianTree.country
                          ? "• " +
                            [guardianTree.city, guardianTree.state, guardianTree.country]
                              .filter(Boolean)
                              .join(", ")
                          : ""}
                      </p>
                      {guardianTree.growthStage && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {guardianTree.growthStage}
                        </span>
                      )}
                    </div>
                  )}
                  {chatMode === "forest" && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-emerald-200/80">
                      <span>
                        Você tem {stats.totalTrees} árvore
                        {stats.totalTrees === 1 ? "" : "s"} cadastradas, com
                        aproximadamente {(stats.totalCo2 / 1000).toFixed(2)} t CO₂
                        estimadas.
                      </span>
                      {(seedlingTreesCount ||
                        youngTreesCount ||
                        adultTreesCount) && (
                        <span>
                          Estágios: {seedlingTreesCount} muda
                          {seedlingTreesCount === 1 ? "" : "s"},{" "}
                          {youngTreesCount} jovem
                          {youngTreesCount === 1 ? "" : "s"} e {adultTreesCount}{" "}
                          adulta{adultTreesCount === 1 ? "" : "s"}.
                        </span>
                      )}
                      {brigade && (
                        <span>
                          Brigada {brigade.brigade.name} com{" "}
                          {brigade.stats.totalTrees} árvore
                          {brigade.stats.totalTrees === 1 ? "" : "s"} sob cuidado.
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {chatMode === "guardian" && (
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={
                      voiceEnabled
                        ? "text-xs px-3 py-1 rounded-full bg-emerald-500 text-emerald-950"
                        : "text-xs px-3 py-1 rounded-full border border-emerald-700 text-emerald-50 hover:bg-emerald-900/60"
                    }
                  >
                    {voiceEnabled ? "Voz ativada" : "Ativar voz"}
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-col md:flex-row gap-5">
                <div className="md:w-2/5 flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center mb-4 -mt-1 w-full">
                    <motion.div
                      className="relative h-40 w-40 md:h-48 md:w-48"
                      animate={{
                        y: isTreeTalking ? [-6, 0, -6] : [-3, 0, -3],
                        scale: isTreeTalking ? 1.04 : 1
                      }}
                      transition={{
                        duration: isTreeTalking ? 2 : 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div
                        className={[
                          "absolute inset-0 rounded-full bg-emerald-400 opacity-40 blur-2xl",
                          isTreeTalking ? "animate-ping" : "animate-pulse"
                        ].join(" ")}
                      />
                      <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-28 h-7 bg-emerald-900/10 blur-md rounded-full" />
                      <div className="absolute inset-[-6px] rounded-full border border-emerald-300/30 animate-spin-slow" />
                      <div className="absolute bottom-[-26px] left-1/2 -translate-x-1/2 w-8 h-14 bg-amber-700 rounded-full shadow-md" />
                      <div
                        className={[
                          "relative h-full w-full rounded-full bg-gradient-to-br shadow-[0_0_40px_rgba(16,185,129,0.9)] flex items-center justify-center",
                          treeMood === "positive"
                            ? isTreeTalking
                              ? "from-emerald-200 via-lime-300 to-emerald-500"
                              : "from-emerald-400 via-emerald-500 to-lime-400"
                            : treeMood === "negative"
                            ? isTreeTalking
                              ? "from-emerald-700 via-sky-700 to-indigo-800"
                              : "from-emerald-800 via-slate-700 to-sky-800"
                            : isTreeTalking
                            ? "from-emerald-300 via-lime-300 to-emerald-500"
                            : "from-emerald-500 via-emerald-600 to-emerald-400"
                        ].join(" ")}
                      >
                        <div className="absolute inset-[16%] rounded-full bg-gradient-to-t from-emerald-800/70 via-emerald-600/40 to-emerald-200/10 blur-[2px]" />
                        <span className="relative text-[10px] text-white tracking-[0.2em] uppercase">
                          {chatMode === "forest" ? "Floresta IA" : "Árvore IA"}
                        </span>
                        <div className="absolute inset-1">
                          <div className="absolute w-2 h-2 rounded-full bg-emerald-200/90 top-1 left-4 animate-ping" />
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-100/80 top-6 right-2 animate-ping" />
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-lime-200/80 bottom-5 left-7 animate-ping" />
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300/80 bottom-3 right-6 animate-ping" />
                        </div>
                        <motion.div
                          className="absolute inset-[4px] rounded-full border border-emerald-200/40"
                          animate={{
                            rotate: isTreeTalking ? 360 : 180
                          }}
                          transition={{
                            duration: isTreeTalking ? 16 : 24,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        >
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-200 top-1/2 right-0 -translate-y-1/2" />
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-lime-200 bottom-1 left-1/2 -translate-x-1/2" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 text-center">
                    Humor da {chatMode === "forest" ? "floresta" : "árvore"}:{" "}
                    <span
                      className={
                        treeMood === "positive"
                          ? "text-emerald-300"
                          : treeMood === "negative"
                          ? "text-sky-300"
                          : "text-emerald-200"
                      }
                    >
                      {treeMood === "positive"
                        ? "Animada"
                        : treeMood === "negative"
                        ? "Preocupada"
                        : "Calma"}
                    </span>
                  </p>
                  <div className="w-full max-w-xs">
                    {guardianTree ? (
                      <div className="border border-emerald-800 bg-emerald-950/40 rounded-2xl p-3 text-[11px] text-emerald-100 space-y-1">
                        <p className="text-[11px] font-semibold text-emerald-200">
                          Perfil da guardiã
                        </p>
                        <p>
                            <span className="text-emerald-300/80">Espécie:</span>{" "}
                            <span className="font-medium text-emerald-100">
                            {guardianTree.species}
                          </span>
                        </p>
                        {guardianTree.projectName && (
                          <p>
                            <span className="text-emerald-300/80">Projeto:</span>{" "}
                            <span className="font-medium">
                              {guardianTree.projectName}
                            </span>
                          </p>
                        )}
                        {(guardianTree.city ||
                          guardianTree.state ||
                          guardianTree.country) && (
                          <p>
                            <span className="text-emerald-300/80">Localização:</span>{" "}
                            {[guardianTree.city, guardianTree.state, guardianTree.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        <p>
                            <span className="text-emerald-300/80">CO₂ estimado:</span>{" "}
                          <span className="font-medium">
                            {(guardianTree.estimatedCo2Total / 1000).toFixed(2)} t
                          </span>
                        </p>
                        {guardianTree.plantedAt && (
                          <p>
                            <span className="text-emerald-300/80">
                              Plantada em:
                            </span>{" "}
                            {new Date(guardianTree.plantedAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border border-dashed border-emerald-700 bg-slate-950 rounded-2xl p-3 text-[11px] text-emerald-200/80">
                        Nenhuma árvore ainda foi vinculada a você. Plante sua
                        primeira semente no marketplace para ver o perfil da guardiã
                        aqui.
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-3/5 flex flex-col mt-4 md:mt-0">
                  <div
                    className={[
                      "h-64 rounded p-4 mb-4 overflow-y-auto space-y-2 border",
                      treeMood === "positive"
                        ? "bg-emerald-500/5 border-emerald-800"
                        : treeMood === "negative"
                        ? "bg-sky-500/5 border-sky-900"
                        : "bg-slate-900 border-slate-800"
                    ].join(" ")}
                  >
                    {(chatMode === "forest" ? forestMessages : messages).map((m, index) => (
                      <div key={index} className="mb-1">
                        <p className="text-xs text-emerald-200/80">
                          {m.role === "assistant"
                            ? chatMode === "forest"
                              ? "Floresta diz:"
                              : "Árvore diz:"
                            : "Você:"}
                        </p>
                        <div
                          className={
                            m.role === "assistant"
                              ? "bg-emerald-500/20 border border-emerald-500/60 p-2 rounded-xl inline-block max-w-xs"
                              : "bg-sky-500/20 border border-sky-500/60 p-2 rounded-xl inline-block max-w-xs self-end"
                          }
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <input
                      type="text"
                      placeholder={
                        chatMode === "forest"
                          ? "Envie uma mensagem para a floresta inteira..."
                          : "Envie uma mensagem para sua árvore..."
                      }
                      className="flex-grow p-2 border border-emerald-800 rounded text-sm bg-slate-950 text-emerald-50 placeholder:text-emerald-500/70"
                      value={chatMode === "forest" ? forestInput : input}
                      onChange={(e) =>
                        chatMode === "forest"
                          ? setForestInput(e.target.value)
                          : setInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (chatMode === "forest") {
                            sendForestMessage()
                          } else {
                            sendMessage()
                          }
                        }
                      }}
                      disabled={chatMode === "forest" ? forestLoading : loading}
                    />
                    <button
                      className="bg-emerald-400 text-emerald-950 px-4 py-2 rounded-full text-sm disabled:opacity-50 hover:bg-emerald-300"
                      onClick={chatMode === "forest" ? sendForestMessage : sendMessage}
                      disabled={chatMode === "forest" ? forestLoading : loading}
                    >
                      {chatMode === "forest"
                        ? forestLoading
                          ? "Enviando..."
                          : "Enviar"
                        : loading
                        ? "Enviando..."
                        : "Enviar"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === "ranking" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Ranking de guardiões
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Quem está cuidando de mais árvores e compensando mais CO₂.
                  </p>
                </div>
                {userTrees.length > 0 && (
                  <div className="hidden md:flex items-center gap-3 text-[11px] text-emerald-200/80">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-300" />
                      Mudas: {seedlingTreesCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Jovens: {youngTreesCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Adultas: {adultTreesCount}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-100 mb-3">
                    Top usuários
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      { name: "Guardião Amazônia", trees: 128, co2: 18.4 },
                      { name: "Floresta Urbana SP", trees: 96, co2: 12.1 },
                      { name: "Cuidar é Resistir", trees: 72, co2: 9.3 }
                    ].map((item, index) => {
                      const maxCo2 = 18.4
                      const percent =
                        maxCo2 > 0 ? Math.max(10, (item.co2 / maxCo2) * 100) : 100
                      return (
                        <li
                          key={item.name}
                          className="bg-slate-950/70 border border-emerald-900 rounded-xl px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  index === 0
                                    ? "text-xs font-semibold w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center"
                                    : "text-xs font-semibold w-6 h-6 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center"
                                }
                              >
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-emerald-100">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-emerald-200/80">
                                  {item.trees} árvores • {item.co2} t CO₂
                                </p>
                              </div>
                            </div>
                            <p className="text-[11px] text-emerald-300 font-semibold">
                              {((item.co2 / maxCo2) * 100).toFixed(0)}% do topo
                            </p>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-emerald-950 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-400"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-emerald-100 mb-3">
                    Top empresas
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      { name: "Empresa Verde S.A.", trees: 520, co2: 74.2 },
                      { name: "Tech4Climate", trees: 340, co2: 48.7 },
                      { name: "EcoLog Express", trees: 215, co2: 29.9 }
                    ].map((item, index) => {
                      const maxCo2 = 74.2
                      const percent =
                        maxCo2 > 0 ? Math.max(10, (item.co2 / maxCo2) * 100) : 100
                      return (
                        <li
                          key={item.name}
                          className="bg-slate-950/70 border border-emerald-900 rounded-xl px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  index === 0
                                    ? "text-xs font-semibold w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center"
                                    : "text-xs font-semibold w-6 h-6 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center"
                                }
                              >
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-emerald-100">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-emerald-200/80">
                                  {item.trees} árvores • {item.co2} t CO₂
                                </p>
                              </div>
                            </div>
                            <p className="text-[11px] text-emerald-300 font-semibold">
                              {((item.co2 / maxCo2) * 100).toFixed(0)}% do topo
                            </p>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-emerald-950 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-400"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 border border-emerald-900 rounded-xl px-3 py-3">
                  <h3 className="text-sm font-semibold text-emerald-100 mb-1">
                    Brigada ambiental
                  </h3>
                  <p className="text-[11px] text-emerald-200/80 mb-2">
                    Times em campo que monitoram plantios, incêndios e saúde das
                    áreas em parceria com a SementeToken.
                  </p>
                  <ul className="space-y-2 text-[11px]">
                    {[
                      {
                        name: "Brigada Paulista – Parque Avenida",
                        actions: 24,
                        area: 32
                      },
                      {
                        name: "Brigada Agrofloresta Interior SP",
                        actions: 18,
                        area: 54
                      },
                      {
                        name: "Brigada Mata Atlântica RJ",
                        actions: 12,
                        area: 27
                      }
                    ].map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium text-emerald-100">
                            {item.name}
                          </p>
                          <p className="text-emerald-200/80">
                            {item.actions} ações de campo • {item.area} ha
                            monitorados
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] text-emerald-300">
                          Em operação
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] text-emerald-200/70">
                    Em breve, este ranking será gerado a partir dos dados reais
                    de usuários, empresas e brigadas ambientais conectadas à
                    plataforma.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeSection === "store" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Loja verde
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Produtos naturais conectados a projetos de floresta com
                    cashback de carbono.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-200/80">
                    Créditos verdes disponíveis
                  </p>
                  <p className="text-sm font-semibold text-emerald-300">
                    {stats.greenCredits}
                  </p>
                </div>
              </div>

              {orderMessage && (
                <div className="text-xs px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-700">
                  {orderMessage}
                </div>
              )}

              {benefits.length > 0 && (
                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Benefícios que você já desbloqueou
                      </h3>
                      <p className="text-[11px] text-emerald-200/80">
                        Use seus créditos verdes para obter vantagens na loja e em parceiros.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {benefits.map((b) => (
                      <div
                        key={b.id}
                        className="border border-emerald-800 rounded-xl px-3 py-3 flex flex-col gap-2 bg-slate-950"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-emerald-100">
                            {b.title}
                          </h4>
                          <span className="text-[11px] text-emerald-300 font-semibold">
                            {b.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80">
                          {b.description}
                        </p>
                        <p className="text-[11px] text-emerald-300">
                          A partir de {b.minCredits} créditos verdes
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {products.length === 0 ? (
                <p className="text-xs text-emerald-200/80">
                  Em breve você verá aqui produtos de parceiros conectados às
                  agroflorestas da SementeToken.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => {
                      const qty = selectedQuantities[product.id] || 0
                      const normalizedProductName = product.name
                        .toLowerCase()
                        .trim()
                      const candidates = storeSpecies.filter((s) => {
                        const common = s.commonName.toLowerCase().trim()
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
                          className="border border-emerald-900 rounded-2xl overflow-hidden bg-slate-950/70 flex flex-col"
                        >
                          {relatedSpecies?.imageUrl ? (
                            <div className="h-32 bg-slate-900 overflow-hidden">
                              <img
                                src={getImageUrl(relatedSpecies.imageUrl)}
                                alt={relatedSpecies.commonName || product.name}
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
                                <h3 className="text-sm font-semibold text-emerald-100">
                                  {product.name}
                                </h3>
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
                                {product.projectName && (
                                  <p className="text-[11px] text-emerald-300 mt-1">
                                    Projeto ligado: {product.projectName}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-100">
                                  R$ {product.price.toFixed(2)}
                                </p>
                                <p className="text-[11px] text-emerald-300">
                                  +{" "}
                                  {(product.carbonCashbackKg / 1000).toFixed(2)}{" "}
                                  t CO₂ cashback
                                </p>
                                <button
                                  type="button"
                                  onClick={() => openProductAgent(product)}
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-emerald-700 text-emerald-100 hover:bg-emerald-900/60"
                                >
                                  Agente da árvore
                                </button>
                              </div>
                            </div>
                            {product.description && (
                              <p className="text-[11px] text-emerald-200/80">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between gap-2 pt-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-emerald-200/80">
                                  Quantidade:
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 border border-emerald-800 rounded px-2 py-1 text-xs bg-slate-950 text-emerald-50"
                                  value={qty}
                                  onChange={(e) =>
                                    updateQuantity(
                                      product.id,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <p className="text-[11px] text-emerald-200/80">
                                Cashback total:{" "}
                                {(
                                  (product.carbonCashbackKg * qty) /
                                  1000
                                ).toFixed(2)}{" "}
                                t CO₂
                              </p>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => setTechModalProduct(product)}
                                className="text-[11px] text-emerald-300 hover:text-emerald-100"
                              >
                                Ver ficha técnica da árvore
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCreateOrder}
                      disabled={ordering}
                      className="text-sm px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
                    >
                      {ordering ? "Finalizando..." : "Finalizar compra verde"}
                    </button>
                  </div>
                  {marketChatProduct && (
                    <div className="mt-4 border border-emerald-900 rounded-2xl bg-slate-950/80 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-emerald-100">
                            Chat com a árvore do produto
                          </h3>
                          <p className="text-[11px] text-emerald-200/80">
                            Você está conversando com a árvore ligada a "
                            {marketChatProduct.name}"
                            {marketChatProduct.projectName
                              ? ` no projeto ${marketChatProduct.projectName}`
                              : "" }
                            .
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMarketChatProduct(null)
                            setMarketChatMessages([])
                            setMarketChatInput("")
                          }}
                          className="text-[11px] text-emerald-300 hover:text-emerald-100"
                        >
                          Fechar
                        </button>
                      </div>
                      <div className="h-56 rounded border border-emerald-800 bg-slate-900/80 p-3 overflow-y-auto space-y-2">
                        {marketChatMessages.map((m, index) => (
                          <div key={index} className="mb-1">
                            <p className="text-[11px] text-emerald-200/80">
                              {m.role === "assistant" ? "Árvore diz:" : "Você:"}
                            </p>
                            <div
                              className={
                                m.role === "assistant"
                                  ? "bg-emerald-500/20 border border-emerald-500/60 p-2 rounded-xl inline-block max-w-xs"
                                  : "bg-sky-500/20 border border-sky-500/60 p-2 rounded-xl inline-block max-w-xs self-end"
                              }
                            >
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {!marketChatMessages.length && (
                          <p className="text-[11px] text-emerald-200/70">
                            Envie uma pergunta para começar a conversa com a árvore deste produto.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-grow p-2 border border-emerald-800 rounded text-sm bg-slate-950 text-emerald-50 placeholder:text-emerald-500/70"
                          placeholder="Pergunte algo para a árvore antes de comprar..."
                          value={marketChatInput}
                          onChange={(e) => setMarketChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") sendMarketMessage()
                          }}
                          disabled={marketChatLoading}
                        />
                        <button
                          type="button"
                          onClick={sendMarketMessage}
                          disabled={marketChatLoading}
                          className="bg-emerald-400 text-emerald-950 px-4 py-2 rounded-full text-sm disabled:opacity-50 hover:bg-emerald-300"
                        >
                          {marketChatLoading ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "feed" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Feed da floresta
                  </h2>
                  <p className="text-xs text-emerald-200/80 max-w-xl">
                    Registre plantios, inspeções e alertas em campo e acompanhe ações de outras brigadas e guardiões.
                  </p>
                </div>
                <div className="text-xs text-emerald-200/80">
                  Créditos verdes são gerados quando ações de campo são registradas.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3 md:col-span-1">
                  <h3 className="text-sm font-semibold text-emerald-100">
                    Registrar nova ação
                  </h3>
                  {feedError && (
                    <div className="text-[11px] px-3 py-2 rounded-lg bg-red-900/40 text-red-100 border border-red-700/70">
                      {feedError}
                    </div>
                  )}
                  <div className="space-y-2 text-[11px]">
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">Tipo de ação</p>
                      <select
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={newAction.type}
                        onChange={(e) =>
                          setNewAction((prev) => ({
                            ...prev,
                            type: e.target.value as "planting" | "inspection" | "fire_alert"
                          }))
                        }
                      >
                        <option value="planting">Plantio</option>
                        <option value="inspection">Inspeção / monitoramento</option>
                        <option value="fire_alert">Alerta de fogo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">Descrição da ação</p>
                      <textarea
                        className="w-full border border-emerald-800 rounded px-2 py-2 bg-slate-950 text-emerald-50 text-[11px] min-h-[72px]"
                        placeholder="Ex: Plantio de 3 mudas de Ipê amarelo na praça central."
                        value={newAction.description}
                        onChange={(e) =>
                          setNewAction((prev) => ({
                            ...prev,
                            description: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">
                        Vincular a uma das suas árvores (opcional)
                      </p>
                      <select
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={newAction.treeId}
                        onChange={(e) =>
                          setNewAction((prev) => ({
                            ...prev,
                            treeId: e.target.value
                          }))
                        }
                      >
                        <option value="">Nenhuma árvore selecionada</option>
                        {userTrees.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.species} {t.projectName ? `– ${t.projectName}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">
                        Foto ou vídeo da ação (opcional)
                      </p>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="w-full text-[11px] text-emerald-50 file:text-[11px] file:px-2 file:py-1 file:rounded-full file:border file:border-emerald-700 file:bg-emerald-500/10 file:text-emerald-100"
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0]
                          if (!file) {
                            setNewAction((prev) => ({
                              ...prev,
                              mediaFile: null,
                              mediaPreviewUrl: "",
                              mediaDurationSeconds: 0
                            }))
                            return
                          }

                          if (
                            !file.type.startsWith("image/") &&
                            !file.type.startsWith("video/")
                          ) {
                            setFeedError(
                              "Envie apenas arquivos de imagem ou vídeo."
                            )
                            e.target.value = ""
                            return
                          }

                          let previewUrl = ""
                          let durationSeconds = 0

                          if (file.type.startsWith("video/")) {
                            previewUrl = URL.createObjectURL(file)
                            try {
                              const duration = await new Promise<number>(
                                (resolve, reject) => {
                                  const video = document.createElement("video")
                                  video.preload = "metadata"
                                  video.src = previewUrl
                                  video.onloadedmetadata = () => {
                                    const d = video.duration
                                    video.remove()
                                    resolve(d)
                                  }
                                  video.onerror = () => {
                                    video.remove()
                                    reject(
                                      new Error(
                                        "Não foi possível ler a duração do vídeo."
                                      )
                                    )
                                  }
                                }
                              )
                              durationSeconds = Math.round(duration)
                              if (durationSeconds > 32) {
                                setFeedError(
                                  "O vídeo pode ter no máximo 30 segundos."
                                )
                                URL.revokeObjectURL(previewUrl)
                                e.target.value = ""
                                setNewAction((prev) => ({
                                  ...prev,
                                  mediaFile: null,
                                  mediaPreviewUrl: "",
                                  mediaDurationSeconds: 0
                                }))
                                return
                              }
                            } catch {
                              setFeedError(
                                "Não foi possível validar a duração do vídeo."
                              )
                            }
                          } else if (file.type.startsWith("image/")) {
                            previewUrl = URL.createObjectURL(file)
                          }

                          setFeedError(null)
                          setNewAction((prev) => ({
                            ...prev,
                            mediaFile: file,
                            mediaPreviewUrl: previewUrl,
                            mediaDurationSeconds: durationSeconds
                              ? durationSeconds
                              : prev.mediaDurationSeconds
                          }))
                        }}
                      />
                      {newAction.mediaPreviewUrl && (
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-[10px] text-emerald-200/80 truncate">
                            Arquivo selecionado:{" "}
                            <span className="font-medium">
                              {newAction.mediaFile?.name || "mídia"}
                            </span>
                            {newAction.mediaDurationSeconds
                              ? ` • ${newAction.mediaDurationSeconds}s`
                              : ""}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (newAction.mediaPreviewUrl) {
                                URL.revokeObjectURL(newAction.mediaPreviewUrl)
                              }
                              setNewAction((prev) => ({
                                ...prev,
                                mediaFile: null,
                                mediaPreviewUrl: "",
                                mediaDurationSeconds: 0
                              }))
                            }}
                            className="text-[10px] text-emerald-300 hover:text-emerald-100"
                          >
                            Remover mídia
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-emerald-200/80">Latitude (opcional)</p>
                        <input
                          className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          placeholder="-23.55"
                          value={newAction.latitude}
                          onChange={(e) =>
                            setNewAction((prev) => ({
                              ...prev,
                              latitude: e.target.value
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-emerald-200/80">Longitude (opcional)</p>
                        <input
                          className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          placeholder="-46.63"
                          value={newAction.longitude}
                          onChange={(e) =>
                            setNewAction((prev) => ({
                              ...prev,
                              longitude: e.target.value
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCreateAction}
                        className="w-full text-xs px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
                      >
                        Publicar ação
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-200/70">
                      Ações podem ser usadas pela sua brigada ou empresa parceira para comprovar monitoramento em campo. Para participar e ganhar créditos verdes, você precisa ter pelo menos uma árvore na plataforma.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Ações recentes
                      </h3>
                      <p className="text-[11px] text-emerald-200/80">
                        Últimos registros de plantios, inspeções e alertas de brigadas e usuários.
                      </p>
                    </div>
                    {feedLoading && (
                      <p className="text-[11px] text-emerald-200/80">
                        Carregando feed...
                      </p>
                    )}
                  </div>

                  {feedItems.length === 0 && !feedLoading ? (
                    <p className="text-[11px] text-emerald-200/80">
                      Nenhuma ação registrada ainda. Comece registrando um plantio ou inspeção.
                    </p>
                  ) : (
                    <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-[11px]">
                      {feedItems.map((item) => {
                        let label = "Ação"
                        let color = "text-emerald-300"
                        let isFirePatrolInspection = false
                        if (item.type === "planting") {
                          label = "Plantio"
                          color = "text-emerald-300"
                        } else if (item.type === "inspection") {
                          label = "Inspeção"
                          color = "text-sky-300"
                          const desc = (item.description || "").toLowerCase()
                          if (
                            desc.includes("patrulha de foco de incêndio concluída") ||
                            desc.includes("patrulha concluída em área de alerta de fogo")
                          ) {
                            isFirePatrolInspection = true
                          }
                        } else if (item.type === "fire_alert") {
                          label = "Alerta de fogo"
                          color = "text-amber-300"
                        }

                        return (
                          <li
                            key={item.id}
                            className="border border-emerald-800/60 rounded-xl px-3 py-2.5 bg-slate-950/90"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-col">
                                <span className={`font-semibold ${color} flex items-center gap-1`}>
                                  {isFirePatrolInspection && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400 text-[9px] text-amber-200">
                                      🔥
                                    </span>
                                  )}
                                  {label}
                                  {isFirePatrolInspection && (
                                    <span className="ml-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/60 text-amber-200">
                                      Patrulha de foco concluída
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-emerald-200/80">
                                  {item.brigadeName || "Brigada do guardião"}
                                </span>
                                <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-100 border border-emerald-700/70">
                                  <span
                                    className={
                                      item.ownerRole === "corporate"
                                        ? "w-1.5 h-1.5 rounded-full bg-emerald-300"
                                        : "w-1.5 h-1.5 rounded-full bg-sky-300"
                                    }
                                  />
                                  {item.ownerRole === "corporate"
                                    ? "Brigada parceira"
                                    : "Guardião da floresta"}
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-200/70">
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleString("pt-BR")
                                  : ""}
                              </p>
                            </div>
                            {item.description && (
                              <p className="mt-1 text-emerald-200/85">
                                {item.description}
                              </p>
                            )}
                            {item.mediaUrl && item.mediaType && (
                              <div className="mt-2">
                                {item.mediaType === "image" ? (
                                  <img
                                    src={getImageUrl(item.mediaUrl)}
                                    alt="Mídia da ação"
                                    className="max-h-40 rounded-lg border border-emerald-900/70 object-cover"
                                  />
                                ) : (
                                  <video
                                    controls
                                    className="w-full max-h-48 rounded-lg border border-emerald-900/70"
                                  >
                                    <source
                                      src={getImageUrl(item.mediaUrl)}
                                      type="video/mp4"
                                    />
                                  </video>
                                )}
                              </div>
                            )}
                            {item.treeSpecies && (
                              <p className="mt-1 text-[10px] text-emerald-200/80">
                                Espécie relacionada: {item.treeSpecies}
                              </p>
                            )}
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="text-[10px] text-emerald-300/90">
                                {item.brigadistName
                                  ? `Responsável: ${item.brigadistName}`
                                  : "Responsável: não informado"}
                              </p>
                              {item.latitude !== null && item.longitude !== null && (
                                <p className="text-[10px] text-emerald-200/80">
                                  {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
                                </p>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}
          {activeSection === "brigade" && (role === "corporate" || role === "admin") && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Brigada ambiental parceira
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    Cadastre brigadistas e acompanhe o impacto das árvores ligadas à sua conta.
                  </p>
                </div>
              </div>

              {brigade && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-2">
                    <p className="text-[11px] text-emerald-200/80">
                      Perfil da brigada
                    </p>
                    <div className="space-y-1">
                      <input
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={brigade.brigade.name}
                        onChange={(e) =>
                          setBrigade((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  brigade: {
                                    ...prev.brigade,
                                    name: e.target.value
                                  }
                                }
                              : prev
                          )
                        }
                        placeholder="Nome da brigada"
                      />
                      <textarea
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px] min-h-[48px]"
                        value={brigade.brigade.description || ""}
                        onChange={(e) =>
                          setBrigade((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  brigade: {
                                    ...prev.brigade,
                                    description: e.target.value
                                  }
                                }
                              : prev
                          )
                        }
                        placeholder="Descrição ou missão da brigada"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          placeholder="Cidade"
                          value={brigade.brigade.city || ""}
                          onChange={(e) =>
                            setBrigade((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    brigade: {
                                      ...prev.brigade,
                                      city: e.target.value
                                    }
                                  }
                                : prev
                            )
                          }
                        />
                        <input
                          className="border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          placeholder="Estado"
                          value={brigade.brigade.state || ""}
                          onChange={(e) =>
                            setBrigade((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    brigade: {
                                      ...prev.brigade,
                                      state: e.target.value
                                    }
                                  }
                                : prev
                            )
                          }
                        />
                        <input
                          className="border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                          placeholder="País"
                          value={brigade.brigade.country || ""}
                          onChange={(e) =>
                            setBrigade((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    brigade: {
                                      ...prev.brigade,
                                      country: e.target.value
                                    }
                                  }
                                : prev
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-400 text-emerald-950 text-[11px] hover:bg-emerald-300"
                        onClick={async () => {
                          if (typeof window === "undefined") return
                          const token = localStorage.getItem("accessToken")
                          if (!token || !brigade) return
                          try {
                            await fetch(`${API_URL}/brigades/me`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                name: brigade.brigade.name,
                                description: brigade.brigade.description || "",
                                city: brigade.brigade.city || "",
                                state: brigade.brigade.state || "",
                                country: brigade.brigade.country || ""
                              })
                            })
                          } catch {}
                        }}
                      >
                        Salvar perfil da brigada
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4">
                    <p className="text-[11px] text-emerald-200/80 mb-1">
                      Árvores sob responsabilidade da brigada
                    </p>
                    <p className="text-2xl font-bold text-emerald-300">
                      {brigade.stats.totalTrees}
                    </p>
                    <p className="text-[11px] text-emerald-200/70 mt-1">
                      Soma das árvores vinculadas à sua conta corporativa.
                    </p>
                  </div>
                  <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4">
                    <p className="text-[11px] text-emerald-200/80 mb-1">
                      Ações de campo registradas
                    </p>
                    <p className="text-2xl font-bold text-emerald-300">
                      {brigade.stats.actionsCount}
                    </p>
                    <p className="text-[11px] text-emerald-200/70 mt-1">
                      Plantios, inspeções e alertas de fogo registrados na plataforma.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-100">
                      Brigadistas cadastrados
                    </h3>
                  </div>
                  {brigade && brigade.brigadists.length > 0 ? (
                    <ul className="space-y-2 text-[11px]">
                      {brigade.brigadists.map((b) => (
                        <li
                          key={b.id}
                          className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 cursor-pointer ${
                            selectedBrigadistId === b.id
                              ? "border-emerald-400 bg-emerald-900/40"
                              : "border-emerald-800 hover:border-emerald-500 hover:bg-emerald-900/30"
                          }`}
                          onClick={async () => {
                            setSelectedBrigadistId(b.id)
                            if (typeof window === "undefined") return
                            const token = localStorage.getItem("accessToken")
                            if (!token) return
                            try {
                              const res = await fetch(
                                `${API_URL}/brigades/brigadists/${b.id}/tasks`,
                                {
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  }
                                }
                              )
                              if (!res.ok) return
                              const data = await res.json()
                              setBrigadistTasks(
                                Array.isArray(data) ? data : []
                              )
                            } catch {}
                          }}
                        >
                          <div>
                            <p className="font-medium text-emerald-100">
                              {b.name}
                            </p>
                            <p className="text-emerald-200/80">
                              {b.role || "Brigadista"}{" "}
                              {b.email ? `• ${b.email}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-200/80">
                      Nenhum brigadista cadastrado ainda. Use o formulário ao lado
                      para começar.
                    </p>
                  )}
                </div>
                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-emerald-100">
                    Cadastrar novo brigadista
                  </h3>
                  {brigadeMessage && (
                    <div className="text-[11px] px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-700">
                      {brigadeMessage}
                    </div>
                  )}
                  <div className="space-y-2 text-[11px]">
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">Nome</p>
                      <input
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={brigadistForm.name}
                        onChange={(e) =>
                          setBrigadistForm((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">Função</p>
                      <input
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={brigadistForm.role}
                        onChange={(e) =>
                          setBrigadistForm((prev) => ({
                            ...prev,
                            role: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-200/80">Email de contato</p>
                      <input
                        className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                        value={brigadistForm.email}
                        onChange={(e) =>
                          setBrigadistForm((prev) => ({
                            ...prev,
                            email: e.target.value
                          }))
                        }
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        className="text-xs px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 disabled:opacity-50"
                        onClick={async () => {
                          if (!brigadistForm.name.trim()) {
                            setBrigadeMessage(
                              "Informe pelo menos o nome do brigadista."
                            )
                            return
                          }
                          setBrigadeMessage(null)
                          const token =
                            typeof window !== "undefined"
                              ? localStorage.getItem("accessToken")
                              : null
                          if (!token) {
                            setBrigadeMessage(
                              "Você precisa estar logado para cadastrar brigadistas."
                            )
                            return
                          }
                          try {
                            const res = await fetch(
                              `${API_URL}/brigades/brigadists`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  name: brigadistForm.name,
                                  role: brigadistForm.role || undefined,
                                  email: brigadistForm.email || undefined
                                })
                              }
                            )
                            if (!res.ok) {
                              setBrigadeMessage(
                                "Não foi possível cadastrar o brigadista agora."
                              )
                              return
                            }
                            setBrigadistForm({ name: "", role: "", email: "" })
                            setBrigadeMessage("Brigadista cadastrado com sucesso.")
                            const refresh = await fetch(
                              `${API_URL}/brigades/summary`,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`
                                }
                              }
                            )
                            if (refresh.ok) {
                              const data = await refresh.json()
                              setBrigade(data)
                            }
                          } catch {
                            setBrigadeMessage(
                              "Ocorreu um erro ao comunicar com o servidor."
                            )
                          }
                        }}
                      >
                        Salvar brigadista
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-emerald-900/60 pt-3 mt-3 space-y-2 text-[11px]">
                    <h4 className="font-semibold text-emerald-100">
                      Tarefas do brigadista selecionado
                    </h4>
                    {!selectedBrigadistId ? (
                      <p className="text-emerald-200/80">
                        Selecione um brigadista ao lado para ver e criar tarefas.
                      </p>
                    ) : (
                      <>
                        {brigadistTasks.length === 0 ? (
                          <p className="text-emerald-200/80">
                            Nenhuma tarefa cadastrada ainda para este brigadista.
                          </p>
                        ) : (
                          <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {brigadistTasks.map((t) => (
                              <li
                                key={t.id}
                                className="border border-emerald-800 rounded-lg px-2 py-1 flex items-center justify-between gap-2"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-emerald-100">
                                    {t.title}
                                  </p>
                                  {t.description && (
                                    <p className="text-emerald-200/80">
                                      {t.description}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-emerald-300">
                                    Status: {t.status}
                                    {t.dueDate
                                      ? ` • prazo: ${new Date(
                                          t.dueDate
                                        ).toLocaleDateString("pt-BR")}`
                                      : ""}
                                  </p>
                                </div>
                                <button
                                  className="text-[10px] px-2 py-1 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                  onClick={async () => {
                                    if (typeof window === "undefined") return
                                    const token =
                                      localStorage.getItem("accessToken")
                                    if (!token) return
                                    const nextStatus =
                                      t.status === "done" ? "pending" : "done"
                                    try {
                                      const res = await fetch(
                                        `${API_URL}/brigades/tasks/${t.id}/status`,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            status: nextStatus
                                          })
                                        }
                                      )
                                      if (!res.ok) return
                                      setBrigadistTasks((prev) =>
                                        prev.map((task) =>
                                          task.id === t.id
                                            ? { ...task, status: nextStatus }
                                            : task
                                        )
                                      )
                                    } catch {}
                                  }}
                                >
                                  {t.status === "done" ? "Reabrir" : "Concluir"}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="space-y-1 pt-2">
                          <p className="text-emerald-200/80">
                            Criar nova tarefa
                          </p>
                          <input
                            className="w-full border border-emerald-800 rounded px-2 py-1 bg-slate-950 text-emerald-50 text-[11px]"
                            placeholder="Título da tarefa (ex: inspecionar talhão norte)"
                            onKeyDown={async (e) => {
                              if (e.key !== "Enter") return
                              const title = (e.target as HTMLInputElement).value
                              if (!title.trim() || !selectedBrigadistId) return
                              if (typeof window === "undefined") return
                              const token = localStorage.getItem("accessToken")
                              if (!token) return
                              try {
                                const res = await fetch(
                                  `${API_URL}/brigades/brigadists/${selectedBrigadistId}/tasks`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ title })
                                  }
                                )
                                if (!res.ok) return
                                const created = await res.json()
                                setBrigadistTasks((prev) => [
                                  {
                                    id: created.id,
                                    title: created.title,
                                    description: created.description ?? null,
                                    status: created.status,
                                    dueDate: created.dueDate ?? null,
                                    createdAt: created.createdAt
                                  },
                                  ...prev
                                ])
                                ;(e.target as HTMLInputElement).value = ""
                              } catch {}
                            }}
                          />
                          <p className="text-[10px] text-emerald-300">
                            Pressione Enter para salvar. Em breve a IA da floresta
                            vai sugerir missões aqui.
                          </p>
                          <div className="pt-2 space-y-2">
                            <button
                              type="button"
                              disabled={!selectedBrigadistId || aiSuggesting}
                              onClick={async () => {
                                if (!selectedBrigadistId) return
                                setAiError(null)
                                setAiSuggesting(true)
                                try {
                                  const contextParts: string[] = []
                                  if (brigade) {
                                    contextParts.push(`Brigada: ${brigade.brigade.name}.`)
                                  }
                                  if (brigadistTasks.length > 0) {
                                    const resumo = brigadistTasks
                                      .slice(0, 10)
                                      .map((t, i) => `${i + 1}. ${t.title} [${t.status}]`)
                                      .join(" ")
                                    contextParts.push(`Tarefas atuais: ${resumo}.`)
                                  }
                                  const prompt = `${contextParts.join(
                                    " "
                                  )} Sugira até 3 novas tarefas curtas e objetivas para este brigadista, no formato estritamente JSON válido: {"tasks":[{"title":"...","description":"..."}]}. Apenas retorne o JSON, sem comentários.`
                                  const res = await fetch(`${API_URL}/ai/chat`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                      treeId: "forest-brain",
                                      message: prompt,
                                      species:
                                        "Floresta SementeToken, inteligência coletiva formada por todas as árvores, projetos e brigadas da plataforma",
                                      locationDescription:
                                        "Floresta digital SementeToken, conectando projetos em diferentes biomas do Brasil",
                                      history: []
                                    })
                                  })
                                  const data = await res.json()
                                  let raw = String(data.response || "")
                                  let jsonText = raw
                                  const first = raw.indexOf("{")
                                  const last = raw.lastIndexOf("}")
                                  if (first !== -1 && last !== -1 && last > first)
                                    jsonText = raw.slice(first, last + 1)
                                  let parsed: any = null
                                  try {
                                    parsed = JSON.parse(jsonText)
                                  } catch {
                                    parsed = null
                                  }
                                  const list: { title: string; description?: string }[] =
                                    Array.isArray(parsed?.tasks)
                                      ? parsed.tasks
                                          .filter(
                                            (t: any) =>
                                              t &&
                                              typeof t.title === "string" &&
                                              t.title.trim()
                                          )
                                          .map((t: any) => ({
                                            title: String(t.title).trim(),
                                            description:
                                              typeof t.description === "string" &&
                                              t.description.trim()
                                                ? String(t.description).trim()
                                                : ""
                                          }))
                                      : []
                                  setAiSuggestions(
                                    list.slice(0, 3).map((t) => ({ ...t, selected: true }))
                                  )
                                  if (list.length === 0) {
                                    setAiError(
                                      "Não consegui extrair sugestões estruturadas desta resposta."
                                    )
                                  }
                                } catch {
                                  setAiError("Falha ao obter sugestões da IA. Tente novamente.")
                                } finally {
                                  setAiSuggesting(false)
                                }
                              }}
                              className="text-[11px] px-3 py-1 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                            >
                              {aiSuggesting ? "Sugerindo..." : "Sugerir tarefas com IA"}
                            </button>
                            {aiError && (
                              <p className="mt-1 text-[11px] text-amber-300">{aiError}</p>
                            )}
                            {aiSuggestions.length > 0 && (
                              <div className="mt-2 border border-emerald-800 rounded-lg p-2">
                                <p className="text-[11px] text-emerald-200/90 mb-1">
                                  Sugestões da IA
                                </p>
                                <ul className="space-y-1">
                                  {aiSuggestions.map((sug, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-[11px]">
                                      <input
                                        type="checkbox"
                                        checked={!!sug.selected}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setAiSuggestions((prev) =>
                                            prev.map((it, i) =>
                                              i === idx ? { ...it, selected: checked } : it
                                            )
                                          )
                                        }}
                                      />
                                      <div className="flex-1">
                                        <p className="text-emerald-100">{sug.title}</p>
                                        {sug.description ? (
                                          <p className="text-emerald-200/80">
                                            {sug.description}
                                          </p>
                                        ) : null}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    className="text-[11px] px-3 py-1 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                    onClick={async () => {
                                      if (!selectedBrigadistId) return
                                      const toAdd = aiSuggestions.filter((s) => s.selected)
                                      if (!toAdd.length) return
                                      if (typeof window === "undefined") return
                                      const token = localStorage.getItem("accessToken")
                                      if (!token) return
                                      try {
                                        for (const item of toAdd) {
                                          const res = await fetch(
                                            `${API_URL}/brigades/brigadists/${selectedBrigadistId}/tasks`,
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`
                                              },
                                              body: JSON.stringify({
                                                title: item.title,
                                                description: item.description || ""
                                              })
                                            }
                                          )
                                          if (!res.ok) continue
                                          const created = await res.json()
                                          setBrigadistTasks((prev) => [
                                            {
                                              id: created.id,
                                              title: created.title,
                                              description: created.description ?? null,
                                              status: created.status,
                                              dueDate: created.dueDate ?? null,
                                              createdAt: created.createdAt
                                            },
                                            ...prev
                                          ])
                                        }
                                        setAiSuggestions([])
                                      } catch {}
                                    }}
                                  >
                                    Adicionar selecionadas
                                  </button>
                                  <button
                                    type="button"
                                    className="text-[11px] px-3 py-1 rounded-full border border-emerald-700 text-emerald-50 hover:bg-emerald-900/60"
                                    onClick={() => setAiSuggestions([])}
                                  >
                                    Limpar sugestões
                                  </button>
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              disabled={
                                !selectedBrigadistId ||
                                fireAlerts.length === 0 ||
                                autoFromFireLoading
                              }
                              onClick={async () => {
                                if (!selectedBrigadistId) return
                                if (typeof window === "undefined") return
                                const token = localStorage.getItem("accessToken")
                                if (!token) return

                                setAutoFromFireLoading(true)
                                try {
                                  const now = Date.now()
                                  const recentAlerts = fireAlerts.filter((a) => {
                                    if (!a.createdAt) return false
                                    const t = new Date(a.createdAt).getTime()
                                    if (!t || Number.isNaN(t)) return false
                                    const diffHours = (now - t) / (1000 * 60 * 60)
                                    return diffHours <= 48
                                  })

                                  const sourceList =
                                    recentAlerts.length > 0 ? recentAlerts : fireAlerts

                                  for (const alert of sourceList.slice(0, 5)) {
                                    const dateLabel = alert.createdAt
                                      ? new Date(alert.createdAt).toLocaleDateString("pt-BR")
                                      : "recente"
                                    const title = `Patrulhar área do alerta de fogo (${dateLabel})`
                                    const descriptionParts = []
                                    if (alert.description) {
                                      descriptionParts.push(alert.description)
                                    }
                                    descriptionParts.push(
                                      `Coordenadas aproximadas: ${alert.latitude.toFixed(
                                        4
                                      )}, ${alert.longitude.toFixed(4)}.`
                                    )
                                    const description = descriptionParts.join(" ")

                                    const res = await fetch(
                                      `${API_URL}/brigades/brigadists/${selectedBrigadistId}/tasks`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                          title,
                                          description
                                        })
                                      }
                                    )
                                    if (!res.ok) continue
                                    const created = await res.json()
                                    setBrigadistTasks((prev) => [
                                      {
                                        id: created.id,
                                        title: created.title,
                                        description: created.description ?? null,
                                        status: created.status,
                                        dueDate: created.dueDate ?? null,
                                        createdAt: created.createdAt
                                      },
                                      ...prev
                                    ])
                                  }
                                } catch {
                                } finally {
                                  setAutoFromFireLoading(false)
                                }
                              }}
                              className="text-[11px] px-3 py-1 rounded-full bg-amber-500 text-amber-950 hover:bg-amber-400 disabled:opacity-50"
                            >
                              {autoFromFireLoading
                                ? "Gerando patrulhas..."
                                : "Gerar patrulhas pelos focos recentes"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {fireAlerts.length > 0 && (
                  <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-100">
                          Focos de queimadas registrados
                        </h3>
                        <p className="text-[11px] text-emerald-200/80">
                          Visualize em mapa os alertas registrados pela sua brigada.
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-56 rounded-xl overflow-hidden border border-emerald-900">
                      <MapContainer
                        center={
                          fireAlerts.length
                            ? [
                                fireAlerts[0].latitude,
                                fireAlerts[0].longitude
                              ]
                            : [-14.235, -51.9253]
                        }
                        zoom={fireAlerts.length ? 6 : 4}
                        scrollWheelZoom={false}
                        className="w-full h-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {fireAlerts.map((a) => (
                          <Marker
                            key={a.id}
                            position={[a.latitude, a.longitude]}
                          >
                            <Popup>
                              <div className="text-[11px]">
                                <p className="font-semibold mb-1">
                                  Alerta de fogo
                                </p>
                                {a.description && (
                                  <p className="mb-1">{a.description}</p>
                                )}
                                <p className="text-emerald-200/80">
                                  {new Date(a.createdAt).toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Linha do tempo da brigada
                      </h3>
                      <p className="text-[11px] text-emerald-200/80">
                        Acompanhe as últimas ações registradas em campo.
                      </p>
                    </div>
                  </div>
                  {brigadeActions.length === 0 ? (
                    <p className="text-[11px] text-emerald-200/80">
                      Nenhuma ação registrada ainda. Plantios, inspeções e alertas
                      aparecerão aqui em ordem cronológica.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-[11px] max-h-56 overflow-y-auto pr-1">
                      {brigadeActions.map((a) => {
                        let label = "Ação"
                        let color = "text-emerald-300"
                        if (a.type === "planting") {
                          label = "Plantio"
                          color = "text-emerald-300"
                        } else if (a.type === "inspection") {
                          label = "Inspeção"
                          color = "text-sky-300"
                        } else if (a.type === "fire_alert") {
                          label = "Alerta de fogo"
                          color = "text-amber-300"
                        }

                        return (
                          <li
                            key={a.id}
                            className="border border-emerald-800/60 rounded-lg px-3 py-2 bg-slate-950/80"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-semibold ${color}`}>{label}</p>
                              <p className="text-[10px] text-emerald-200/70">
                                {new Date(a.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            {a.description && (
                              <p className="mt-1 text-emerald-200/80">
                                {a.description}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-emerald-300/90">
                              {a.brigadistName
                                ? `Responsável: ${a.brigadistName}`
                                : "Responsável: não informado"}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
        <button
          onClick={() => setShowCarbonModal(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-emerald-950 text-xs shadow-lg hover:bg-emerald-400"
        >
          <span>Calculadora de carbono</span>
        </button>
        {showCarbonModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-4xl mx-4 bg-slate-950 border border-emerald-800 rounded-2xl p-5 relative">
              <button
                onClick={() => setShowCarbonModal(false)}
                className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full border border-emerald-700 text-emerald-200 hover:bg-emerald-900/60"
              >
                Fechar
              </button>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-100">
                    Calculadora de carbono
                  </h2>
                  <p className="text-[11px] text-emerald-200/80 max-w-xl">
                    Faça o cálculo das suas emissões anuais e veja sugestões de
                    árvores e produtos para compensar dentro da própria
                    plataforma.
                  </p>
                </div>
                <div className="text-right text-[11px] text-emerald-200/80">
                  <p>1 árvore ≈ 0,15 t de CO₂ compensadas.</p>
                  <p>Valores aproximados, apenas para orientação.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-[11px]">
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
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-950/70 border border-emerald-800 rounded-2xl p-4 space-y-2 text-[11px] text-emerald-200/80">
                    <p className="font-semibold text-emerald-100 text-sm">
                      Resultado estimado
                    </p>
                    <p>
                      Emissões anuais aproximadas:
                      <span className="ml-1 font-semibold text-emerald-300 text-base">
                        {annualTotalTons.toFixed(2)} t CO₂/ano
                      </span>
                    </p>
                    <p>
                      Número sugerido de árvores para compensar:
                      <span className="ml-1 font-semibold text-emerald-300 text-base">
                        {suggestedTrees}
                      </span>
                    </p>
                    {suggestedTrees > 0 && (
                      <p>
                        Isso equivale a aproximadamente{" "}
                        <span className="font-semibold">
                          {(suggestedTrees * treeCo2CapacityTons).toFixed(2)} t
                        </span>{" "}
                        de CO₂ compensadas ao longo da vida das árvores.
                      </p>
                    )}
                  </div>
                  <div className="bg-slate-950/70 border border-emerald-800 rounded-2xl p-4 space-y-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-emerald-100 text-sm">
                        Sugestões de compra para compensar
                      </p>
                      <p className="text-emerald-200/70">
                        Produtos e árvores em destaque.
                      </p>
                    </div>
                    {suggestionItems.length === 0 ? (
                      <p className="text-emerald-200/80">
                        Informe seus dados acima para ver sugestões de árvores e
                        produtos que compensam sua pegada.
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
                            <button
                              onClick={() => {
                                setSelectedQuantities((prev) => ({
                                  ...prev,
                                  [item.product.id]:
                                    (prev[item.product.id] ?? 0) + item.units
                                }))
                                setActiveSection("store")
                                setShowCarbonModal(false)
                              }}
                              className="mt-3 text-xs px-3 py-1.5 rounded-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                            >
                              Adicionar ao carrinho verde
                            </button>
                            <p className="mt-2 text-[10px] text-emerald-200/80">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
                {techModalSpecies?.imageUrl && (
                  <div className="w-full md:w-40 h-32 md:h-40 rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={getImageUrl(techModalSpecies.imageUrl)}
                      alt={techModalSpecies.commonName || techModalProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2 text-sm">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-100">
                      {techModalProduct.name}
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
                    {techModalProduct.projectName && (
                      <p className="text-[11px] text-emerald-200/80">
                        Projeto ligado: {techModalProduct.projectName}
                      </p>
                    )}
                  </div>
                  {techModalProduct.description && (
                    <p className="text-[11px] text-emerald-200/80">
                      {techModalProduct.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-[11px] text-emerald-200/80">
                    <div>
                      <p className="text-emerald-300/90">Preço</p>
                      <p className="text-base font-semibold text-emerald-100">
                        R$ {techModalProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-300/90">Cashback de carbono</p>
                      <p className="text-base font-semibold text-sky-300">
                        {(techModalProduct.carbonCashbackKg / 1000).toFixed(2)} t
                        CO₂
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    Ao comprar esta árvore, você apoia um projeto de floresta e
                    acumula créditos verdes que podem ser usados na própria
                    plataforma.
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
