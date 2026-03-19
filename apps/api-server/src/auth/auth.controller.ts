import { Controller, Post, Body, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private _authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({ status: 409, description: "Conflict - email already exists" })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.tenantId;
    return this._authService.register({ ...registerDto, tenantId });
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this._authService.login(loginDto);
  }
}
