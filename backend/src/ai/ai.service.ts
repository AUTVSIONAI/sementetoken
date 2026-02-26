import { Injectable } from "@nestjs/common"
import axios from "axios"
import { TreeChatRequestDto, TreeChatResponseDto } from "./ai.dto"

@Injectable()
export class AiService {
  async chatWithTree(payload: TreeChatRequestDto): Promise<TreeChatResponseDto> {
    const baseUrl = process.env.AI_SERVICE_URL || "http://localhost:8000"

    const body: any = {
      tree_id: payload.treeId,
      message: payload.message,
      species: payload.species,
      location_description: payload.locationDescription,
      history: payload.history
        ? payload.history.map((m) => ({
            role: m.role,
            content: m.content
          }))
        : []
    }

    const response = await axios.post(`${baseUrl}/chat`, body, {
      timeout: 30000
    })

    const data = response.data

    return {
      treeId: data.tree_id,
      response: data.response,
      sentiment: data.sentiment,
      provider: data.provider
    }
  }
}

