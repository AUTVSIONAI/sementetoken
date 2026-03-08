import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"

type JwtPayload = {
  sub: string
  email: string
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "supersecretkey"
    })
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      id: payload.sub, // Adicionado para compatibilidade com frontend que espera .id
      email: payload.email,
      role: payload.role
    }
  }
}

