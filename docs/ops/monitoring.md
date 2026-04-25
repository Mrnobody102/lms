# Monitoring And Health Checks

Use the dedicated health endpoints for automation and keep human reference material out of probe responses.

## Machine-Readable Endpoints

| Endpoint                  | Use                                                                             |
| ------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/health/live`    | Liveness probe. Use this to check whether the API process is alive.             |
| `GET /api/health/ready`   | Readiness probe. Use this before routing traffic; it checks database and Redis. |
| `GET /api/health/metrics` | Basic in-memory request counters and latency summary by API group.              |

`GET /api/health` remains a backward-compatible readiness alias.

## Human Reference

`GET /api/health/docs` returns a compact reference for operators. The longer runbook is this file.

Recommended checks:

- Alert when `/api/health/ready` returns `status != "ok"`.
- Track `checks.database.latencyMs` and Redis failures.
- Track `totalRequests`, `statusCounts`, and `averageDurationMs` from `/api/health/metrics`.
- Use `x-request-id` from API responses to correlate user reports with backend logs.
