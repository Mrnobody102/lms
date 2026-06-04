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

Starter config files are available in `deployment/production/monitoring/`:

- `prometheus.yml` scrapes `/api/health/metrics/prometheus` from the API service.
- `alert-rules.yml` contains readiness, dependency, server error rate, and readiness latency alerts.
- `alertmanager.yml` sends to `ALERTMANAGER_WEBHOOK_URL`; this env must point to a real incident/chatops webhook before production use.

The production compose stack runs Prometheus and Alertmanager on the internal Docker network. Do not expose `9090` or `9093` directly to the public internet. Use an SSH tunnel, private VPN, or a managed metrics service for operator access.

Validate the monitoring config before deployment:

```bash
docker compose -f deployment/production/docker-compose.prod.yml config --quiet
```

Send a test alert after staging deploy:

```bash
curl -XPOST https://<alertmanager-private-host>/api/v2/alerts \
  -H 'Content-Type: application/json' \
  -d '[{"labels":{"alertname":"LmsTestAlert","service":"api-server","severity":"info"},"annotations":{"summary":"LMS test alert"}}]'
```

Incident trace workflow:

1. Copy the `x-request-id` from the failing API response or frontend error report.
2. Search API logs for the same request id.
3. Check `/api/health/ready` and Prometheus alerts for dependency/readiness failures in the same time window.
4. Use the tenant id from logs only for internal debugging; never ask users to provide or trust `x-tenant-id` from public requests.

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
