"""
g4f Provider + Model Benchmarker v3

Цель: массово прогнать все провайдеры и зарегистрированные модели g4f,
замерить успешность, скорость и способность вернуть валидный JSON для фактчекинга.

Запуск:
    python g4f_benchmarker.py

Требования:
    pip install -U nest_asyncio
    # g4f уже установлен из GitHub (git+https://github.com/xtekky/gpt4free.git)
"""

import csv
import json
import time
import traceback
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Iterable

try:
    import nest_asyncio
    nest_asyncio.apply()
except ImportError:
    pass

import g4f
from g4f import Provider
from g4f import models as g4f_models
from g4f.models import ModelRegistry


# Тестовые промпты
TEST_PROMPT_SIMPLE = "Кто является президентом Франции в 2024 году? Ответь кратко, одним предложением."

TEST_PROMPT_JSON = (
    "Проверь факт и верни ответ СТРОГО в JSON формате без markdown:\n\n"
    "Факт: \"Эйфелева башня была построена в 1889 году для Всемирной выставки в Париже.\"\n"
    "Формат ответа: {\"claim\":\"...\",\"verdict\":\"true|false|partial\",\"explanation\":\"...\",\"source\":\"url\"}"
)

TEST_PROMPT_FACTCHECK = (
    "Ты — профессиональный фактчекер. Проверь текст и верни только JSON без markdown.\n\n"
    "ТЕКСТ: \"Apple была основана Биллом Гейтсом в 1975 году. Первый iPhone вышел в 2005 году.\"\n"
    "Формат: {\"overall_verdict\":\"contains_fakes\",\"fact_checks\":[{\"exact_quote\":\"...\",\"status\":\"fake|true|misleading\",\"truth\":\"...\",\"source\":\"url\"}]}"
)


# === helpers ===

def safe_version(obj: Any) -> str:
    val = getattr(obj, "version", None)
    return str(val) if val is not None else "unknown"


def sanitize_jsonable(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: sanitize_jsonable(v) for k, v in data.items()}
    if isinstance(data, (list, tuple, set)):
        return [sanitize_jsonable(v) for v in data]
    if isinstance(data, (int, float, str, bool)) or data is None:
        return data
    return str(data)


def is_valid_json(text: str) -> tuple[bool, Any]:
    if not text:
        return False, None
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        return True, json.loads(cleaned)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return True, json.loads(text[start:end])
            except json.JSONDecodeError:
                return False, None
        return False, None


def is_valid_factcheck_format(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    if "fact_checks" not in data:
        return False
    if not isinstance(data["fact_checks"], list):
        return False
    for item in data["fact_checks"]:
        if not isinstance(item, dict):
            return False
        if not {"exact_quote", "status", "truth"}.issubset(item.keys()):
            return False
    return True


def check_needs_auth(provider_cls) -> bool:
    try:
        return bool(getattr(provider_cls, "needs_auth", False))
    except Exception:
        return False


@dataclass
class BenchmarkResult:
    target_type: str  # provider | model
    name: str
    provider_label: str | None
    model_name: str | None
    success: bool
    latency_seconds: float
    simple_response: bool
    json_valid: bool
    factcheck_valid: bool
    needs_auth: bool = False
    error_message: str = ""
    response_preview: str = ""
    json_response: str = ""
    factcheck_response: str = ""
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


# === discovery ===

def discover_providers() -> list[tuple[str, Any]]:
    providers = []
    provider_map = getattr(Provider, "__map__", {})
    if isinstance(provider_map, dict) and provider_map:
        for name, cls in provider_map.items():
            providers.append((name, cls))
    else:
        for name in dir(Provider):
            if name.startswith("_"):
                continue
            obj = getattr(Provider, name, None)
            if obj and isinstance(obj, type):
                providers.append((name, obj))
    return providers


def discover_models() -> list[str]:
    try:
        all_models = ModelRegistry.all_models()
        return list(all_models.keys())
    except Exception:
        return []


# === scoring ===

def calculate_score(result: BenchmarkResult) -> float:
    if not result.success:
        return 0.0
    score = 0.0
    if result.simple_response:
        score += 25
    if result.json_valid:
        score += 25
    if result.factcheck_valid:
        score += 30
    if result.latency_seconds > 0:
        score += max(0.0, 20 - (result.latency_seconds - 3) * 1.5)
    return round(score, 1)


# === runner ===

def run_chat(provider_or_model, messages: list[dict], timeout: int = 60):
    # Используем синхронный ChatCompletion из g4f
    return g4f.ChatCompletion.create(
        model=provider_or_model,
        messages=messages,
        timeout=timeout,
        provider=None if isinstance(provider_or_model, str) else provider_or_model,
    )


def normalize_response(resp: Any) -> str:
    if resp is None:
        return ""
    if isinstance(resp, str):
        return resp
    if isinstance(resp, Iterable):
        try:
            return "".join([chunk for chunk in resp if chunk])
        except Exception:
            return str(resp)
    return str(resp)


def test_target(name: str, target, target_type: str, model_name: str | None = None) -> BenchmarkResult:
    needs_auth = check_needs_auth(target) if target_type == "provider" else False
    result = BenchmarkResult(
        target_type=target_type,
        name=name,
        provider_label=name if target_type == "provider" else None,
        model_name=model_name if target_type == "model" else None,
        success=False,
        latency_seconds=0.0,
        simple_response=False,
        json_valid=False,
        factcheck_valid=False,
        needs_auth=needs_auth,
    )

    if needs_auth:
        result.error_message = "requires_auth"
        return result

    # 1) простой вопрос
    start = time.time()
    try:
        resp = run_chat(target if target_type == "provider" else model_name, [{"role": "user", "content": TEST_PROMPT_SIMPLE}], timeout=45)
        text = normalize_response(resp)
        result.latency_seconds = round(time.time() - start, 2)
        result.simple_response = bool(text and len(text.strip()) > 5)
        result.response_preview = text[:300]
        result.success = True
    except Exception as e:
        result.latency_seconds = round(time.time() - start, 2)
        result.error_message = f"{type(e).__name__}: {str(e)[:200]}"
        return result

    # 2) JSON
    try:
        resp = run_chat(target if target_type == "provider" else model_name, [{"role": "user", "content": TEST_PROMPT_JSON}], timeout=45)
        text = normalize_response(resp)
        result.json_response = text[:500]
        ok, _ = is_valid_json(text)
        result.json_valid = ok
    except Exception as e:
        result.error_message = f"json:{type(e).__name__}: {str(e)[:120]}"

    # 3) фактчек
    try:
        resp = run_chat(
            target if target_type == "provider" else model_name,
            [
                {"role": "system", "content": "Ты фактчекер. Отвечай строго валидным JSON без markdown."},
                {"role": "user", "content": TEST_PROMPT_FACTCHECK},
            ],
            timeout=60,
        )
        text = normalize_response(resp)
        result.factcheck_response = text[:800]
        ok, parsed = is_valid_json(text)
        if ok and parsed:
            result.factcheck_valid = is_valid_factcheck_format(parsed)
    except Exception as e:
        result.error_message = f"fact:{type(e).__name__}: {str(e)[:120]}"

    return result


# === persistence ===

def save_results(results: list[BenchmarkResult], base_filename: str = "g4f_benchmark_results"):
    serializable = []
    for r in results:
        data = sanitize_jsonable(asdict(r))
        data["score"] = calculate_score(r)
        serializable.append(data)

    serializable.sort(key=lambda x: x["score"], reverse=True)

    meta = {
        "benchmark_date": datetime.now().isoformat(),
        "g4f_version": safe_version(g4f),
        "total": len(results),
        "successful": sum(1 for r in results if r.success),
        "results": serializable,
    }

    json_file = f"{base_filename}.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    csv_file = f"{base_filename}.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["target_type", "name", "provider_label", "model_name", "score", "latency_seconds", "simple_response", "json_valid", "factcheck_valid", "needs_auth", "success", "error_message"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in serializable:
            writer.writerow({k: row.get(k, "") for k in fieldnames})

    print(f"\n✓ Результаты сохранены в {json_file} и {csv_file}")
    return serializable


def print_summary(rows: list[dict]):
    print("\n" + "=" * 90)
    print("ИТОГОВАЯ ТАБЛИЦА (top-40)")
    print("=" * 90)
    print(f"{'Тип':<8} {'Имя':<28} {'Score':<7} {'Lat':<7} {'JSON':<5} {'FC':<5} {'OK'}")
    print("-" * 90)
    for r in rows[:40]:
        lat = f"{r['latency_seconds']:.1f}s" if r.get("latency_seconds") else "N/A"
        print(f"{r['target_type']:<8} {r['name']:<28} {r['score']:<7} {lat:<7} {('✓' if r['json_valid'] else '✗'):<5} {('✓' if r['factcheck_valid'] else '✗'):<5} {('✓' if r['success'] else '✗')}")
    print("-" * 90)
    top = [r for r in rows if r.get("score", 0) >= 50][:10]
    if top:
        print("\n🏆 РЕКОМЕНДУЕМЫЕ (score>=50):")
        for i, r in enumerate(top, 1):
            print(f"  {i}. [{r['target_type']}] {r['name']} — score {r['score']} (lat {r['latency_seconds']:.1f}s)")


# === main ===

def main():
    print("=" * 90)
    print("g4f PROVIDER + MODEL BENCHMARK v3")
    print("=" * 90)
    print(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"g4f version: {safe_version(g4f)}")

    providers = discover_providers()
    models = discover_models()
    print(f"\n📦 Провайдеров: {len(providers)}; Моделей: {len(models)}")

    results: list[BenchmarkResult] = []

    print("\n⏳ Тестируем провайдеры...")
    for idx, (name, cls) in enumerate(providers, 1):
        print(f"[{idx}/{len(providers)}] {name}")
        try:
            res = test_target(name, cls, target_type="provider")
            results.append(res)
        except KeyboardInterrupt:
            print("Прервано пользователем")
            break
        except Exception as e:
            results.append(BenchmarkResult(
                target_type="provider",
                name=name,
                provider_label=name,
                model_name=None,
                success=False,
                latency_seconds=0.0,
                simple_response=False,
                json_valid=False,
                factcheck_valid=False,
                error_message=f"fatal:{type(e).__name__}: {str(e)[:200]}",
                needs_auth=check_needs_auth(cls),
            ))
        if idx % 15 == 0:
            save_results(results, base_filename="g4f_benchmark_partial")

    print("\n⏳ Тестируем модели (бест провайдеры внутри g4f)...")
    for idx, model_name in enumerate(models, 1):
        print(f"[model {idx}/{len(models)}] {model_name}")
        try:
            res = test_target(model_name, None, target_type="model", model_name=model_name)
            results.append(res)
        except KeyboardInterrupt:
            print("Прервано пользователем")
            break
        except Exception as e:
            results.append(BenchmarkResult(
                target_type="model",
                name=model_name,
                provider_label=None,
                model_name=model_name,
                success=False,
                latency_seconds=0.0,
                simple_response=False,
                json_valid=False,
                factcheck_valid=False,
                error_message=f"fatal:{type(e).__name__}: {str(e)[:200]}",
            ))
        if idx % 15 == 0:
            save_results(results, base_filename="g4f_benchmark_partial_models")

    rows = save_results(results)
    print_summary(rows)
    print("\n✅ Бенчмарк завершен")


if __name__ == "__main__":
    main()
