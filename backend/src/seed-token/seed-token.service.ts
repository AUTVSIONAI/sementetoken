import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { SeedTransaction } from "./seed-transaction.entity"
import { Wallet } from "../wallet/wallet.entity"
import { User } from "../users/user.entity"
import { Tree, TreeStatus } from "../trees/tree.entity"
import { WalletService } from "../wallet/wallet.service"
import { PolygonService } from "./polygon.service"
import * as fs from "fs"
import * as path from "path"

type NftAttribute = {
  trait_type: string
  value: string
}

type NftMetadata = {
  name: string
  description: string
  image: string
  attributes: NftAttribute[]
}

@Injectable()
export class SeedTokenService {
  private readonly logger = new Logger(SeedTokenService.name)

  constructor(
    @InjectRepository(SeedTransaction)
    private readonly seedTransactionsRepository: Repository<SeedTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    private readonly walletService: WalletService,
    private readonly polygonService: PolygonService
  ) {}

  async mintForTree(userId: string, treeId: string, amount: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error("Usuário não encontrado para Semente Token")
    }

    const tree = await this.treesRepository.findOne({
      where: { id: treeId },
      relations: { project: true, speciesType: true } as any
    })
    if (!tree) {
      throw new Error("Árvore não encontrada para Semente Token")
    }

    if (tree.status !== TreeStatus.VALIDATED) {
      throw new Error("A árvore precisa estar validada (status=validated) para gerar o NFT.")
    }

    const metadataId = tree.id
    const metadata = this.buildMetadata(metadataId, tree)
    const tokenUri = this.buildPublicTokenUri(metadataId)

    await this.writeMetadataFile(metadataId, metadata)
    this.logger.log(
      `Metadata OK | treeId=${metadataId} | image=${metadata.image || "N/A"} | tokenURI=${tokenUri}`
    )

    const address = user.email
    const mintResult = await this.polygonService.mintTreeToken({
      userAddress: address,
      treeId: tree.id,
      metadataUri: tokenUri
    })

    await this.walletService.adjustSeedBalance(userId, amount)

    const tx = this.seedTransactionsRepository.create({
      user,
      amount,
      txId: mintResult.txId,
      status: "confirmed"
    } as any)

    await this.seedTransactionsRepository.save(tx)

    tree.nftId = mintResult.txId
    tree.status = TreeStatus.MINTED
    tree.txHash = mintResult.txId
    await this.treesRepository.save(tree)

    this.logger.log(
      `Mint OK | treeId=${metadataId} | user=${userId} | to=${address} | txId=${mintResult.txId}`
    )

    return mintResult
  }

  private buildPublicTokenUri(metadataId: string): string {
    const publicBase =
      (process.env.PUBLIC_API_URL ||
        process.env.API_PUBLIC_URL ||
        process.env.PUBLIC_BASE_URL ||
        "")?.replace(/\/+$/, "") ?? ""

    const filename = `${encodeURIComponent(metadataId)}.json`
    return publicBase ? `${publicBase}/metadata/${filename}` : `/metadata/${filename}`
  }

  private async writeMetadataFile(metadataId: string, metadata: NftMetadata): Promise<void> {
    const filePath = path.join(process.cwd(), "uploads", "metadata", `${metadataId}.json`)
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2), "utf-8")
  }

  private buildMetadata(metadataId: string, tree: Tree): NftMetadata {
    const { latitude, longitude } = this.extractLatLon(tree.location)

    const species =
      (tree as any).speciesType?.commonName ||
      (tree as any).speciesType?.scientificName ||
      tree.species ||
      ""

    const projectName = (tree as any).project?.name || ""

    const plantedAt =
      tree.plantedAt instanceof Date
        ? tree.plantedAt.toISOString()
        : tree.plantedAt
          ? new Date(tree.plantedAt as any).toISOString()
          : null

    const image = this.normalizePublicImageUrl(tree.imageUrl || tree.photoUrl || "")

    const attributes: NftAttribute[] = [
      { trait_type: "Latitude", value: latitude ?? "" },
      { trait_type: "Longitude", value: longitude ?? "" },
      { trait_type: "Tree ID", value: tree.id || metadataId },
      { trait_type: "Project", value: projectName },
      { trait_type: "Date", value: plantedAt ? plantedAt.split("T")[0] : "" }
    ]

    if (species) {
      attributes.push({ trait_type: "Species", value: species })
    }

    return {
      name: `Tree #${metadataId}`,
      description: "Árvore plantada via SementeToken",
      image,
      attributes
    }
  }

  private extractLatLon(location: any): { latitude: string | null; longitude: string | null } {
    if (!location) {
      return { latitude: null, longitude: null }
    }

    const coords = location?.coordinates
    if (Array.isArray(coords) && coords.length >= 2) {
      const [lon, lat] = coords
      return {
        latitude: typeof lat === "number" ? lat.toString() : lat ?? null,
        longitude: typeof lon === "number" ? lon.toString() : lon ?? null
      }
    }

    const lat = location?.lat ?? location?.latitude ?? null
    const lon = location?.lon ?? location?.lng ?? location?.longitude ?? null
    return {
      latitude: lat != null ? String(lat) : null,
      longitude: lon != null ? String(lon) : null
    }
  }

  private normalizePublicImageUrl(input: string): string {
    const url = (input || "").trim()
    if (!url) return ""

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ipfs://")) {
      return url
    }

    const publicBase = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "")
    const normalizedPath = url.startsWith("/") ? url : `/${url}`

    if (normalizedPath.startsWith("/uploads/")) {
      return publicBase ? `${publicBase}/api${normalizedPath}` : `/api${normalizedPath}`
    }

    if (normalizedPath.startsWith("/api/uploads/")) {
      return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
    }

    return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
  }
}

