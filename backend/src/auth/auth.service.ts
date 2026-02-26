import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcryptjs"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { User, UserRole } from "../users/user.entity"
import { LoginDto, RegisterDto, TokenResponseDto } from "./auth.dto"

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(payload: RegisterDto): Promise<TokenResponseDto> {
    const existing = await this.usersRepository.findOne({
      where: { email: payload.email }
    })
    if (existing) {
      throw new UnauthorizedException("Email já cadastrado")
    }

    const passwordHash = await bcrypt.hash(payload.password, 10)
    const adminEmail = process.env.ADMIN_EMAIL
    const role =
      adminEmail && adminEmail.toLowerCase() === payload.email.toLowerCase()
        ? UserRole.ADMIN
        : UserRole.USER
    const user = this.usersRepository.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      role
    })
    await this.usersRepository.save(user)

    return this.generateTokens(user)
  }

  async login(payload: LoginDto): Promise<TokenResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { email: payload.email }
    })
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas")
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException("Credenciais inválidas")
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (
      adminEmail &&
      adminEmail.toLowerCase() === user.email.toLowerCase() &&
      user.role !== UserRole.ADMIN
    ) {
      user.role = UserRole.ADMIN
      await this.usersRepository.save(user)
    }

    return this.generateTokens(user)
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "refreshsecret"
      }) as { sub: string }

      const user = await this.usersRepository.findOne({
        where: { id: decoded.sub }
      })
      if (!user) {
        throw new UnauthorizedException()
      }
      return this.generateTokens(user)
    } catch {
      throw new UnauthorizedException("Refresh token inválido")
    }
  }

  private generateTokens(user: User): TokenResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || "supersecretkey",
      expiresIn: "15m"
    })

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || "refreshsecret",
        expiresIn: "7d"
      }
    )

    return { accessToken, refreshToken }
  }
}
