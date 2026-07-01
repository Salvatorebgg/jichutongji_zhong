from __future__ import annotations

"""
Parameter definitions for each statistical test method.

Each entry defines the configurable parameters users can adjust before running analysis.
Pattern matches mlhigh_zhong's METHOD_PARAM_EXTENSIONS + PARAM_CONTROL_BOOSTS.
"""

# ── Common parameters shared across many tests ────────────────────

_COMMON_ALPHA = {
    "key": "alpha",
    "label": "显著性水平 α",
    "label_en": "Significance level",
    "type": "select",
    "default": "0.05",
    "options": ["0.01", "0.05", "0.10", "0.001"],
}

_COMMON_ALTERNATIVE = {
    "key": "alternative",
    "label": "备择假设",
    "label_en": "Alternative hypothesis",
    "type": "select",
    "default": "two-sided",
    "options": ["two-sided", "less", "greater"],
}

_COMMON_RANDOM_STATE = {
    "key": "random_state",
    "label": "随机种子",
    "label_en": "Random seed",
    "type": "number",
    "default": 42,
    "min": 0,
    "max": 9999,
    "step": 1,
}

# ── Test-specific parameter definitions ──────────────────────────

TEST_PARAMS = {
    # ═══ Parametric Tests ═══
    "t_test_independent": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
        {
            "key": "equal_var",
            "label": "方差齐性假设",
            "label_en": "Assume equal variance",
            "type": "select",
            "default": "False",
            "options": ["False", "True"],
            "note": "True=Student's t-test, False=Welch's t-test（推荐）",
        },
    ],
    "t_test_paired": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
    ],
    "one_sample_t_test": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
        {
            "key": "hypothesized_mean",
            "label": "参考均值 μ₀",
            "label_en": "Reference mean",
            "type": "number",
            "default": 0.0,
            "min": -999999.0,
            "max": 999999.0,
            "step": 0.1,
        },
    ],
    "normality_test": [
        _COMMON_ALPHA,
    ],
    "levene_test": [
        _COMMON_ALPHA,
        {
            "key": "center",
            "label": "中心化方法",
            "label_en": "Centering method",
            "type": "select",
            "default": "median",
            "options": ["median", "mean"],
            "note": "median=Brown-Forsythe（推荐，稳健）, mean=经典Levene",
        },
    ],
    "anova": [
        _COMMON_ALPHA,
        {
            "key": "post_hoc",
            "label": "事后检验方法",
            "label_en": "Post-hoc method",
            "type": "select",
            "default": "",
            "options": ["", "tukey", "bonferroni", "lsd", "games_howell"],
            "note": "仅当ANOVA显著且≥3组时有效",
        },
    ],
    "repeated_measures_anova": [
        _COMMON_ALPHA,
    ],
    "ancova": [
        _COMMON_ALPHA,
    ],

    # ═══ Non-parametric Tests ═══
    "mann_whitney": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
    ],
    "kruskal_wallis": [
        _COMMON_ALPHA,
        {
            "key": "post_hoc",
            "label": "事后检验方法",
            "label_en": "Post-hoc method",
            "type": "select",
            "default": "",
            "options": ["", "bonferroni"],
            "note": "Kruskal-Wallis显著后的两两比较（Bonferroni校正Mann-Whitney）",
        },
    ],
    "wilcoxon_signed_rank": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
    ],
    "friedman": [
        _COMMON_ALPHA,
    ],

    # ═══ Categorical Tests ═══
    "chi_square": [
        _COMMON_ALPHA,
        {
            "key": "correction",
            "label": "连续性校正",
            "label_en": "Continuity correction",
            "type": "select",
            "default": "auto",
            "options": ["auto", "yes", "no"],
            "note": "auto=根据期望频数自动判断，yes=Yates校正，no=标准Pearson卡方",
        },
    ],
    "fisher_exact": [
        _COMMON_ALPHA,
    ],
    "mcnemar": [
        _COMMON_ALPHA,
        {
            "key": "continuity_correction",
            "label": "连续性校正",
            "label_en": "Continuity correction",
            "type": "select",
            "default": "True",
            "options": ["True", "False"],
        },
    ],

    # ═══ Correlation Analysis ═══
    "pearson_correlation": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
    ],
    "spearman_correlation": [
        _COMMON_ALPHA,
        _COMMON_ALTERNATIVE,
    ],

    # ═══ Survival Analysis ═══
    "log_rank": [
        _COMMON_ALPHA,
    ],

    # ═══ Regression & Discriminant ═══
    "logistic_regression": [
        _COMMON_ALPHA,
        _COMMON_RANDOM_STATE,
        {
            "key": "max_iter",
            "label": "最大迭代次数",
            "label_en": "Max iterations",
            "type": "number",
            "default": 2000,
            "min": 100,
            "max": 10000,
            "step": 100,
        },
        {
            "key": "C",
            "label": "正则化强度 C",
            "label_en": "Regularization C",
            "type": "number",
            "default": 1.0,
            "min": 0.01,
            "max": 100.0,
            "step": 0.1,
            "note": "C越大正则化越弱；C=1为默认L2正则化",
        },
    ],
    "linear_regression": [
        _COMMON_ALPHA,
        _COMMON_RANDOM_STATE,
    ],
    "discriminant_analysis": [
        _COMMON_RANDOM_STATE,
        {
            "key": "cv_folds",
            "label": "交叉验证折数",
            "label_en": "CV folds",
            "type": "select",
            "default": "5",
            "options": ["3", "5", "10"],
        },
    ],
    "quadratic_discriminant_analysis": [
        _COMMON_RANDOM_STATE,
        {
            "key": "reg_param",
            "label": "正则化参数",
            "label_en": "Regularization parameter",
            "type": "number",
            "default": 0.2,
            "min": 0.0,
            "max": 1.0,
            "step": 0.05,
            "note": "QDA协方差矩阵正则化，越大越接近LDA",
        },
        {
            "key": "cv_folds",
            "label": "交叉验证折数",
            "label_en": "CV folds",
            "type": "select",
            "default": "5",
            "options": ["3", "5", "10"],
        },
    ],
}

# ── Parameter option labels (for frontend display) ──────────────

PARAM_OPTION_LABELS: dict[str, dict[str, str]] = {
    "alternative": {
        "two-sided": "双侧检验 / two-sided",
        "less": "左侧检验 / less",
        "greater": "右侧检验 / greater",
    },
    "equal_var": {
        "False": "否（Welch校正，推荐）",
        "True": "是（Student's t）",
    },
    "center": {
        "median": "中位数中心化（Brown-Forsythe，推荐）",
        "mean": "均值中心化（经典Levene）",
    },
    "correction": {
        "auto": "自动判断",
        "yes": "Yates连续性校正",
        "no": "标准Pearson卡方",
    },
    "continuity_correction": {
        "True": "使用连续性校正（推荐）",
        "False": "不加校正",
    },
    "post_hoc": {
        "": "不使用",
        "tukey": "Tukey HSD（方差齐性）",
        "bonferroni": "Bonferroni 校正",
        "lsd": "LSD (Fisher's LSD)",
        "games_howell": "Games-Howell（方差不齐）",
    },
}


def get_test_params(test_type: str) -> list[dict]:
    """Return parameter definitions for a given test type."""
    return TEST_PARAMS.get(test_type, [])


def get_all_test_params() -> dict[str, list[dict]]:
    """Return all test parameter definitions."""
    return dict(TEST_PARAMS)
