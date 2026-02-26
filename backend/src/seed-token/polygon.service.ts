import { Injectable } from "@nestjs/common"

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
  async mintTreeToken(payload: MintTreeTokenPayload): Promise<MintTreeTokenResult> {
    const fakeTxId = `polygon-tx-${payload.treeId}-${Date.now()}`
    return { txId: fakeTxId }
  }
}

