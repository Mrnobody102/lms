# Security And Compliance Checklist

This checklist is the Batch 17 launch baseline.

## Edge And Tenant Boundary

- Only Caddy exposes public `80/443`.
- App ports are internal Docker `expose` entries, not public `ports`.
- Caddy strips `x-tenant-id` from public requests.
- `ALLOW_TENANT_HEADER_IN_PRODUCTION=false` unless a trusted internal edge injects tenant context or a managed frontend origin is explicitly allowlisted.
- Production tenant resolution should come from domain/origin. Frontend tenant hints are allowed only for trusted managed-hosting origins with exact `CORS_ORIGINS`, never with wildcard CORS.

## Browser Security

- `CORS_ORIGINS` contains exact origins only, no wildcards and no path/query/hash.
- `AUTH_COOKIE_DOMAIN` is the shared root domain when API and portals use subdomains.
- `AUTH_COOKIE_SAME_SITE=lax` for same-site subdomains; use `none` only for intentional cross-site deployments over HTTPS.
- CSRF middleware remains enabled for browser cookie mutations.
- Security headers are set by API Helmet and Caddy baseline headers.

## Rate Limit And WAF Stance

Caddy standard image does not provide a built-in WAF. For production, add one of:

- upstream cloud WAF/rate limit in front of Caddy
- Caddy rate-limit/WAF plugin image
- managed load balancer policy

Minimum protected areas:

- auth login/register/forgot/reset
- media upload/signing endpoints
- AI/provider-backed endpoints
- public catalog search/list
- admin/super-admin mutations

## Secrets

- Run `pnpm run check:secrets` before release.
- Do not expose AI/provider/server keys through `NEXT_PUBLIC_*`.
- Use real `JWT_SECRET` and `JWT_RESET_SECRET`, each at least 32 characters.
- Store `.env.production` in a secret manager or deployment platform, not in git.

## Auditability

Sensitive mutations should emit audit logs or have a documented exception:

- tenant lifecycle
- role/status changes
- enrollment changes
- course publish/unpublish
- certificate issue/revoke
- billing/payment changes
- media upload status changes
