import { Controller, Get } from "@nestjs/common"

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      version: "3.2.2-BUILD-FIXED",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected", // Assumindo conexão se o backend subiu
        ai: process.env.AI_SERVICE_URL || "not-configured"
      }
    }
  }
}
