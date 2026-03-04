"""Generate summarized tables from g4f benchmark results."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "g4f_benchmark_results.json"


def load_results() -> list[dict]:
    if not RESULTS.exists():
        raise FileNotFoundError(f"Results file not found: {RESULTS}")
    data = json.loads(RESULTS.read_text(encoding="utf-8"))
    return data.get("results", [])


def build_markdown_table(rows: list[dict], label: str) -> str:
    header = ["| # | name | score | latency_s | json | factcheck | ok |", "|---|---|---|---|---|---|---|"]
    body = []
    for i, r in enumerate(rows, 1):
        body.append(
            "| {i} | {name} | {score} | {latency} | {json_ok} | {fc_ok} | {ok} |".format(
                i=i,
                name=r.get("name", ""),
                score=r.get("score", ""),
                latency=r.get("latency_seconds", ""),
                json_ok="✅" if r.get("json_valid") else "❌",
                fc_ok="✅" if r.get("factcheck_valid") else "❌",
                ok="✅" if r.get("success") else "❌",
            )
        )
    return "\n".join(header + body)


def main() -> None:
    results = load_results()

    models = [r for r in results if r.get("target_type") == "model"]
    models.sort(key=lambda x: x.get("score", 0), reverse=True)

    providers = [r for r in results if r.get("target_type") == "provider"]
    providers.sort(key=lambda x: x.get("score", 0), reverse=True)

    (ROOT / "models_table.md").write_text(build_markdown_table(models, "models"), encoding="utf-8")
    (ROOT / "providers_table.md").write_text(build_markdown_table(providers, "providers"), encoding="utf-8")

    working_models = [m for m in models if m.get("success")]
    working_models.sort(key=lambda x: x.get("score", 0), reverse=True)
    (ROOT / "working_models.md").write_text(build_markdown_table(working_models, "working_models"), encoding="utf-8")


if __name__ == "__main__":
    main()
