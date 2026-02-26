export class TreeChatMessageDto {
  role: "user" | "assistant"
  content: string
}

export class TreeChatRequestDto {
  treeId: string
  message: string
  species?: string
  locationDescription?: string
  history?: TreeChatMessageDto[]
}

export class TreeChatResponseDto {
  treeId: string
  response: string
  sentiment: string
  provider: string
}

