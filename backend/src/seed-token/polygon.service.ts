import { Injectable, Logger } from "@nestjs/common"

type MintTreeTokenPayload = {
  userAddress: string
  treeId: string
  metadataUri?: string
}

type MintTreeTokenResult = {
  txId: string
}

@Injectable()
export class PolygonService {
  private readonly logger = new Logger(PolygonService.name)

  async mintTreeToken(payload: MintTreeTokenPayload): Promise<MintTreeTokenResult> {
    this.logger.log(
      `mintTreeToken | treeId=${payload.treeId} | to=${payload.userAddress} | tokenURI=${payload.metadataUri || "N/A"}`
    )
    const fakeTxId = `polygon-tx-${payload.treeId}-${Date.now()}`
    return { txId: fakeTxId }
  }
}

