#!/usr/bin/env python3
"""API Load Tester — HTTP load testing with configurable concurrency and latency reporting."""

import json
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class LoadTestResult:
    total_requests: int = 0
    successful: int = 0
    failed: int = 0
    errors: dict = field(default_factory=dict)
    latencies: list[float] = field(default_factory=list)
    status_codes: dict = field(default_factory=lambda: defaultdict(int))
    start_time: float = 0
    end_time: float = 0

    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

    @property
    def rps(self) -> float:
        return self.total_requests / self.duration if self.duration > 0 else 0

    def median_latency(self) -> float:
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        n = len(sorted_lat)
        return sorted_lat[n // 2]

    def p95_latency(self) -> float:
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.95)
        return sorted_lat[min(idx, len(sorted_lat) - 1)]

    def p99_latency(self) -> float:
        if not self.latencies:
            return 0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.99)
        return sorted_lat[min(idx, len(sorted_lat) - 1)]


def make_request(url: str, method: str = "GET", headers: Optional[dict] = None,
                 body: Optional[str] = None, timeout: int = 30) -> tuple[float, int, str]:
    """Make a single HTTP request. Returns (latency_ms, status_code, error_message)."""
    start = time.perf_counter()

    try:
        req = urllib.request.Request(url, method=method, data=body.encode() if body else None)
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)

        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency = (time.perf_counter() - start) * 1000
            return latency, resp.status, ""
    except urllib.error.HTTPError as e:
        latency = (time.perf_counter() - start) * 1000
        return latency, e.code, ""
    except urllib.error.URLError as e:
        latency = (time.perf_counter() - start) * 1000
        return 0, 0, str(e.reason)
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000
        return 0, 0, str(e)


def run_load_test(url: str, method: str, headers: Optional[dict], body: Optional[str],
                  concurrency: int, duration_sec: int, timeout: int) -> LoadTestResult:
    """Run concurrent load test for specified duration."""
    result = LoadTestResult()
    result.start_time = time.perf_counter()

    import threading
    active_threads = threading.Semaphore(concurrency)
    done = threading.Event()
    lock = threading.Lock()
    request_count = [0]  # mutable container for closure

    def worker():
        while not done.is_set():
            active_threads.acquire()
            if done.is_set():
                active_threads.release()
                break

            latency, status, error = make_request(url, method, headers, body, timeout)

            with lock:
                request_count[0] += 1
                result.total_requests += 1
                result.latencies.append(latency)
                result.status_codes[status] += 1

                if status >= 200 and status < 400:
                    result.successful += 1
                elif status >= 400:
                    result.failed += 1
                    if status not in result.errors:
                        result.errors[status] = 0
                    result.errors[status] += 1
                else:
                    result.failed += 1
                    if error not in result.errors:
                        result.errors[error] = 0
                    result.errors[error] += 1

            active_threads.release()

    threads = [threading.Thread(target=worker, daemon=True) for _ in range(concurrency)]
    for t in threads:
        t.start()

    # Let threads run for duration
    time.sleep(duration_sec)
    done.set()

    for t in threads:
        t.join(timeout=2)

    result.end_time = time.perf_counter()
    return result


def print_report(result: LoadTestResult, url: str, output_format: str = "text"):
    if output_format == "json":
        print(json.dumps({
            "url": url,
            "duration_sec": round(result.duration, 2),
            "total_requests": result.total_requests,
            "successful": result.successful,
            "failed": result.failed,
            "rps": round(result.rps, 2),
            "latency": {
                "median_ms": round(result.median_latency(), 2),
                "p95_ms": round(result.p95_latency(), 2),
                "p99_ms": round(result.p99_latency(), 2),
                "min_ms": round(min(result.latencies), 2) if result.latencies else 0,
                "max_ms": round(max(result.latencies), 2) if result.latencies else 0,
            },
            "status_codes": dict(result.status_codes),
            "errors": result.errors,
        }, indent=2))
        return

    print(f"\n{'='*60}")
    print(f"Load Test Report — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    print(f"\n  URL:       {url}")
    print(f"  Duration:  {result.duration:.2f}s")
    print(f"  Concurrency: {concurrency}")
    print(f"\n  Throughput:")
    print(f"    Total requests:  {result.total_requests}")
    print(f"    Successful:      {result.successful}")
    print(f"    Failed:           {result.failed}")
    print(f"    RPS:              {result.rps:.2f} req/sec")

    if result.latencies:
        print(f"\n  Latency:")
        print(f"    Median:   {result.median_latency():.1f}ms")
        print(f"    P95:      {result.p95_latency():.1f}ms")
        print(f"    P99:      {result.p99_latency():.1f}ms")
        print(f"    Min:      {min(result.latencies):.1f}ms")
        print(f"    Max:      {max(result.latencies):.1f}ms")

    if result.status_codes:
        print(f"\n  Status Codes:")
        for code, count in sorted(result.status_codes.items()):
            pct = (count / result.total_requests * 100) if result.total_requests else 0
            print(f"    {code}: {count} ({pct:.1f}%)")

    if result.errors:
        print(f"\n  Errors:")
        for err, count in result.errors.items():
            print(f"    {err}: {count}")

    # Health assessment
    print(f"\n  Assessment:", end=" ")
    error_rate = result.failed / result.total_requests if result.total_requests else 0
    if error_rate == 0 and result.p95_latency() < 200:
        print("HEALTHY")
    elif error_rate < 0.05 and result.p95_latency() < 500:
        print("ACCEPTABLE")
    elif error_rate < 0.1:
        print("DEGRADED")
    else:
        print("UNHEALTHY")

    print()


concurrency = 50
duration_sec = 30
output_format = "text"
url = ""
method = "GET"
headers = {}
body = None
timeout = 30


def main():
    global concurrency, duration_sec, output_format, url, method, headers, body, timeout

    import argparse

    parser = argparse.ArgumentParser(description="HTTP Load Tester")
    parser.add_argument("url", help="URL to test")
    parser.add_argument("--method", default="GET", help="HTTP method")
    parser.add_argument("--header", action="append", help="Add header (format: 'Key: Value')")
    parser.add_argument("--body", help="Request body (JSON string)")
    parser.add_argument("--concurrency", type=int, default=50, help="Concurrent requests")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout in seconds")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    concurrency = args.concurrency
    duration_sec = args.duration
    output_format = args.format
    timeout = args.timeout
    url = args.url
    method = args.method

    if args.header:
        for h in args.header:
            if ":" in h:
                k, v = h.split(":", 1)
                headers[k.strip()] = v.strip()

    body = args.body

    print(f"[*] Starting load test: {method} {url}")
    print(f"[*] Concurrency: {concurrency}, Duration: {duration_sec}s")

    result = run_load_test(url, method, headers or None, body, concurrency, duration_sec, timeout)
    print_report(result, url, output_format)


if __name__ == "__main__":
    main()
