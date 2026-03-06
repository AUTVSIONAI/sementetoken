import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common"
import axios from "axios"
import { TreeChatRequestDto, TreeChatResponseDto } from "./ai.dto"

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  async chatWithTree(payload: TreeChatRequestDto): Promise<TreeChatResponseDto> {
    const baseUrl = process.env.AI_SERVICE_URL || "http://ai-service:8000"

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

    try {
      this.logger.log(`Enviando mensagem para AI Service em ${baseUrl}/chat...`)
      const response = await axios.post(`${baseUrl}/chat`, body, {
        timeout: 30000
      })

      const data = response.data
      this.logger.debug(`Resposta recebida do AI Service: ${JSON.stringify(data)}`)

      return {
        treeId: data.tree_id,
        response: data.response,
        sentiment: data.sentiment,
        provider: data.provider
      }
    } catch (error) {
      this.logger.error(`Erro ao comunicar com AI Service: ${error.message}`, error.response?.data)
      throw new HttpException(
        error.response?.data?.detail || "Erro ao processar resposta da IA",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}

