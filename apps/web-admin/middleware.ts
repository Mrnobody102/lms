import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  
  const currentHost = hostname.replace(`.lms.com`, "").replace(".localhost:3000", "");

  const response = NextResponse.next();
  response.headers.set("x-tenant-id", currentHost);
  return response;
}
