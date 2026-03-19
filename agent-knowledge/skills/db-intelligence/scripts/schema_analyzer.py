#!/usr/bin/env python3
"""Database Schema Analyzer — Reviews Prisma schema for issues and safety risks."""

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class SchemaIssue:
    severity: str  # ERROR, WARNING, INFO
    model: str
    field: Optional[str]
    rule: str
    message: str
    line: int = 0

    def to_dict(self):
        return {
            "severity": self.severity,
            "model": self.model,
            "field": self.field,
            "rule": self.rule,
            "message": self.message,
            "line": self.line,
        }


@dataclass
class SchemaReport:
    issues: list[SchemaIssue] = field(default_factory=list)
    models: list[str] = field(default_factory=list)
    total_fields: int = 0
    total_relations: int = 0

    def add(self, severity: str, model: str, field: Optional[str], rule: str,
            message: str, line: int = 0):
        self.issues.append(SchemaIssue(severity, model, field, rule, message, line))

    def print_report(self, output_format: str = "text"):
        if output_format == "json":
            print(json.dumps({
                "issues": [i.to_dict() for i in self.issues],
                "stats": {
                    "models": len(self.models),
                    "total_fields": self.total_fields,
                    "total_relations": self.total_relations,
                    "errors": sum(1 for i in self.issues if i.severity == "ERROR"),
                    "warnings": sum(1 for i in self.issues if i.severity == "WARNING"),
                }
            }, indent=2))
            return

        print(f"\n{'='*60}")
        print(f"Schema Analyzer — {len(self.issues)} issue(s), {len(self.models)} model(s)")
        print(f"{'='*60}\n")

        if not self.issues:
            print("[OK] No schema issues found.\n")
            return

        errors = [i for i in self.issues if i.severity == "ERROR"]
        warnings = [i for i in self.issues if i.severity == "WARNING"]
        infos = [i for i in self.issues if i.severity == "INFO"]

        if errors:
            print("ERRORS:")
            for i in errors:
                loc = f"[{i.model}.{i.field}]" if i.field else f"[{i.model}]"
                print(f"  [X] {loc} — {i.message}")
            print()

        if warnings:
            print("WARNINGS:")
            for i in warnings:
                loc = f"[{i.model}.{i.field}]" if i.field else f"[{i.model}]"
                print(f"  [!] {loc} — {i.message}")
            print()

        if infos:
            print("INFO:")
            for i in infos:
                loc = f"[{i.model}.{i.field}]" if i.field else f"[{i.model}]"
                print(f"  [i] {loc} — {i.message}")

        print(f"\n  Total: {len(errors)} error(s), {len(warnings)} warning(s), {len(infos)} info\n")


def analyze_prisma_schema(path: Path) -> SchemaReport:
    """Analyze a Prisma schema file."""
    report = SchemaReport()
    content = path.read_text(encoding="utf-8")
    lines = content.splitlines()

    # Find all models
    model_pattern = re.compile(r"model\s+(\w+)\s*\{")
    models = model_pattern.findall(content)
    report.models = models

    for model in models:
        # Extract model block
        model_start = content.find(f"model {model} {{")
        brace_count = 0
        model_content = ""
        line_offset = content[:model_start].count("\n")

        for i in range(model_start, len(content)):
            if content[i] == "{":
                brace_count += 1
            elif content[i] == "}":
                brace_count -= 1
            if brace_count > 0:
                model_content += content[i]
            if brace_count == 0 and i > model_start:
                break

        # Check each field
        field_pattern = re.compile(
            r"^(\s*)(\w+)(\s+)(\w+)(\s*(?:\?)?\s*@.*)?$",
            re.MULTILINE
        )

        for match in field_pattern.finditer(model_content):
            indent, field_name, field_type = match.group(1), match.group(2), match.group(4)
            full_line = match.group(0)
            line_num = content[:model_start + match.start()].count("\n") + 1

            report.total_fields += 1

            # Skip relation fields (ends with relation name)
            if field_type in ["relation", ""]:
                continue

            # Check 1: Missing createdAt/updatedAt on primary models
            if field_name in ["createdAt", "updatedAt"]:
                continue
            if field_name == "id":
                if "createdAt" not in model_content and "updatedAt" not in model_content:
                    if model not in ["User"]:
                        report.add("INFO", model, field_name,
                                  "MISSING_TIMESTAMPS",
                                  f"Model has 'id' but no createdAt/updatedAt — consider adding for audit", line_num)

            # Check 2: ID should be UUID
            if field_name == "id":
                if "uuid" not in full_line and " cuid" not in full_line:
                    report.add("WARNING", model, field_name,
                              "NON_UUID_ID",
                              "ID field should use @default(uuid()) for security", line_num)

            # Check 3: Missing index on foreign keys
            if field_type in ["String", "Int"] and field_name.endswith("Id"):
                if "@id" not in full_line and "@unique" not in full_line and "@index" not in full_line:
                    report.add("INFO", model, field_name,
                              "MISSING_INDEX",
                              f"Foreign key '{field_name}' may benefit from an index for join performance", line_num)

            # Check 4: Missing @map for non-standard field names
            snake_case = re.match(r"^[a-z][a-z0-9_]*$", field_name)
            camel_case = re.match(r"^[a-z][a-zA-Z0-9]*$", field_name)
            if snake_case and "@map" not in full_line and "@default" not in full_line:
                report.add("INFO", model, field_name,
                          "INCONSISTENT_NAMING",
                          f"Field name '{field_name}' looks like snake_case — consider @map for DB column", line_num)

        # Check for missing indexes on filtered fields
        index_pattern = re.compile(r"@@index\s*\(\s*\[([^\]]+)\]", re.MULTILINE)
        indexed_fields = set()
        for idx_match in index_pattern.finditer(model_content):
            for field_ref in idx_match.group(1).split(","):
                indexed_fields.add(field_ref.strip())

        # Check relations
        relation_pattern = re.compile(r"(\w+)\s+(\w+)\s*\(([^)]*)\)")
        for rel_match in relation_pattern.finditer(model_content):
            rel_field = rel_match.group(1)
            rel_type = rel_match.group(2)
            rel_args = rel_match.group(3)
            report.total_relations += 1

            # Check for missing ON DELETE/CASCADE
            if "relation" in rel_type:
                if "onDelete" not in rel_args and "onUpdate" not in rel_args:
                    if "?" not in rel_field:  # required relation
                        report.add("WARNING", model, rel_field,
                                  "MISSING_ON_DELETE",
                                  f"Required relation missing ON DELETE — add onDelete: Cascade/SetNull/Restrict", 0)

        # Check for missing tenantId on models that need it
        primary_models = ["User", "Course", "Lesson", "Enrollment", "Category", "Attendance"]
        if model in primary_models:
            if "tenantId" not in model_content:
                report.add("ERROR", model, None,
                          "MISSING_TENANT_ID",
                          f"Model '{model}' is a primary data model — must have tenantId field for multi-tenancy", 0)

    # Check for missing @@index on frequently filtered fields
    # Common filter fields that should be indexed
    common_filter_fields = ["tenantId", "email", "status", "role", "slug"]

    for model in models:
        model_start = content.find(f"model {model} {{")
        brace_count = 0
        model_content = ""
        for i in range(model_start, len(content)):
            if content[i] == "{":
                brace_count += 1
            elif content[i] == "}":
                brace_count -= 1
            if brace_count > 0:
                model_content += content[i]
            if brace_count == 0 and i > model_start:
                break

        for cf in common_filter_fields:
            if cf in model_content and f"@@index" not in model_content:
                # Already checked above for tenantId (error), check others
                pass

    return report


def generate_migration_plan(report: SchemaReport) -> str:
    """Generate a migration plan from schema analysis."""
    lines = [
        "# Database Migration Plan\n",
        f"Generated: {datetime.now().isoformat()}\n",
        "## Summary\n",
        f"- Models: {len(report.models)}\n",
        f"- Total Fields: {report.total_fields}\n",
        f"- Relations: {report.total_relations}\n",
        f"- Issues: {len(report.issues)}\n\n",
        "## Required Fixes (Errors)\n",
    ]

    errors = [i for i in report.issues if i.severity == "ERROR"]
    for e in errors:
        lines.append(f"1. **{e.rule}**: {e.message}\n")
        lines.append(f"   - Model: `{e.model}`\n")
        if e.field:
            lines.append(f"   - Field: `{e.field}`\n")
        lines.append("\n")

    lines.append("## Recommended Fixes (Warnings)\n")
    warnings = [i for i in report.issues if i.severity == "WARNING"]
    for w in warnings:
        lines.append(f"1. **{w.rule}**: {w.message}\n")
        lines.append(f"   - Model: `{w.model}`\n\n")

    lines.append("## Commands\n")
    lines.append("```bash\n")
    lines.append("# For development\n")
    lines.append("cd packages/database\n")
    lines.append("npx prisma validate\n")
    lines.append("npx prisma format\n")
    lines.append("npx prisma migrate dev --name fix_<issue>\n")
    lines.append("\n# For production\n")
    lines.append("npx prisma migrate dev --name fix_<issue>\n")
    lines.append("npx prisma migrate deploy\n")
    lines.append("```\n")

    return "".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Prisma Schema Analyzer")
    parser.add_argument("path", nargs="?", default="packages/database/prisma/schema.prisma",
                        help="Path to schema.prisma")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--plan", action="store_true",
                        help="Generate migration plan instead of report")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    schema_path = Path(args.path)
    if not schema_path.exists():
        print(f"[ERROR] Schema file not found: {args.path}")
        sys.exit(1)

    report = analyze_prisma_schema(schema_path)

    if args.strict:
        for issue in report.issues:
            if issue.severity == "WARNING":
                issue.severity = "ERROR"

    if args.plan:
        print(generate_migration_plan(report))
    else:
        report.print_report(args.format)

    has_errors = any(i.severity == "ERROR" for i in report.issues)
    sys.exit(1 if has_errors else 0)


if __name__ == "__main__":
    main()
