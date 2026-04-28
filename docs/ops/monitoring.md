# Monitoring And Health Checks

Use the dedicated health endpoints for automation and keep human reference material out of probe responses.

## Machine-Readable Endpoints

| Endpoint                             | Use                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `GET /api/health/live`               | Liveness probe. Use this to check whether the API process is alive.               |
| `GET /api/health/ready`              | Readiness probe. Use this before routing traffic; it checks database and Redis.   |
| `GET /api/health/metrics`            | Basic in-memory request counters and latency summary by API group.                |
| `GET /api/health/metrics/prometheus` | Prometheus text exposition for request, error, readiness, and dependency metrics. |

`GET /api/health` remains a backward-compatible readiness alias.

## Human Reference

`GET /api/health/docs` returns a compact reference for operators. The longer runbook is this file.

Recommended checks:

- Alert when `/api/health/ready` returns `status != "ok"`.
- Track `checks.database.latencyMs` and Redis failures.
- Track `totalRequests`, `statusCounts`, and `averageDurationMs` from `/api/health/metrics`.
- Use `x-request-id` from API responses to correlate user reports with backend logs.

## Prometheus Alert Examples

```yaml
groups:
  - name: lms-api
    rules:
      - alert: LmsApiReadinessFailing
        expr: increase(lms_health_readiness_checks_total{status="unhealthy"}[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: LMS API readiness is failing
          description: One or more API readiness checks failed in the last 5 minutes.

      - alert: LmsApiDependencyDown
        expr: lms_health_dependency_status{status="down"} == 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: LMS API dependency is not ready
          description: Dependency {{ $labels.dependency }} last reported status {{ $labels.status }}.

      - alert: LmsApiHighServerErrorRate
        expr: |
          sum(rate(lms_http_request_errors_total{status_class="5xx"}[5m]))
            / clamp_min(sum(rate(lms_http_requests_total[5m])), 1) > 0.02
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: LMS API 5xx rate is above 2%
          description: Server-side request error rate has been above 2% for 10 minutes.
```
