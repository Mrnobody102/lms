import { Controller, Post, Body, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
  ): Promise<any> {
    const tenantId = req.tenantId;
    return this.authService.register({ ...registerDto, tenantId });
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }
}
