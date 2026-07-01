from __future__ import annotations

import json
import uuid
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import Body, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

from app.config import STATIC_DIR, EXAMPLES_DIR, UPLOADS_DIR, OUTPUTS_DIR
from app.schemas import AnalyzeRequest, ChartRequest, TableRequest, ExportRequest
from app.services.io_service import (
    read_file,
    get_sheet_names,
    save_upload,
    get_example_datasets,
)
from app.services.variable_service import classify_variables, summarize_dataset
from app.services.stats_service import (
    t_test_independent,
    t_test_paired,
    one_sample_t_test,
    normality_test,
    levene_variance_test,
    anova_oneway,
    chi_square_test,
    fisher_exact_test,
    mann_whitney_u_test,
    kruskal_wallis_test,
    wilcoxon_signed_rank_test,
    mcnemar_test,
    friedman_test,
    repeated_measures_anova,
    pearson_correlation,
    spearman_correlation,
    log_rank_test,
    discriminant_analysis,
    logistic_regression,
    linear_regression,
    ancova,
    calc_descriptive,
)
from app.services.table_service import (
    build_result_table,
    build_group_stats_table,
    build_post_hoc_table,
    build_descriptive_summary,
    build_baseline_table,
    build_descriptive_table,
    build_missing_table,
)
from app.services.result_service import build_result_discussion
from app.services.export_service import (
    export_to_csv,
    export_to_excel,
    export_to_html_table,
)
from app.services.sample_service import EXAMPLE_MAKERS
from app.services.params_catalog import get_test_params, get_all_test_params
import re

# Ensure dirs exist
for d in [STATIC_DIR, EXAMPLES_DIR, UPLOADS_DIR, OUTPUTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Generate comprehensive example CSV if missing
_comprehensive_csv = EXAMPLES_DIR / "comprehensive_example.csv"
if not _comprehensive_csv.exists():
    try:
        from app.services.sample_service import make_comprehensive_example
        make_comprehensive_example().to_csv(_comprehensive_csv, index=False, encoding="utf-8-sig")
    except Exception:
        pass

app = FastAPI(
    title="Basic Clinical Statistics Platform",
    version="2.1.0",
    description="临床基础统计分析 — 集成22种临床统计方法、出版级可视化、三线表与基线特征表生成",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return (STATIC_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": "2.1.0"}


# ── Upload ─────────────────────────────────────────────


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> dict:
    try:
        meta = await save_upload(file)
        df = read_file(meta["path"], meta["filename"])
        var_types = classify_variables(df)
        summary = summarize_dataset(df, var_types)
        sheets = get_sheet_names(meta["path"], meta["filename"])
        preview = df.fillna("").to_dict(orient="records")
        return {
            "upload_id": meta["upload_id"],
            "filename": meta["filename"],
            "file_type": meta["ext"],
            "sheet_names": sheets if sheets else None,
            "row_count": len(df),
            "col_count": len(df.columns),
            "columns": list(df.columns),
            "dtypes": {c: str(df[c].dtype) for c in df.columns},
            "variable_types": var_types,
            "preview": preview,
            "missing_percent": summary["missing_percent"],
            "summary": summary,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@app.post("/api/read-sheet")
async def read_sheet(
    payload: dict | None = Body(default=None),
    upload_id: str = "",
    sheet_name: str = "",
) -> dict:
    if payload:
        upload_id = payload.get("upload_id", upload_id)
        sheet_name = payload.get("sheet_name", sheet_name)
    filepath = None
    filename = ""
    for f in UPLOADS_DIR.iterdir():
        if f.stem.startswith(upload_id):
            filepath = str(f)
            filename = f.name.split("_", 1)[1] if "_" in f.name else f.name
            break
    if not filepath:
        raise HTTPException(status_code=404, detail="Upload not found")
    df = read_file(filepath, filename, sheet_name if sheet_name else None)
    var_types = classify_variables(df)
    summary = summarize_dataset(df, var_types)
    return {
        "upload_id": upload_id,
        "sheet_name": sheet_name,
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "variable_types": var_types,
        "preview": df.fillna("").to_dict(orient="records"),
        "missing_percent": summary["missing_percent"],
        "summary": summary,
    }


# ── Examples ───────────────────────────────────────────


@app.get("/api/examples")
def list_examples() -> list[dict]:
    return get_example_datasets()


@app.get("/api/examples/{name}")
def get_example(name: str) -> dict:
    filepath = EXAMPLES_DIR / f"{name}.csv"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail=f"Example dataset '{name}' not found")
    df = pd.read_csv(filepath)
    var_types = classify_variables(df)
    summary = summarize_dataset(df, var_types)
    return {
        "name": name,
        "filename": f"{name}.csv",
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "variable_types": var_types,
        "preview": df.fillna("").to_dict(orient="records"),
        "missing_percent": summary["missing_percent"],
        "summary": summary,
    }


@app.get("/api/examples/{name}/download")
def download_example(name: str) -> FileResponse:
    filepath = EXAMPLES_DIR / f"{name}.csv"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Example not found")
    return FileResponse(filepath, media_type="text/csv", filename=f"{name}.csv")


# ── Test Parameter Definitions ────────────────────────────────


@app.get("/api/test-params")
def list_test_params() -> dict:
    """Return parameter definitions for all test types."""
    return {"test_params": get_all_test_params()}


@app.get("/api/test-params/{test_type}")
def get_test_param(test_type: str) -> dict:
    """Return parameter definitions for a specific test type."""
    params = get_test_params(test_type)
    if not params:
        return {"test_type": test_type, "params": []}
    return {"test_type": test_type, "params": params}


# ── Auto-Recommend Roles ──────────────────────────────────────


def _is_id_like_col(col: str) -> bool:
    return bool(re.search(r"(^id$|_id$|id_|subject|patient|sample|编号)", str(col), flags=re.I))


def _is_numeric_col(df: pd.DataFrame, col: str) -> bool:
    return col in df.columns and pd.api.types.is_numeric_dtype(df[col])


def _is_discrete_col(df: pd.DataFrame, col: str) -> bool:
    if col not in df.columns: return False
    s = df[col].dropna()
    if s.empty: return False
    u = int(s.nunique())
    if u < 2 or u > 30: return False
    return True


@app.post("/api/recommend-roles")
def recommend_roles(req: dict) -> dict:
    """Auto-recommend research vars, covars, and outcomes for a method."""
    method_id = str(req.get("method_id", ""))
    df = _get_df_simple(req)
    try:
        var_types = classify_variables(df.copy())
    except Exception:
        var_types = {}

    def dedupe(values: list[str]) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for value in values:
            if value in df.columns and value not in seen:
                result.append(value)
                seen.add(value)
        return result

    id_cols = [c for c in df.columns if _is_id_like_col(c)]
    all_cols = [c for c in df.columns if c not in id_cols]
    numeric = [c for c in all_cols if _is_numeric_col(df, c) and df[c].nunique(dropna=True) > 1]
    numeric_cont = dedupe((var_types.get("continuous") or []) + [c for c in numeric if df[c].nunique(dropna=True) > 10])
    discrete = [c for c in all_cols if _is_discrete_col(df, c)]
    binary = [c for c in discrete if int(df[c].dropna().nunique()) == 2]
    group_candidates = dedupe((var_types.get("group") or []) + [c for c in discrete if re.search(r"group|treat|arm|sex|gender|class|type|分组|组别|性别|分类", str(c), re.I)] + discrete)
    outcome_candidates = dedupe((var_types.get("outcome_candidate") or []) + [c for c in all_cols if re.search(r"outcome|response|target|label|score|event|death|status|disease|diagnosis|结局|响应|标签|评分|事件|死亡|疾病|诊断", str(c), re.I)])
    subject_candidates = dedupe(id_cols + [c for c in df.columns if re.search(r"subject|patient|sample|record|id|编号|受试", str(c), re.I)])

    def exclude(pool: list[str], values: list[str] | tuple[str, ...]) -> list[str]:
        blocked = {v for v in values if v}
        return [c for c in pool if c not in blocked]

    def pick(pattern: str, pool: list[str], pred=None, fallback: bool = True) -> str:
        rgx = re.compile(pattern, re.I)
        for c in pool:
            if rgx.search(str(c)) and (pred is None or pred(c)):
                return c
        return pool[0] if fallback and pool else ""

    def choose_group(excluded: list[str] | tuple[str, ...] = (), require_binary: bool = False) -> str:
        pool = exclude(group_candidates, excluded)
        if require_binary:
            # For methods that require exactly 2 groups (t-test, Mann-Whitney),
            # restrict to columns with exactly 2 unique non-null values
            pool = [c for c in pool if int(df[c].dropna().nunique()) == 2]
        if not pool:
            return ""
        return pick(r"group|treat|arm|sex|gender|class|type|分组|组别|性别|分类", pool) or pool[0]

    def choose_linear_outcome() -> str:
        pool = dedupe(
            [c for c in outcome_candidates if c in numeric_cont]
            + numeric_cont
            + [c for c in numeric if c not in binary]
            + numeric
        )
        return pick(r"outcome|response|score|value|bmi|sbp|dbp|glucose|cholesterol|指标|评分|结局|响应", pool)

    def choose_binary_outcome() -> str:
        preferred = [c for c in binary if re.search(r"outcome|response|target|label|event|death|status|disease|diagnosis|结局|响应|标签|事件|死亡|疾病|诊断", str(c), re.I)]
        fallback = [c for c in binary if not re.search(r"sex|gender|group|treat|arm|分组|组别|性别", str(c), re.I)]
        return (dedupe(preferred + fallback + binary) or [""])[0]

    def choose_predictors(outcome: str, max_count: int, numeric_only: bool = False) -> list[str]:
        if numeric_only:
            pool = exclude(numeric, (outcome,))
        else:
            low_card = [c for c in discrete if c != outcome and c not in id_cols]
            pool = dedupe(exclude(numeric, (outcome,)) + low_card)
        preferred = [c for c in pool if not re.search(r"outcome|target|label|event|death|status|结局|标签|事件|死亡", str(c), re.I)]
        return dedupe(preferred + pool)[:max_count]

    roles = {"research_vars": [], "covar_vars": [], "outcome_vars": []}
    params = {}

    if method_id in ("t_test_independent", "levene_test", "anova", "mann_whitney", "kruskal_wallis"):
        # t_test and mann_whitney require exactly 2 groups → restrict to binary columns
        need_binary = method_id in ("t_test_independent", "mann_whitney")
        grp = choose_group(require_binary=need_binary)
        out = choose_linear_outcome()
        roles = {"research_vars": [grp] if grp else [], "covar_vars": [], "outcome_vars": [out] if out else []}
        if method_id == "t_test_independent":
            params["equal_var"] = "False"
        if method_id == "anova" and grp and df[grp].nunique(dropna=True) >= 3:
            params["post_hoc"] = "tukey"
        if method_id == "kruskal_wallis" and grp and df[grp].nunique(dropna=True) >= 3:
            params["post_hoc"] = "bonferroni"
    elif method_id in ("t_test_paired", "wilcoxon_signed_rank"):
        pre = pick(r"before|pre|baseline|visit1|time1|前|基线", numeric)
        post = pick(r"after|post|followup|visit2|time2|后|随访", exclude(numeric, (pre,)))
        if not pre and not post:
            pre = numeric[0] if len(numeric) > 0 else ""
            post = numeric[1] if len(numeric) > 1 else ""
        roles = {"research_vars": [], "covar_vars": [], "outcome_vars": [pre, post] if pre and post else []}
    elif method_id in ("one_sample_t_test", "normality_test"):
        out = choose_linear_outcome()
        roles = {"research_vars": [], "covar_vars": [], "outcome_vars": [out] if out else []}
    elif method_id in ("chi_square", "fisher_exact"):
        outcome_pool = dedupe(outcome_candidates + discrete)
        dv1 = pick(r"outcome|event|death|status|disease|diagnosis|结局|事件|死亡|疾病|诊断", outcome_pool)
        dv2 = choose_group((dv1,)) or (exclude(discrete, (dv1,))[0] if len(exclude(discrete, (dv1,))) else "")
        roles = {"research_vars": [dv2] if dv2 else [], "covar_vars": [], "outcome_vars": [dv1] if dv1 else []}
        params["correction"] = "auto"
    elif method_id == "mcnemar":
        pre = pick(r"before|pre|baseline|old|test1|前|基线", discrete)
        post = pick(r"after|post|followup|new|test2|后|随访", exclude(discrete, (pre,)))
        if not pre or not post:
            pre = discrete[0] if len(discrete) > 0 else ""
            post = discrete[1] if len(discrete) > 1 else ""
        roles = {"research_vars": [], "covar_vars": [], "outcome_vars": [pre, post] if pre and post else []}
    elif method_id in ("pearson_correlation", "spearman_correlation"):
        x1 = numeric[0] if len(numeric) > 0 else ""
        x2 = numeric[1] if len(numeric) > 1 else ""
        roles = {"research_vars": [], "covar_vars": [], "outcome_vars": [x1, x2] if x1 and x2 else []}
    elif method_id == "log_rank":
        tm = pick(r"time|survival|duration|follow|days|months|时间|生存|随访|天|月", numeric) or (numeric[0] if numeric else "")
        ev = pick(r"event|death|status|outcome|dead|failure|事件|死亡|结局", binary) or (binary[0] if binary else "")
        grp = choose_group((tm, ev)) or (exclude(binary, (ev, tm))[0] if exclude(binary, (ev, tm)) else "")
        roles = {"research_vars": [grp, tm] if grp and tm else ([grp] if grp else []), "covar_vars": [], "outcome_vars": [ev] if ev else []}
    elif method_id in ("logistic_regression", "linear_regression"):
        out = choose_binary_outcome() if method_id == "logistic_regression" else choose_linear_outcome()
        xvars = choose_predictors(out, 6, numeric_only=False)
        roles = {"research_vars": xvars, "covar_vars": [], "outcome_vars": [out] if out else []}
        if method_id == "logistic_regression":
            params.update({"max_iter": 2000, "C": 1.0})
    elif method_id in ("discriminant_analysis", "quadratic_discriminant_analysis"):
        grp = pick(r"group|disease|diagnosis|class|type|outcome|分组|疾病|诊断|分类|结局", dedupe(outcome_candidates + group_candidates + discrete)) or (discrete[0] if discrete else "")
        xvars = choose_predictors(grp, 6, numeric_only=True)
        roles = {"research_vars": xvars, "covar_vars": [], "outcome_vars": [grp] if grp else []}
        params["cv_folds"] = "5"
        if method_id == "quadratic_discriminant_analysis":
            params["reg_param"] = 0.2
    elif method_id == "ancova":
        out = choose_linear_outcome()
        grp = choose_group((out,))
        cov = exclude(numeric, (out, grp))[:1]
        roles = {"research_vars": [grp] if grp else [], "covar_vars": cov, "outcome_vars": [out] if out else []}
    elif method_id in ("repeated_measures_anova", "friedman"):
        out = choose_linear_outcome()
        subj = pick(r"subject|patient|sample|record|id|受试|编号", subject_candidates)
        grp = pick(r"time|timepoint|period|visit|wave|week|month|时间|周期|访视|阶段", exclude(all_cols, (out, subj))) or (exclude(discrete, (out, subj))[0] if exclude(discrete, (out, subj)) else "")
        roles = {"research_vars": [grp] if grp else [], "covar_vars": [subj] if subj else [], "outcome_vars": [out] if out else []}

    for key in roles:
        roles[key] = dedupe([c for c in roles[key] if c in df.columns])

    def is_available() -> bool:
        research = roles.get("research_vars") or []
        covars = roles.get("covar_vars") or []
        outcomes = roles.get("outcome_vars") or []
        if method_id in ("t_test_independent", "levene_test", "anova", "mann_whitney", "kruskal_wallis", "ancova"):
            if not research or not outcomes:
                return False
            if method_id == "ancova" and not covars:
                return False
            # t_test_independent and mann_whitney require exactly 2 groups
            if method_id in ("t_test_independent", "mann_whitney"):
                grp_col = research[0]
                if grp_col not in df.columns:
                    return False
                n_groups = int(df[grp_col].dropna().nunique())
                if n_groups != 2:
                    return False
            return True
        if method_id in ("t_test_paired", "wilcoxon_signed_rank", "mcnemar", "pearson_correlation", "spearman_correlation"):
            return len(outcomes) >= 2
        if method_id in ("one_sample_t_test", "normality_test"):
            return bool(outcomes)
        if method_id in ("chi_square", "fisher_exact"):
            return bool(research and outcomes)
        if method_id == "log_rank":
            return len(research) >= 2 and bool(outcomes)
        if method_id in ("logistic_regression", "linear_regression", "discriminant_analysis", "quadratic_discriminant_analysis"):
            return bool(research and outcomes)
        if method_id in ("repeated_measures_anova", "friedman"):
            return bool(research and covars and outcomes)
        return bool(outcomes)

    available = is_available()

    return {
        "method_id": method_id,
        "available": available,
        "reason": "" if available else "未找到满足当前统计方法的变量组合，请检查变量类型、分组数、结局变量和样本量。",
        "roles": roles,
        "params": params,
    }


# ── Dataset Data ───────────────────────────────────────────
def dataset_data(req: dict) -> dict:
    df = _get_df_simple(req)
    var_types = classify_variables(df.copy())
    summary = summarize_dataset(df.copy(), var_types)
    return {
        "name": req.get("dataset_name") or req.get("upload_id") or "active_dataset",
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "variable_types": var_types,
        "summary": summary,
        "data": _df_to_column_data(df),
    }


# ── Statistical Analysis ───────────────────────────────


@app.post("/api/analyze")
def run_analysis(req: AnalyzeRequest) -> dict:
    """Run a statistical analysis based on the request."""
    df = _get_df(req)

    test_type = req.test_type
    var = req.var
    group_var = req.group_var
    paired_var = req.paired_var
    post_hoc = req.post_hoc
    method_params = req.params or {}

    if not var or var not in df.columns:
        if test_type not in ("logistic_regression", "linear_regression", "ancova", "log_rank"):
            raise HTTPException(status_code=400, detail=f"Variable '{var}' not found in dataset")

    try:
        # ── Parametric Tests ──
        if test_type == "t_test_independent":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Independent t-test requires a group variable")
            result = t_test_independent(df, var, group_var, method_params)

        elif test_type == "t_test_paired":
            if not paired_var or paired_var not in df.columns:
                raise HTTPException(status_code=400, detail="Paired t-test requires a paired variable")
            result = t_test_paired(df, var, paired_var, method_params)

        elif test_type == "one_sample_t_test":
            result = one_sample_t_test(df, var, method_params=method_params)

        elif test_type == "normality_test":
            result = normality_test(df, var, method_params)

        elif test_type == "levene_test":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Levene test requires a group variable")
            result = levene_variance_test(df, var, group_var, method_params)

        elif test_type == "anova":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="ANOVA requires a group variable")
            result = anova_oneway(df, var, group_var, post_hoc, method_params)

        elif test_type == "repeated_measures_anova":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Repeated measures ANOVA requires a group variable")
            subject_var = getattr(req, "subject_var", "") or req.upload_id or ""
            if not subject_var or subject_var not in df.columns:
                # Try to infer subject column
                subject_candidates = [c for c in df.columns if "subject" in c.lower() or "patient" in c.lower() or "id" in c.lower()]
                if subject_candidates:
                    subject_var = subject_candidates[0]
                else:
                    raise HTTPException(status_code=400, detail="Repeated measures ANOVA requires a subject variable")
            result = repeated_measures_anova(df, var, subject_var, group_var, method_params=method_params)

        elif test_type == "ancova":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="ANCOVA requires a group variable")
            covar = getattr(req, "covar", "")
            if not covar or covar not in df.columns:
                raise HTTPException(status_code=400, detail="ANCOVA requires a covariate variable")
            result = ancova(df, var, group_var, covar, method_params)

        # ── Non-parametric Tests ──
        elif test_type == "mann_whitney":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Mann-Whitney U test requires a group variable")
            result = mann_whitney_u_test(df, var, group_var, method_params)

        elif test_type == "kruskal_wallis":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Kruskal-Wallis test requires a group variable")
            result = kruskal_wallis_test(df, var, group_var, post_hoc, method_params)

        elif test_type == "wilcoxon_signed_rank":
            if not paired_var or paired_var not in df.columns:
                raise HTTPException(status_code=400, detail="Wilcoxon signed-rank test requires a paired variable")
            result = wilcoxon_signed_rank_test(df, var, paired_var, method_params)

        elif test_type == "friedman":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Friedman test requires a group variable")
            subject_var = getattr(req, "subject_var", "")
            if not subject_var or subject_var not in df.columns:
                subject_candidates = [c for c in df.columns if "subject" in c.lower() or "patient" in c.lower() or "id" in c.lower()]
                if subject_candidates:
                    subject_var = subject_candidates[0]
                else:
                    raise HTTPException(status_code=400, detail="Friedman test requires a subject variable")
            result = friedman_test(df, var, subject_var, group_var, method_params)

        # ── Categorical Tests ──
        elif test_type == "chi_square":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Chi-square test requires a group variable")
            result = chi_square_test(df, var, group_var, method_params)

        elif test_type == "fisher_exact":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Fisher's exact test requires a group variable")
            result = fisher_exact_test(df, var, group_var, method_params)

        elif test_type == "mcnemar":
            if not paired_var or paired_var not in df.columns:
                raise HTTPException(status_code=400, detail="McNemar test requires a paired variable")
            result = mcnemar_test(df, var, paired_var, method_params=method_params)

        # ── Correlation ──
        elif test_type == "pearson_correlation":
            var2 = getattr(req, "var2", paired_var) or paired_var or ""
            if not var2 or var2 not in df.columns:
                raise HTTPException(status_code=400, detail="Pearson correlation requires a second variable")
            result = pearson_correlation(df, var, var2, method_params)

        elif test_type == "spearman_correlation":
            var2 = getattr(req, "var2", paired_var) or paired_var or ""
            if not var2 or var2 not in df.columns:
                raise HTTPException(status_code=400, detail="Spearman correlation requires a second variable")
            result = spearman_correlation(df, var, var2, method_params)

        # ── Survival ──
        elif test_type == "log_rank":
            if not group_var or group_var not in df.columns:
                raise HTTPException(status_code=400, detail="Log-rank test requires a group variable")
            time_var = getattr(req, "time_var", "")
            event_var = getattr(req, "event_var", paired_var) or paired_var or ""
            if not time_var or time_var not in df.columns:
                raise HTTPException(status_code=400, detail="Log-rank test requires a time variable")
            if not event_var or event_var not in df.columns:
                raise HTTPException(status_code=400, detail="Log-rank test requires an event variable")
            result = log_rank_test(df, time_var, event_var, group_var, method_params)

        # ── Regression ──
        elif test_type == "logistic_regression":
            predictor_vars = getattr(req, "predictor_vars", None) or getattr(req, "x_vars", None) or []
            if not predictor_vars:
                # Auto-select numeric predictors
                num_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != var]
                predictor_vars = num_cols[:5]
            if not predictor_vars:
                raise HTTPException(status_code=400, detail="Logistic regression requires predictor variables")
            result = logistic_regression(df, var, predictor_vars, method_params)

        elif test_type == "linear_regression":
            x_vars = getattr(req, "x_vars", None) or getattr(req, "predictor_vars", None) or []
            if not x_vars:
                num_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c != var]
                x_vars = num_cols[:5]
            if not x_vars:
                raise HTTPException(status_code=400, detail="Linear regression requires predictor variables")
            result = linear_regression(df, var, x_vars, method_params)

        elif test_type in ("discriminant_analysis", "quadratic_discriminant_analysis"):
            predictor_vars = getattr(req, "predictor_vars", None) or getattr(req, "x_vars", None) or []
            if not predictor_vars:
                predictor_vars = [c for c in df.select_dtypes(include=[np.number]).columns if c != var][:6]
            if not predictor_vars:
                raise HTTPException(status_code=400, detail="Discriminant analysis requires predictor variables")
            method = "qda" if test_type == "quadratic_discriminant_analysis" else "lda"
            result = discriminant_analysis(df, var, predictor_vars, method=method, method_params=method_params)

        else:
            raise HTTPException(status_code=400, detail=f"Unknown test type: {test_type}")

        # Check for error
        if "error" in result:
            return _sanitize({"status": "error", "message": result["error"], "result": result})

        # Build auxiliary tables
        result_table = build_result_table(result)
        group_table = build_group_stats_table(result)
        post_hoc_table = build_post_hoc_table(result)
        discussion = build_result_discussion(result, {
            "var": var,
            "group_var": group_var,
            "paired_var": paired_var,
            "post_hoc": post_hoc,
            "test_type": test_type,
        })

        return _sanitize({
            "status": "ok",
            "result": result,
            "discussion": discussion,
            "tables": {
                "result": result_table,
                "group_stats": group_table,
                "post_hoc": post_hoc_table,
            },
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/descriptive")
def descriptive_stats(req: AnalyzeRequest) -> dict:
    """Get descriptive statistics for the dataset."""
    df = _get_df(req)
    variables = req.variables if hasattr(req, 'variables') and req.variables else None
    table = build_descriptive_summary(df, variables)
    var_types = classify_variables(df)
    summary = summarize_dataset(df, var_types)
    return _sanitize({"status": "ok", "table": table, "summary": summary})


# ── Tables ─────────────────────────────────────────────


@app.post("/api/table/baseline")
@app.post("/api/tables/baseline")
def baseline_table(req: TableRequest | AnalyzeRequest) -> dict:
    """Generate baseline characteristics table (Table 1)."""
    df = _get_df(req)
    group_var = req.group_var
    if not group_var or group_var not in df.columns:
        # Auto-select group var
        cat_cols = [c for c in df.columns if df[c].nunique() <= 10 and df[c].nunique() >= 2]
        if cat_cols:
            group_var = cat_cols[0]
        else:
            raise HTTPException(status_code=400, detail="No suitable group variable found")
    variables = req.variables if hasattr(req, 'variables') and req.variables else None
    decimal_places = req.decimal_places if hasattr(req, 'decimal_places') else 2
    p_digits = req.p_digits if hasattr(req, 'p_digits') else 3
    table = build_baseline_table(df, group_var, variables, decimal_places, p_digits)
    return _sanitize({"status": "ok", "columns": table.get("columns", []), "rows": table.get("rows", []), "n_total": table.get("n_total", len(df))})


@app.post("/api/table/descriptive")
@app.post("/api/tables/descriptive")
def descriptive_table(req: TableRequest | AnalyzeRequest) -> dict:
    """Generate overall descriptive statistics table."""
    df = _get_df(req)
    variables = req.variables if hasattr(req, 'variables') and req.variables else None
    decimal_places = req.decimal_places if hasattr(req, 'decimal_places') else 2
    table = build_descriptive_table(df, variables, decimal_places)
    return _sanitize({"status": "ok", "columns": table.get("columns", []), "rows": table.get("rows", []), "n_total": len(df)})


@app.post("/api/table/missing")
@app.post("/api/tables/missing")
def missing_table(req: TableRequest | AnalyzeRequest) -> dict:
    """Generate missing value statistics table."""
    df = _get_df(req)
    table = build_missing_table(df)
    return _sanitize({"status": "ok", "columns": table.get("columns", []), "rows": table.get("rows", []), "n_total": len(df)})


# ── Chart ──────────────────────────────────────────────


@app.post("/api/chart/variables")
def chart_variables(req: dict) -> dict:
    """Get recommended variables for chart type."""
    from app.services.chart_service import get_chart_variables
    df = _get_df_simple(req)
    chart_type = req.get("chart_type", "box_violin")
    return _sanitize(get_chart_variables(df, chart_type))


@app.post("/api/chart/data")
def chart_data(req: ChartRequest) -> dict:
    """Prepare chart data for rendering."""
    from app.services.chart_service import prepare_chart_data
    df = _get_df_simple(req.dict() if hasattr(req, "dict") else req)
    return prepare_chart_data(df, req.chart_type, req.dict())


# ── Publication Export ─────────────────────────────────


@app.post("/api/export/chart/publication")
@app.post("/api/publication/export")
def publication_export(req: dict) -> Response:
    """Export chart as publication-quality image (PNG/SVG/PDF)."""
    from app.services.publication_chart_service import (
        set_publication_style,
        generate_scatter_plot,
        generate_box_plot,
        generate_bar_plot,
        generate_line_plot,
        generate_forest_plot,
        generate_survival_plot,
        generate_roc_plot,
        generate_heatmap,
        generate_histogram,
        generate_china_map,
        generate_world_map,
    )

    df = _get_df_simple(req)
    chart_type = req.get("chart_type", "scatter")
    fmt = req.get("format", "png")
    title = req.get("title", "")
    style = req.get("style", "cns")
    x_var = req.get("x_var", "")
    y_var = req.get("y_var", "")
    color_var = req.get("color_var", "")
    group_var = req.get("group_var", "")
    label_var = req.get("label_var", "")

    # Set publication style
    user_colors = req.get("colors") or None
    user_marker_size = req.get("marker_size")
    user_line_width = req.get("line_width")
    set_publication_style(style, colors=user_colors, marker_size=user_marker_size, line_width=user_line_width)

    generators = {
        "scatter": lambda: generate_scatter_plot(df, x_var, y_var, color_var or None, title, style),
        "box": lambda: generate_box_plot(df, y_var, x_var or None, color_var or None, title, style),
        "bar": lambda: generate_bar_plot(df, x_var, y_var, color_var or None, title, style),
        "line": lambda: generate_line_plot(df, x_var, y_var, color_var or None, title, style),
        "forest": lambda: generate_forest_plot(df, label_var, y_var, req.get("ci_lower_var", ""), req.get("ci_upper_var", ""), title, style),
        "survival": lambda: generate_survival_plot(df, x_var, y_var, group_var or None, title, style),
        "roc": lambda: generate_roc_plot(df, y_var, x_var, title, style),
        "heatmap": lambda: generate_heatmap(df, req.get("value_vars", []), title, style),
        "histogram": lambda: generate_histogram(df, x_var, color_var or None, title, style),
        "china_map": lambda: generate_china_map(df, x_var, y_var, title, style),
        "world_map": lambda: generate_world_map(df, x_var, y_var, title, style),
    }

    gen = generators.get(chart_type)
    if not gen:
        raise HTTPException(status_code=400, detail=f"Unknown chart type: {chart_type}")

    png_bytes, svg_bytes, pdf_bytes = gen()

    if fmt == "svg":
        return Response(content=svg_bytes, media_type="image/svg+xml")
    elif fmt == "pdf":
        return Response(content=pdf_bytes, media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=chart.pdf"})
    else:
        return Response(content=png_bytes, media_type="image/png")


# ── Export ─────────────────────────────────────────────


@app.post("/api/export/stat-chart/publication")
def export_stat_chart_publication(req: dict = Body(...)) -> Response:
    """Export the current statistical result chart as a publication-quality image."""
    from app.services.publication_chart_service import generate_statistical_chart

    chart_data = req.get("chart_data") or (req.get("result") or {}).get("chart_data") or {}
    if not chart_data:
        raise HTTPException(status_code=400, detail="chart_data is required")

    fmt = str(req.get("format", "png")).lower()
    if fmt not in {"png", "svg", "pdf"}:
        raise HTTPException(status_code=400, detail="format must be png, svg, or pdf")

    style = _normalize_publication_style(req.get("style", "cns"))
    title = req.get("title") or chart_data.get("title") or "Statistical result"
    png_bytes, svg_bytes, pdf_bytes = generate_statistical_chart(chart_data, title=title, style=style)

    if fmt == "svg":
        return Response(
            content=svg_bytes,
            media_type="image/svg+xml",
            headers={"Content-Disposition": "attachment; filename=statistical_chart.svg"},
        )
    if fmt == "pdf":
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=statistical_chart.pdf"},
        )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=statistical_chart.png"},
    )


@app.post("/api/export/table-csv")
def export_table_csv(req: ExportRequest) -> FileResponse:
    data = req.table_data or []
    dest = export_to_csv(data, "statistics_export")
    return FileResponse(dest, media_type="text/csv", filename="statistics_export.csv")


@app.post("/api/export/table-excel")
def export_table_excel(req: ExportRequest) -> FileResponse:
    data = req.table_data or []
    dest = export_to_excel(data, "statistics_export")
    return FileResponse(
        dest,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="statistics_export.xlsx",
    )


@app.post("/api/export/table-html")
def export_table_html(req: ExportRequest) -> Response:
    data = req.table_data or []
    html = export_to_html_table(data)
    return Response(content=html, media_type="text/html")


# ── Helpers ────────────────────────────────────────────


def _normalize_publication_style(style: str | None) -> str:
    value = str(style or "cns").lower()
    if "nature" in value:
        return "nature"
    return "cns"


def _get_df(req: AnalyzeRequest | TableRequest) -> pd.DataFrame:
    if req.use_demo or not req.upload_id:
        ds = req.dataset_name or "comprehensive_example"
        filepath = EXAMPLES_DIR / f"{ds}.csv"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"Example dataset '{ds}' not found")
        return pd.read_csv(filepath)

    upload_id = req.upload_id
    filepath = None
    filename = ""
    for f in UPLOADS_DIR.iterdir():
        if f.stem.startswith(upload_id):
            filepath = str(f)
            filename = f.name.split("_", 1)[1] if "_" in f.name else f.name
            break
    if not filepath:
        raise HTTPException(status_code=404, detail="Upload not found")
    return read_file(filepath, filename, req.sheet_name if hasattr(req, "sheet_name") else None)


def _get_df_simple(req: dict) -> pd.DataFrame:
    if req.get("use_demo") or not req.get("upload_id"):
        ds = req.get("dataset_name") or "general_clinical_example"
        filepath = EXAMPLES_DIR / f"{ds}.csv"
        if not filepath.exists():
            raise HTTPException(status_code=404, detail=f"Example dataset '{ds}' not found")
        return pd.read_csv(filepath)

    upload_id = req.get("upload_id", "")
    filepath = None
    filename = ""
    for f in UPLOADS_DIR.iterdir():
        if f.stem.startswith(upload_id):
            filepath = str(f)
            filename = f.name.split("_", 1)[1] if "_" in f.name else f.name
            break
    if not filepath:
        raise HTTPException(status_code=404, detail="Upload not found")
    return read_file(filepath, filename, req.get("sheet_name"))


def _json_value(value):
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if isinstance(value, (pd.Timestamp, pd.Timedelta)):
        return str(value)
    if isinstance(value, np.generic):
        return value.item()
    return value


def _df_to_column_data(df: pd.DataFrame) -> dict[str, list]:
    return {str(col): [_json_value(v) for v in df[col].tolist()] for col in df.columns}


def _sanitize(obj):
    """Recursively convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, dict):
        return {str(k): _sanitize(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [_sanitize(v) for v in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj)
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return _sanitize(obj.tolist())
    elif isinstance(obj, pd.Timestamp):
        return str(obj)
    return obj
