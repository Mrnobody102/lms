#!/usr/bin/env python3
"""Frontend Bundle Analyzer — Analyzes package.json for heavy dependencies and optimization opportunities."""

import json
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path


HEAVY_DEPS = {
    "moment": {"size": "290KB", "alternative": "date-fns (12KB) or dayjs (2KB)"},
    "lodash": {"size": "71KB", "alternative": "lodash-es with tree-shaking"},
    "axios": {"size": "14KB", "alternative": "native fetch or ky (3KB)"},
    "jquery": {"size": "87KB", "alternative": "Native DOM APIs"},
    "ramda": {"size": "42KB", "alternative": "Native JS or specific lodash functions"},
    "node-fetch": {"size": "20KB", "alternative": "native fetch (Node 18+)"},
    "@mui/material": {"size": "Large", "alternative": "shadcn/ui or Radix UI"},
    "@ant-design/icons": {"size": "Large", "alternative": "lucide-react or @heroicons/react"},
    "chart.js": {"size": "200KB+", "alternative": " recharts or visx (tree-shakeable)"},
    "fp-ts": {"size": "500KB+", "alternative": "native JS for simple FP"},
    "io-ts": {"size": "200KB+", "alternative": "zod (smaller, friendlier)"},
    "underscore": {"size": "30KB", "alternative": "native JS methods"},
}

LIGHT_ALTERNATIVES = {
    "date-fns": "date-fns (modular, tree-shakeable)",
    "dayjs": "dayjs (2KB, Moment.js replacement)",
    "clsx": "clsx (400B utility for conditional classes)",
    "zod": "zod (type-safe validation, smaller than Joi)",
    "ky": "ky (3KB, Tiny HTTP client based on Fetch)",
    "lucide-react": "lucide-react (tree-shakeable icons)",
    "@heroicons/react": "@heroicons/react (tree-shakeable)",
    "recharts": "recharts (React-specific, tree-shakeable charts)",
    "visx": "visx (low-level, composable charts"),
    "clsx": "clsx (tiny conditional class utility)",
}


@dataclass
class BundleReport:
    heavy_deps: list[dict] = field(default_factory=list)
    light_deps: list[dict] = field(default_factory=list)
    score: int = 100
    grade: str = "A"
    total_packages: int = 0

    def analyze_package_json(self, path: Path):
        pkg = json.loads(path.read_text(encoding="utf-8"))

        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        self.total_packages = len(deps)

        for name, version in deps.items():
            if name in HEAVY_DEPS:
                info = HEAVY_DEPS[name]
                self.heavy_deps.append({
                    "name": name,
                    "version": version,
                    "size": info["size"],
                    "alternative": info["alternative"],
                    "severity": "HIGH" if "Large" in info["size"] else "MEDIUM",
                })
                self.score -= 20 if "Large" in info["size"] else 10

            if name in LIGHT_ALTERNATIVES:
                self.light_deps.append({
                    "name": name,
                    "note": LIGHT_ALTERNATIVES[name],
                })

        # Deduct for too many dependencies
        if self.total_packages > 100:
            self.score -= 10
        elif self.total_packages > 150:
            self.score -= 20

        self.score = max(0, min(100, self.score))

        if self.score >= 90:
            self.grade = "A"
        elif self.score >= 80:
            self.grade = "B"
        elif self.score >= 70:
            self.grade = "C"
        elif self.score >= 60:
            self.grade = "D"
        else:
            self.grade = "F"

    def print_report(self, output_format: str = "text"):
        if output_format == "json":
            print(json.dumps({
                "score": self.score,
                "grade": self.grade,
                "total_packages": self.total_packages,
                "heavy_dependencies": self.heavy_deps,
                "good_dependencies": self.light_deps,
            }, indent=2))
            return

        print(f"\n{'='*60}")
        print(f"Bundle Health Score: {self.score}/100 ({self.grade})")
        print(f"Total packages: {self.total_packages}")
        print(f"{'='*60}\n")

        if self.heavy_deps:
            print("HEAVY DEPENDENCIES (replace where possible):\n")
            for dep in self.heavy_deps:
                severity_icon = "[X]" if dep["severity"] == "HIGH" else "[!]"
                print(f"  {severity_icon} {dep['name']} ({dep['version']}) — {dep['size']}")
                print(f"      Replace with: {dep['alternative']}\n")

        if self.light_deps:
            print("GOOD CHOICES:\n")
            for dep in self.light_deps:
                print(f"  [+] {dep['name']}")
                print(f"      Note: {dep['note']}\n")

        if not self.heavy_deps:
            print("[OK] No heavy dependencies detected.\n")

        recommendations = []
        if self.total_packages > 100:
            recommendations.append("Consider auditing unused dependencies: pnpm prune")
        if any("axios" in d["name"] for d in self.heavy_deps):
            recommendations.append("Consider replacing axios with native fetch (or ky for convenience)")

        if recommendations:
            print("RECOMMENDATIONS:")
            for r in recommendations:
                print(f"  - {r}")
            print()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Bundle Analyzer for Next.js/NestJS projects")
    parser.add_argument("path", nargs="?", default=".", help="Project path")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    path = Path(args.path)
    package_json = path / "package.json"

    if not package_json.exists():
        print(f"[ERROR] package.json not found at: {package_json}")
        sys.exit(1)

    report = BundleReport()
    report.analyze_package_json(package_json)
    report.print_report(args.format)

    if args.strict and report.grade in ["D", "F"]:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
