# Senior Backend: Security Practices

## JWT Configuration

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
```

## Password Hashing

```typescript
// Use bcrypt with cost factor 12
import * as bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}
```

## Rate Limiting

```typescript
// main.ts
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

app.use(helmet());

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  }),
);

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

## OWASP Top 10 Checklist

| #   | Category                    | Mitigation                                                     |
| --- | --------------------------- | -------------------------------------------------------------- |
| A01 | Broken Access Control       | Role guards on every endpoint; verify tenantId on all queries  |
| A02 | Cryptographic Failures      | Use bcrypt (cost 12); HTTPS everywhere; JWT RS256 preferred    |
| A03 | Injection                   | ValidationPipe with whitelist; Prisma parameterized queries    |
| A04 | Insecure Design             | Threat model new features; principle of least privilege        |
| A05 | Security Misconfiguration   | Helmet headers; rate limiting; disable stack traces in prod    |
| A06 | Vulnerable Components       | Audit deps regularly (`pnpm audit`)                            |
| A07 | Auth Failures               | JWT expiry < 24h; refresh token rotation; password min 8 chars |
| A08 | Software Integrity Failures | Verify npm package integrity; pin CI dependencies              |
| A09 | Logging Failures            | Log all auth events; include requestId for traceability        |
| A10 | SSRF                        | Validate URLs; disallow internal IPs in user-provided URLs     |
