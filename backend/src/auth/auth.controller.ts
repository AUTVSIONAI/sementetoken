import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { LoginDto, RegisterDto, TokenResponseDto } from "./auth.dto"
import { JwtAuthGuard } from "./jwt-auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto): Promise<TokenResponseDto> {
    return this.authService.register(body)
  }

  @Post("login")
  login(@Body() body: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(body)
  }

  @Post("refresh")
  refresh(@Body("refreshToken") refreshToken: string): Promise<TokenResponseDto> {
    return this.authService.refresh(refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: any) {
    return req.user
  }
}
