import { Body, Controller, Post } from "@nestjs/common"
import { AiService } from "./ai.service"
import { TreeChatRequestDto, TreeChatResponseDto } from "./ai.dto"

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("chat")
  chat(@Body() body: TreeChatRequestDto): Promise<TreeChatResponseDto> {
    return this.aiService.chatWithTree(body)
  }
}

