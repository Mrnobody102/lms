import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  
  // Basic logic to handle localhost vs production domains
  const currentHost = hostname.replace(`.lms.com`, "").replace(".localhost:3000", ""); // Adjust port if needed

  const response = NextResponse.next();
  // Inject into header for backend or downstream components
  response.headers.set("x-tenant-id", currentHost);
  return response;
}
