import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { SemeService } from "./seme.service"
import { ethers } from "ethers"

@Injectable()
export class SemeListenerService implements OnModuleInit {
  private readonly logger = new Logger(SemeListenerService.name)
  private provider: ethers.providers.JsonRpcProvider | null = null
  private treeContract: ethers.Contract | null = null
  private nftContract: ethers.Contract | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly semeService: SemeService
  ) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>("POLYGON_RPC")
    const treeAddress = this.configService.get<string>("TREE_ADDRESS")
    const nftAddress = this.configService.get<string>("NFT_ADDRESS")

    if (!rpcUrl || !treeAddress || !nftAddress) {
      this.logger.warn(
        "POLYGON_RPC, TREE_ADDRESS ou NFT_ADDRESS não configurados. Listener SEME desativado."
      )
      return
    }

    try {
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)

      // Tree Contract Listener
      const treeAbi = ["event TreePlanted(address indexed user, uint256 amount)"]

      this.treeContract = new ethers.Contract(treeAddress, treeAbi, this.provider)

      this.treeContract.on(
        "TreePlanted",
        async (user: string, amount: ethers.BigNumber, event: ethers.Event) => {
          try {
            const amountSeme = ethers.utils.formatUnits(amount, 18)
            const treesEquivalent = Math.floor(parseFloat(amountSeme))

            await this.semeService.recordFromEvent({
              walletAddress: user,
              amountSeme,
              treesEquivalent,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber
            })

            this.logger.log(
              `Registrada TreePlanted para ${user} | SEME: ${amountSeme} | tx: ${event.transactionHash} | block: ${event.blockNumber}`
            )
          } catch (err) {
            this.logger.error(
              `Erro ao processar evento TreePlanted: ${(err as Error).message}`
            )
          }
        }
      )

      // NFT Contract Listener
      const nftAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ]

      this.nftContract = new ethers.Contract(nftAddress, nftAbi, this.provider)

      this.nftContract.on(
        "Transfer",
        async (
          from: string,
          to: string,
          tokenId: ethers.BigNumber,
          event: ethers.Event
        ) => {
          // Em ethers v5, AddressZero é constante
          if (from === ethers.constants.AddressZero) {
            try {
              const tokenIdStr = tokenId.toString()
              await this.semeService.recordNftMint(tokenIdStr, to, event.blockNumber)
              this.logger.log(`NFT Mint capturado: ID ${tokenIdStr} para ${to} | block: ${event.blockNumber}`)
            } catch (err) {
              this.logger.error(
                `Erro ao registrar NFT Mint: ${(err as Error).message}`
              )
            }
          }
        }
      )

      this.logger.log(
        "Listeners TreePlanted e NFT Transfer iniciados com sucesso."
      )
    } catch (err) {
      this.logger.error(`Falha ao iniciar listeners: ${(err as Error).message}`)
    }
  }
}
