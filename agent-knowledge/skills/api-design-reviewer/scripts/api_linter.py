#!/usr/bin/env python3
"""API Design Linter — Analyzes NestJS controller files for REST convention violations."""

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class LintResult:
    severity: str  # ERROR, WARNING, INFO
    file: str
    line: int
    rule: str
    message: str

    def to_dict(self):
        return {
            "severity": self.severity,
            "file": self.file,
            "line": self.line,
            "rule": self.rule,
            "message": self.message,
        }


@dataclass
class LintReport:
    results: list[LintResult] = field(default_factory=list)
    file_count: int = 0

    def add(self, severity: str, file: str, line: int, rule: str, message: str):
        self.results.append(LintResult(severity, file, line, rule, message))

    def print_summary(self, output_format: str = "text"):
        if output_format == "json":
            print(json.dumps({"results": [r.to_dict() for r in self.results], "total": len(self.results)}, indent=2))
            return

        if not self.results:
            print("[OK] No API design violations found.")
            return

        print(f"\n{'='*60}")
        print(f"API Design Linter — {len(self.results)} issue(s) in {self.file_count} file(s)")
        print(f"{'='*60}\n")

        for r in self.results:
            icon = {"ERROR": "[X]", "WARNING": "[!]", "INFO": "[i]"}[r.severity]
            print(f"  {icon} {r.file}:{r.line}")
            print(f"      [{r.rule}] {r.message}\n")

        errors = sum(1 for r in self.results if r.severity == "ERROR")
        warnings = sum(1 for r in self.results if r.severity == "WARNING")
        print(f"  Total: {errors} error(s), {warnings} warning(s)\n")


def lint_controller_file(path: Path) -> list[LintResult]:
    """Lint a single NestJS controller file."""
    results: list[LintResult] = []
    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()
    file = str(path)

    # Check 1: Every method should have @ApiOperation
    has_swagger_operation = bool(re.search(r"@ApiOperation\s*\(", content))
    has_swagger_property = bool(re.search(r"@ApiProperty", content))
    has_swagger_response = bool(re.search(r"@ApiResponse", content))

    if not has_swagger_operation:
        for i, line in enumerate(lines, 1):
            if re.match(r"\s+(get|post|put|patch|delete|head|options)\w*\s*\(", line, re.IGNORECASE):
                results.append(LintResult("ERROR", file, i, "MISSING_API_OPERATION",
                    "HTTP method handler missing @ApiOperation decorator"))
                break

    if not has_swagger_property:
        results.append(LintResult("WARNING", file, 1, "MISSING_API_PROPERTY",
            "No @ApiProperty decorators found — DTOs should have Swagger documentation"))

    if not has_swagger_response:
        results.append(LintResult("WARNING", file, 1, "MISSING_API_RESPONSE",
            "No @ApiResponse decorators found — endpoints should document responses"))

    # Check 2: Resource naming (kebab-case for routes)
    route_decorators = re.finditer(r"@(Get|Post|Put|Patch|Delete)\s*\(\s*['\"]([^'\"]+)['\"]", content)
    for match in route_decorators:
        method = match.group(1)
        route = match.group(2)
        line_num = content[:match.start()].count("\n") + 1

        # Check for kebab-case
        if re.search(r"[a-z][A-Z]", route):
            results.append(LintResult("WARNING", file, line_num, "NAMING_CASE",
                f"Route '{route}' should use kebab-case (use 'user-profiles' not 'userProfiles')"))

        # Check for verbs in route (REST anti-pattern)
        verb_patterns = ["get-", "create-", "update-", "delete-", "fetch-", "list-"]
        if any(route.startswith(v) for v in verb_patterns):
            results.append(LintResult("WARNING", file, line_num, "VERB_IN_ROUTE",
                f"Route '{route}' contains verb — REST resources should be nouns"))

        # POST without route is often wrong
        if method == "Post" and route == "":
            results.append(LintResult("WARNING", file, line_num, "EMPTY_POST_ROUTE",
                "POST to root route — consider if a sub-resource route is more appropriate"))

    # Check 3: Logic in Controller (should be in Service)
    for i, line in enumerate(lines, 1):
        if re.match(r"\s+@Get|@Post|@Put|@Patch|@Delete", line):
            method_indent = len(line) - len(line.lstrip())
            # Check next ~20 lines for Prisma queries or business logic in controller
            method_block = "\n".join(lines[i:min(i + 25, len(lines))])
            if re.search(r"this\.prisma\.", method_block):
                results.append(LintResult("ERROR", file, i, "LOGIC_IN_CONTROLLER",
                    "Prisma queries found in Controller — move business logic to Service"))
            if re.search(r"async\s+\w+\s*\([^)]*\)\s*:\s*Promise", method_block) and "this.service" not in method_block:
                results.append(LintResult("WARNING", file, i, "UNSAFE_RETURN",
                    "Async method in Controller without delegating to Service"))

    # Check 4: DTO patterns
    dto_files = list(path.parent.glob("dto/*.dto.ts"))
    if dto_files:
        for dto_file in dto_files:
            dto_content = dto_file.read_text(encoding="utf-8")
            # Check for @IsString, @IsEmail, etc.
            if not re.search(r"@(Is|Validate|Length|Min|Max)", dto_content):
                results.append(LintResult("WARNING", str(dto_file), 1, "MISSING_VALIDATION",
                    "DTO has no class-validator decorators — add validation for all fields"))

    # Check 5: HTTP status codes
    status_codes = re.findall(r"HttpStatus\.(\w+)", content)
    for code in status_codes:
        if code not in ["OK", "CREATED", "NO_CONTENT", "BAD_REQUEST", "UNAUTHORIZED",
                         "FORBIDDEN", "NOT_FOUND", "CONFLICT", "INTERNAL_SERVER_ERROR",
                         "TOO_MANY_REQUESTS", "UNPROCESSABLE_ENTITY"]:
            results.append(LintResult("WARNING", file, 1, "NON_STANDARD_STATUS",
                f"Non-standard HTTP status code: {code}"))

    return results


def main():
    import argparse

    parser = argparse.ArgumentParser(description="API Design Linter for NestJS Controllers")
    parser.add_argument("path", nargs="?", default="apps/api-server/src",
                        help="Path to lint (file or directory)")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                        help="Output format")
    parser.add_argument("--strict", action="store_true",
                        help="Treat warnings as errors")
    args = parser.parse_args()

    target = Path(args.path)
    report = LintReport()

    if target.is_file():
        if target.suffix == ".ts" and "controller" in target.name:
            report.results = lint_controller_file(target)
            report.file_count = 1
    else:
        controller_files = list(target.rglob("*.controller.ts"))
        for cf in controller_files:
            results = lint_controller_file(cf)
            report.results.extend(results)
            report.file_count += 1

    if args.strict:
        for r in report.results:
            if r.severity == "WARNING":
                r.severity = "ERROR"

    report.print_summary(args.format)
    sys.exit(1 if report.results else 0)


if __name__ == "__main__":
    main()
