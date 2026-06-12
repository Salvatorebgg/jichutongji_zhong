"""Smoke tests for the current Clinical Statistics Platform.

Run from project root:
    python tests/smoke.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.services.sample_service import EXAMPLE_MAKERS
from app.services.variable_service import classify_variables, summarize_dataset

CLIENT = TestClient(app)

DEFAULTS = {
    "t_test_independent": {"var": "sbp_reduction", "group_var": "treatment"},
    "t_test_paired": {"var": "sbp_before", "paired_var": "sbp_after"},
    "one_sample_t_test": {"var": "ldl_change"},
    "normality_test": {"var": "biomarker"},
    "levene_test": {"var": "response_value", "group_var": "group"},
    "anova": {"var": "efficacy_score", "group_var": "treatment"},
    "repeated_measures_anova": {"var": "sbp", "group_var": "timepoint", "subject_var": "subject_id"},
    "ancova": {"var": "sbp_followup", "group_var": "treatment", "covar": "sbp_baseline"},
    "mann_whitney": {"var": "crp_level", "group_var": "treatment"},
    "kruskal_wallis": {"var": "biomarker_level", "group_var": "disease_stage"},
    "wilcoxon_signed_rank": {"var": "pain_before", "paired_var": "pain_after"},
    "friedman": {"var": "pain_score", "group_var": "timepoint", "subject_var": "subject_id"},
    "chi_square": {"var": "outcome", "group_var": "treatment"},
    "fisher_exact": {"var": "outcome", "group_var": "treatment"},
    "mcnemar": {"var": "diagnosis_standard", "paired_var": "diagnosis_new"},
    "pearson_correlation": {"var": "age", "paired_var": "bmi"},
    "spearman_correlation": {"var": "glucose", "paired_var": "crp"},
    "log_rank": {"time_var": "survival_time", "event_var": "event", "group_var": "treatment"},
    "logistic_regression": {"var": "outcome", "x_vars": ["age", "bmi", "glucose", "cholesterol"]},
    "linear_regression": {"var": "sbp", "x_vars": ["age", "bmi", "glucose", "cholesterol"]},
    "discriminant_analysis": {"var": "diagnosis_group", "x_vars": ["age", "bmi", "sbp", "glucose", "cholesterol", "crp"]},
    "quadratic_discriminant_analysis": {"var": "diagnosis_group", "x_vars": ["age", "bmi", "sbp", "glucose", "cholesterol", "crp"]},
}

def assert_true(cond, msg):
    if not cond:
        raise AssertionError(msg)

def test_sample_generation():
    for name, fn in EXAMPLE_MAKERS.items():
        df = fn()
        assert_true(len(df) > 0, f"{name}: empty dataframe")
        assert_true(len(df.columns) > 0, f"{name}: no columns")
    print(f"  [PASS] sample generation ({len(EXAMPLE_MAKERS)} makers)")

def test_variable_classification():
    df = pd.read_csv(ROOT / "data/examples/comprehensive_example.csv")
    types = classify_variables(df)
    summary = summarize_dataset(df, types)
    assert_true(summary["sample_size"] > 0, "sample size should be positive")
    assert_true(summary["variable_count"] > 0, "variable count should be positive")
    assert_true("continuous" in types, "continuous variables missing")
    assert_true("categorical" in types or "binary" in types, "categorical/binary variables missing")
    print("  [PASS] variable classification")

def test_all_analysis_endpoints():
    failures = []
    for test_type, params in DEFAULTS.items():
        payload = {
            "test_type": test_type,
            "use_demo": True,
            "dataset_name": "comprehensive_example",
            **params,
        }
        resp = CLIENT.post("/api/analyze", json=payload)
        try:
            data = resp.json()
        except Exception:
            data = {}
        ok = resp.status_code == 200 and data.get("status") != "error" and data.get("result")
        if not ok:
            failures.append((test_type, resp.status_code, str(data)[:300]))
    assert_true(not failures, "analysis endpoint failures: " + repr(failures))
    print(f"  [PASS] analysis endpoints ({len(DEFAULTS)}/{len(DEFAULTS)})")

def test_ancova_chart_and_publication_export():
    payload = {
        "test_type": "ancova",
        "use_demo": True,
        "dataset_name": "comprehensive_example",
        **DEFAULTS["ancova"],
    }
    resp = CLIENT.post("/api/analyze", json=payload)
    data = resp.json()
    assert_true(resp.status_code == 200 and data.get("status") == "ok", "ancova analysis failed")
    result = data.get("result") or {}
    chart = result.get("chart_data") or {}
    assert_true(chart.get("chart_type") == "ancova_adjusted", "ancova chart_data type missing")
    assert_true(len(chart.get("x_values", [])) > 0, "ancova x values missing")
    assert_true(len(chart.get("y_values", [])) == len(chart.get("group_values", [])), "ancova point arrays misaligned")
    assert_true(len(chart.get("lines", [])) >= 2, "ancova adjusted lines missing")
    assert_true(len(chart.get("adjusted_points", [])) == len(chart.get("groups", [])), "ancova adjusted means missing")
    assert_true(data.get("tables", {}).get("result"), "ancova result table missing")
    assert_true(data.get("tables", {}).get("group_stats"), "ancova group stats table missing")

    for fmt, expected in [
        ("png", b"\x89PNG\r\n\x1a\n"),
        ("svg", b"<svg"),
        ("pdf", b"%PDF"),
    ]:
        export = CLIENT.post(
            "/api/export/stat-chart/publication",
            json={"chart_data": chart, "format": fmt, "title": chart.get("title")},
        )
        assert_true(export.status_code == 200, f"ancova {fmt} export failed: {export.text[:120]}")
        if fmt == "svg":
            assert_true(expected in export.content[:500], "ancova svg export body invalid")
        else:
            assert_true(export.content.startswith(expected), f"ancova {fmt} export body invalid")
        assert_true(len(export.content) > 1000, f"ancova {fmt} export too small")
    print("  [PASS] ancova chart data and publication exports")

def test_logistic_handles_categorical_and_id_predictors():
    payload = {
        "test_type": "logistic_regression",
        "use_demo": True,
        "dataset_name": "logistic_regression_example",
        "var": "outcome",
        "x_vars": ["patient_id", "sex", "age", "bmi", "glucose", "cholesterol"],
    }
    resp = CLIENT.post("/api/analyze", json=payload)
    data = resp.json()
    assert_true(resp.status_code == 200 and data.get("status") == "ok", f"logistic mixed predictor analysis failed: {data}")
    details = data.get("result", {}).get("details", {})
    encoded = details.get("encoded_predictors", [])
    skipped = details.get("skipped_predictors", [])
    assert_true(details.get("n", 0) >= 20, "logistic mixed predictors should keep complete rows")
    assert_true(any(str(name).startswith("sex_") for name in encoded), "categorical predictor should be dummy encoded")
    assert_true(any(item.get("name") == "patient_id" for item in skipped), "ID-like predictor should be skipped instead of clearing rows")
    print("  [PASS] logistic categorical predictors and ID skipping")

def test_linear_handles_categorical_and_id_predictors():
    payload = {
        "test_type": "linear_regression",
        "use_demo": True,
        "dataset_name": "linear_regression_example",
        "var": "sbp",
        "x_vars": ["patient_id", "sex", "treatment", "age", "bmi", "glucose", "cholesterol"],
    }
    resp = CLIENT.post("/api/analyze", json=payload)
    data = resp.json()
    assert_true(resp.status_code == 200 and data.get("status") == "ok", f"linear mixed predictor analysis failed: {data}")
    details = data.get("result", {}).get("details", {})
    encoded = details.get("encoded_predictors", [])
    skipped = details.get("skipped_predictors", [])
    assert_true(details.get("n", 0) >= 20, "linear mixed predictors should keep complete rows")
    assert_true(any(str(name).startswith("sex_") for name in encoded), "linear categorical predictor should be dummy encoded")
    assert_true(any(item.get("name") == "patient_id" for item in skipped), "linear ID-like predictor should be skipped")
    print("  [PASS] linear categorical predictors and ID skipping")

def test_discriminant_skips_non_numeric_predictors():
    payload = {
        "test_type": "discriminant_analysis",
        "use_demo": True,
        "dataset_name": "discriminant_analysis_example",
        "var": "diagnosis_group",
        "x_vars": ["patient_id", "sex", "treatment", "age", "bmi", "sbp", "glucose"],
    }
    resp = CLIENT.post("/api/analyze", json=payload)
    data = resp.json()
    assert_true(resp.status_code == 200 and data.get("status") == "ok", f"discriminant mixed predictor analysis failed: {data}")
    details = data.get("result", {}).get("details", {})
    skipped = details.get("skipped_predictors", [])
    predictors = details.get("predictors", [])
    assert_true(details.get("n", 0) >= 20, "discriminant should keep complete rows with usable numeric predictors")
    assert_true("age" in predictors and "bmi" in predictors, "discriminant numeric predictors should remain in model")
    assert_true(any(item.get("name") == "sex" for item in skipped), "discriminant should skip categorical predictors")
    assert_true(any(item.get("name") == "patient_id" for item in skipped), "discriminant should skip ID-like predictors")
    print("  [PASS] discriminant nonnumeric predictor skipping")

if __name__ == "__main__":
    print("Running smoke tests for Clinical Statistics Platform...")
    test_sample_generation()
    test_variable_classification()
    test_all_analysis_endpoints()
    test_ancova_chart_and_publication_export()
    test_logistic_handles_categorical_and_id_predictors()
    test_linear_handles_categorical_and_id_predictors()
    test_discriminant_skips_non_numeric_predictors()
    print("All smoke tests passed.")
