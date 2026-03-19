#!/usr/bin/env python3
"""Monorepo Analyzer — Analyzes pnpm/Turborepo monorepo structure and reports health."""

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PackageInfo:
    name: str
    path: Path
    package_json: dict
    type: str  # "app", "package", "root"


@dataclass
class MonorepoReport:
    root: Path
    packages: list[PackageInfo] = field(default_factory=list)
    apps: list[PackageInfo] = field(default_factory=list)
    shared_packages: list[PackageInfo] = field(default_factory=list)
    issues: list[str] = field(default_factory=list)

    def analyze(self):
        # Find pnpm-workspace.yaml
        ws_file = self.root / "pnpm-workspace.yaml"
        if not ws_file.exists():
            self.issues.append("Missing pnpm-workspace.yaml — pnpm workspaces not configured")
            return

        # Find turbo.json
        turbo_file = self.root / "turbo.json"
        if not turbo_file.exists():
            self.issues.append("Missing turbo.json — Turborepo not configured")
        else:
            turbo = json.loads(turbo_file.read_text(encoding="utf-8"))
            if "pipeline" not in turbo:
                self.issues.append("turbo.json missing 'pipeline' key")

        # Find all package.json files
        pkg_files = list(self.root.rglob("package.json"))
        pkg_files = [p for p in pkg_files if "node_modules" not in str(p)]

        for pf in pkg_files:
            if pf.parent == self.root:
                continue  # skip root package.json

            pkg = json.loads(pf.read_text(encoding="utf-8"))
            name = pkg.get("name", pf.parent.name)

            if pf.parent.name == "apps" or "app" in pf.parent.name:
                ptype = "app"
                self.apps.append(PackageInfo(name, pf.parent, pkg, ptype))
            elif pf.parent.name == "packages" or "package" in pf.parent.name:
                ptype = "package"
                self.shared_packages.append(PackageInfo(name, pf.parent, pkg, ptype))
            else:
                ptype = "unknown"
                self.issues.append(f"Package '{name}' in unexpected location: {pf.parent.relative_to(self.root)}")
                self.shared_packages.append(PackageInfo(name, pf.parent, pkg, ptype))

            self.packages.append(PackageInfo(name, pf.parent, pkg, ptype))

        # Check for missing build scripts
        for pkg in self.packages:
            if "build" not in pkg.package_json.get("scripts", {}):
                if pkg.type != "root":
                    self.issues.append(f"Package '{pkg.name}' missing 'build' script")

        # Check for missing test scripts
        for app in self.apps:
            if "test" not in app.package_json.get("scripts", {}):
                self.issues.append(f"App '{app.name}' missing 'test' script")

        # Check remote cache config
        if turbo_file.exists():
            turbo = json.loads(turbo_file.read_text(encoding="utf-8"))
            if "tasks" not in turbo and "pipeline" not in turbo:
                self.issues.append("turbo.json has no tasks/pipeline defined")

    def print_report(self, output_format: str = "text"):
        if output_format == "json":
            print(json.dumps({
                "root": str(self.root),
                "total_packages": len(self.packages),
                "apps": [{"name": p.name, "path": str(p.path)} for p in self.apps],
                "shared_packages": [{"name": p.name, "path": str(p.path)} for p in self.shared_packages],
                "issues": self.issues,
            }, indent=2))
            return

        print(f"\n{'='*60}")
        print(f"Monorepo Analyzer — {self.root.name}")
        print(f"{'='*60}\n")

        print(f"  Packages:  {len(self.packages)}")
        print(f"  Apps:      {len(self.apps)}")
        print(f"  Shared:    {len(self.shared_packages)}\n")

        if self.apps:
            print("  APPS:")
            for app in self.apps:
                print(f"    - {app.name} ({app.path.relative_to(self.root)})")
            print()

        if self.shared_packages:
            print("  SHARED PACKAGES:")
            for pkg in self.shared_packages:
                print(f"    - {pkg.name} ({pkg.path.relative_to(self.root)})")
            print()

        if self.issues:
            print(f"  ISSUES ({len(self.issues)}):")
            for issue in self.issues:
                print(f"    [!] {issue}")
            print()
        else:
            print("  [OK] No issues found.\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Monorepo Analyzer")
    parser.add_argument("path", nargs="?", default=".", help="Monorepo root path")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    root = Path(args.path).resolve()
    report = MonorepoReport(root)
    report.analyze()
    report.print_report(args.format)

    if report.issues:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
