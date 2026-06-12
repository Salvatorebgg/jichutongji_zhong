from __future__ import annotations

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)


def make_t_test_independent_example() -> pd.DataFrame:
    """Two groups for independent t-test: Treatment vs Control with blood pressure reduction."""
    n = 100
    treatment = rng.normal(15.2, 6.5, n)
    control = rng.normal(8.1, 7.0, n)
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, 2 * n + 1)],
        "group": ["Treatment"] * n + ["Control"] * n,
        "sbp_reduction": np.round(np.concatenate([treatment, control]), 1),
        "age": np.round(np.concatenate([rng.normal(55, 10, n), rng.normal(57, 11, n)]), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], 2 * n),
    })
    return df


def make_t_test_paired_example() -> pd.DataFrame:
    """Paired t-test: before/after treatment measurements."""
    n = 60
    base = rng.normal(145, 15, n)
    reduction = rng.normal(12, 7, n)
    after = base - reduction
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "sbp_before": np.round(base, 1),
        "sbp_after": np.round(after, 1),
        "age": np.round(rng.normal(58, 11, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_one_sample_t_test_example() -> pd.DataFrame:
    """One-sample t-test: LDL-C reduction tested against a reference value of 0."""
    n = 90
    change = rng.normal(-0.42, 0.58, n)
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "ldl_change": np.round(change, 2),
        "age": np.round(rng.normal(57, 10, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
        "baseline_ldl": np.round(rng.normal(3.4, 0.7, n).clip(1.2, 6.5), 2),
    })
    return df


def make_normality_test_example() -> pd.DataFrame:
    """Normality test: a skewed biomarker distribution."""
    n = 160
    biomarker = rng.lognormal(mean=1.35, sigma=0.52, size=n)
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "biomarker": np.round(biomarker, 2),
        "age": np.round(rng.normal(60, 11, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
        "group": rng.choice(["Control", "Treatment"], n),
    })
    return df


def make_levene_test_example() -> pd.DataFrame:
    """Levene test: treatment groups with unequal variability."""
    groups = []
    values = []
    for group, mu, sd, n in [
        ("Control", 12.0, 2.0, 55),
        ("Low dose", 13.1, 3.7, 55),
        ("High dose", 14.0, 6.2, 55),
    ]:
        groups.extend([group] * n)
        values.extend(rng.normal(mu, sd, n))
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, len(groups) + 1)],
        "group": groups,
        "response_value": np.round(values, 2),
        "age": np.round(rng.normal(56, 12, len(groups)), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], len(groups)),
    })
    return df


def make_anova_example() -> pd.DataFrame:
    """One-way ANOVA: 4 treatment groups with different efficacy."""
    n_per = 50
    groups = []
    values = []
    # Drug A: mean ~14, Drug B: mean ~18, Drug C: mean ~10, Placebo: mean ~6
    for drug, mu, sd in [("Drug A", 14.0, 5.5), ("Drug B", 18.5, 5.0), ("Drug C", 10.2, 6.0), ("Placebo", 5.8, 5.8)]:
        groups.extend([drug] * n_per)
        values.extend(np.round(rng.normal(mu, sd, n_per), 1))
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, 4 * n_per + 1)],
        "treatment": groups,
        "efficacy_score": values,
        "age": np.round(rng.normal(56, 12, 4 * n_per), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], 4 * n_per),
        "bmi": np.round(rng.normal(24.5, 3.5, 4 * n_per).clip(16, 40), 1),
    })
    return df


def make_chi_square_example() -> pd.DataFrame:
    """Chi-square test: treatment outcome by group."""
    n = 300
    treatment = rng.choice(["Drug X", "Drug Y", "Standard"], n, p=[0.35, 0.35, 0.3])
    # Outcome depends on treatment
    outcome = []
    for t in treatment:
        if t == "Drug X":
            outcome.append(rng.choice(["Effective", "Ineffective"], p=[0.72, 0.28]))
        elif t == "Drug Y":
            outcome.append(rng.choice(["Effective", "Ineffective"], p=[0.55, 0.45]))
        else:
            outcome.append(rng.choice(["Effective", "Ineffective"], p=[0.40, 0.60]))
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "treatment": treatment,
        "outcome": outcome,
        "age": np.round(rng.normal(55, 12, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_fisher_exact_example() -> pd.DataFrame:
    """Fisher exact test: small sample 2x2."""
    n = 40
    group = ["Treatment"] * 20 + ["Control"] * 20
    # Rare event: Treatment has higher success rate
    outcome = (
        rng.choice(["Success", "Failure"], 20, p=[0.75, 0.25]).tolist() +
        rng.choice(["Success", "Failure"], 20, p=[0.35, 0.65]).tolist()
    )
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "group": group,
        "outcome": outcome,
        "age": np.round(rng.normal(52, 13, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_mann_whitney_example() -> pd.DataFrame:
    """Mann-Whitney U test: non-normal data comparing two groups."""
    n = 120
    # Skewed distributions
    group_a = np.round(rng.lognormal(2.0, 0.5, n // 2), 1)
    group_b = np.round(rng.lognormal(2.5, 0.6, n // 2), 1)
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "group": ["Group A"] * (n // 2) + ["Group B"] * (n // 2),
        "crp_level": np.concatenate([group_a, group_b]),
        "age": np.round(rng.normal(60, 11, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_kruskal_wallis_example() -> pd.DataFrame:
    """Kruskal-Wallis test: 3+ groups non-normal data."""
    n_per = 45
    groups = []
    values = []
    for stage, loc, scale in [("Stage I", 1.5, 0.5), ("Stage II", 2.0, 0.6), ("Stage III", 2.8, 0.7), ("Stage IV", 3.5, 0.8)]:
        groups.extend([stage] * n_per)
        values.extend(np.round(rng.lognormal(loc, scale, n_per), 1))
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, 4 * n_per + 1)],
        "disease_stage": groups,
        "biomarker_level": values,
        "age": np.round(rng.normal(59, 12, 4 * n_per), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], 4 * n_per),
    })
    return df


def make_wilcoxon_signed_rank_example() -> pd.DataFrame:
    """Wilcoxon signed-rank test: paired non-normal data, pain scores before/after."""
    n = 50
    before = np.round(rng.uniform(3, 9, n), 1)
    # After treatment, pain generally decreases but not always
    change = np.round(rng.uniform(-1, 5, n), 1)
    after = np.round(before - change, 1)
    after = np.clip(after, 0, 10)
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "pain_before": before,
        "pain_after": after,
        "age": np.round(rng.normal(50, 14, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_mcnemar_example() -> pd.DataFrame:
    """McNemar test: paired categorical data, diagnostic test before/after."""
    n = 120
    # Before: standard diagnosis, After: new method diagnosis
    before_disease = rng.choice(["Positive", "Negative"], n, p=[0.45, 0.55])
    after_disease = []
    for b in before_disease:
        if b == "Positive":
            after_disease.append(rng.choice(["Positive", "Negative"], p=[0.85, 0.15]))
        else:
            after_disease.append(rng.choice(["Positive", "Negative"], p=[0.12, 0.88]))
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "diagnosis_standard": before_disease,
        "diagnosis_new": after_disease,
        "age": np.round(rng.normal(55, 13, n), 0).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
    })
    return df


def make_general_clinical_example() -> pd.DataFrame:
    """Comprehensive clinical dataset with mixed variable types."""
    n = 400
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "age": np.round(rng.normal(58, 12, n)).clip(20, 90).astype(int),
        "sex": rng.choice(["Male", "Female"], n, p=[0.48, 0.52]),
        "bmi": np.round(rng.normal(24.5, 3.8, n).clip(15, 42), 1),
        "sbp": np.round(rng.normal(128, 16, n).clip(85, 190), 0).astype(int),
        "dbp": np.round(rng.normal(78, 10, n).clip(50, 120), 0).astype(int),
        "glucose": np.round(rng.normal(5.6, 1.2, n).clip(3.0, 15.0), 2),
        "cholesterol": np.round(rng.normal(5.1, 1.1, n).clip(2.5, 9.0), 2),
        "crp": np.round(rng.lognormal(0.5, 0.8, n).clip(0.1, 50), 2),
        "group": rng.choice(["Control", "Treatment A", "Treatment B"], n),
        "outcome": rng.choice(["Improved", "Stable", "Worsened"], n, p=[0.35, 0.45, 0.20]),
        "education": rng.choice(["Primary", "Secondary", "Tertiary"], n, p=[0.3, 0.45, 0.25]),
        "smoking": rng.choice(["Never", "Former", "Current"], n, p=[0.5, 0.25, 0.25]),
    })
    # Add some missing values
    for col, rate in [("bmi", 0.05), ("glucose", 0.08), ("crp", 0.10)]:
        n_missing = max(1, int(n * rate))
        missing_idx = rng.choice(df.index.to_numpy(), size=n_missing, replace=False)
        df.loc[missing_idx, col] = np.nan
    return df


def make_friedman_example() -> pd.DataFrame:
    """Friedman test: repeated measures with non-normal data across 4 time points."""
    n = 30
    records = []
    for i in range(1, n + 1):
        base = rng.uniform(2, 7)
        trend = rng.uniform(-0.5, 0.2)
        for t, tp in enumerate(["T0_Baseline", "T1_Week4", "T2_Week8", "T3_Week12"]):
            val = base + trend * t + rng.normal(0, 0.8)
            records.append({
                "subject_id": f"S{str(i).zfill(3)}",
                "timepoint": tp,
                "pain_score": round(max(0, min(10, val)), 1),
                "age": int(np.clip(rng.normal(50, 12), 25, 80)),
                "sex": rng.choice(["Male", "Female"], 1)[0],
            })
    return pd.DataFrame(records)


def make_repeated_measures_example() -> pd.DataFrame:
    """Repeated measures ANOVA: drug efficacy across 5 time points."""
    n = 40
    records = []
    for i in range(1, n + 1):
        base = rng.normal(140, 12)
        group = rng.choice(["Drug", "Placebo"], 1)[0]
        effect = -2.5 if group == "Drug" else -0.5
        for t_idx, tp in enumerate(["Week0", "Week2", "Week4", "Week8", "Week12"]):
            noise = rng.normal(0, 5)
            val = base + effect * t_idx + noise
            records.append({
                "subject_id": f"S{str(i).zfill(3)}",
                "time": tp,
                "sbp": round(val, 1),
                "group": group,
                "age": int(np.clip(rng.normal(55, 10), 30, 78)),
                "sex": rng.choice(["Male", "Female"], 1)[0],
            })
    return pd.DataFrame(records)


def make_correlation_example() -> pd.DataFrame:
    """Pearson/Spearman correlation: clinical biomarkers with relationships."""
    n = 150
    age = rng.normal(55, 12, n).clip(25, 85)
    bmi = 18 + 0.12 * age + rng.normal(0, 3, n)
    sbp = 90 + 0.6 * age + 0.4 * bmi + rng.normal(0, 8, n)
    glucose = 4.0 + 0.02 * age + 0.06 * bmi + rng.normal(0, 0.7, n)
    cholesterol = 3.5 + 0.01 * age + 0.05 * bmi + rng.normal(0, 0.7, n)
    crp = np.exp(0.02 * bmi + 0.01 * age + rng.normal(-1, 0.5, n))
    return pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "age": np.round(age, 0).astype(int),
        "bmi": np.round(bmi.clip(16, 42), 1),
        "sbp": np.round(sbp.clip(85, 190), 0).astype(int),
        "glucose": np.round(glucose.clip(3, 12), 2),
        "cholesterol": np.round(cholesterol.clip(2.5, 8), 2),
        "crp": np.round(crp.clip(0.1, 40), 2),
        "sex": rng.choice(["Male", "Female"], n),
        "smoking": rng.choice(["Never", "Former", "Current"], n, p=[0.5, 0.25, 0.25]),
    })


def make_survival_example() -> pd.DataFrame:
    """Log-rank test: survival data for two treatment groups."""
    n = 200
    group = rng.choice(["Standard", "Experimental"], n)
    time = []
    event = []
    for g in group:
        if g == "Experimental":
            t = rng.exponential(42)
            e = 1 if rng.random() < 0.35 else 0
        else:
            t = rng.exponential(28)
            e = 1 if rng.random() < 0.55 else 0
        time.append(round(t, 1))
        event.append(e)
    return pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "survival_time": time,
        "event": event,
        "treatment": group,
        "age": np.round(rng.normal(58, 11, n)).clip(30, 85).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
        "stage": rng.choice(["I", "II", "III"], n, p=[0.3, 0.4, 0.3]),
    })


def make_logistic_regression_example() -> pd.DataFrame:
    """Logistic regression: binary outcome with multiple predictors."""
    n = 300
    age = rng.normal(58, 12, n).clip(25, 85)
    bmi = 18 + 0.12 * age + rng.normal(0, 3, n)
    sbp = 90 + 0.6 * age + 0.4 * bmi + rng.normal(0, 8, n)
    glucose = 4.0 + 0.02 * age + 0.06 * bmi + rng.normal(0, 0.7, n)
    cholesterol = 3.5 + 0.01 * age + 0.05 * bmi + rng.normal(0, 0.7, n)
    logit = -10 + 0.03 * age + 0.05 * sbp + 0.2 * glucose + 0.15 * cholesterol
    prob = 1 / (1 + np.exp(-logit))
    outcome = (rng.random(n) < prob).astype(int)
    return pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "age": np.round(age, 0).astype(int),
        "bmi": np.round(bmi.clip(16, 42), 1),
        "sbp": np.round(sbp.clip(85, 190), 0).astype(int),
        "glucose": np.round(glucose.clip(3, 12), 2),
        "cholesterol": np.round(cholesterol.clip(2.5, 8), 2),
        "outcome": outcome,
        "sex": rng.choice(["Male", "Female"], n),
    })


def make_linear_regression_example() -> pd.DataFrame:
    """Linear regression: continuous outcome with multiple predictors."""
    n = 200
    age = rng.normal(55, 12, n).clip(25, 85)
    bmi = 18 + 0.12 * age + rng.normal(0, 3, n)
    sbp = 90 + 0.6 * age + 0.4 * bmi + rng.normal(0, 8, n)
    glucose = 4.0 + 0.02 * age + 0.06 * bmi + rng.normal(0, 0.7, n)
    cholesterol = 3.5 + 0.01 * age + 0.05 * bmi + rng.normal(0, 0.7, n)
    return pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "age": np.round(age, 0).astype(int),
        "bmi": np.round(bmi.clip(16, 42), 1),
        "sbp": np.round(sbp.clip(85, 190), 0).astype(int),
        "glucose": np.round(glucose.clip(3, 12), 2),
        "cholesterol": np.round(cholesterol.clip(2.5, 8), 2),
        "sex": rng.choice(["Male", "Female"], n),
        "group": rng.choice(["Control", "Treatment"], n),
    })


def make_ancova_example() -> pd.DataFrame:
    """ANCOVA: treatment effect adjusted for baseline."""
    n = 150
    group = rng.choice(["Drug A", "Drug B", "Placebo"], n)
    baseline = rng.normal(135, 15, n).clip(100, 180)
    effect = {"Drug A": -12, "Drug B": -8, "Placebo": -2}
    followup = []
    for g, bl in zip(group, baseline):
        fu = bl + effect[g] + rng.normal(0, 6)
        followup.append(round(fu, 1))
    return pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "treatment": group,
        "sbp_baseline": np.round(baseline, 1),
        "sbp_followup": followup,
        "age": np.round(rng.normal(56, 11, n)).clip(30, 80).astype(int),
        "sex": rng.choice(["Male", "Female"], n),
        "bmi": np.round(rng.normal(24.5, 3.5, n).clip(17, 38), 1),
    })


def make_discriminant_analysis_example() -> pd.DataFrame:
    """Discriminant analysis: clinical classes separated by multivariate markers."""
    n_per = 75
    rows = []
    profiles = [
        ("Low risk", 50, 23.2, 118, 5.0, 4.5, 1.1),
        ("Metabolic risk", 59, 27.0, 136, 6.4, 5.5, 2.6),
        ("Inflammatory risk", 62, 25.4, 130, 5.8, 5.2, 6.8),
    ]
    for label, age_mu, bmi_mu, sbp_mu, glu_mu, chol_mu, crp_mu in profiles:
        age = rng.normal(age_mu, 7.5, n_per).clip(25, 86)
        bmi = rng.normal(bmi_mu, 2.4, n_per).clip(16, 42)
        sbp = rng.normal(sbp_mu, 9.5, n_per).clip(90, 190)
        glucose = rng.normal(glu_mu, 0.55, n_per).clip(3.2, 12)
        cholesterol = rng.normal(chol_mu, 0.55, n_per).clip(2.5, 8.5)
        crp = rng.lognormal(np.log(crp_mu), 0.32, n_per).clip(0.1, 35)
        for values in zip(age, bmi, sbp, glucose, cholesterol, crp):
            rows.append({
                "diagnosis_group": label,
                "age": int(round(values[0])),
                "bmi": round(float(values[1]), 1),
                "sbp": int(round(values[2])),
                "glucose": round(float(values[3]), 2),
                "cholesterol": round(float(values[4]), 2),
                "crp": round(float(values[5]), 2),
                "sex": rng.choice(["Male", "Female"], 1)[0],
            })
    df = pd.DataFrame(rows)
    df.insert(0, "patient_id", [f"P{str(i).zfill(4)}" for i in range(1, len(df) + 1)])
    return df


def make_comprehensive_example() -> pd.DataFrame:
    """One comprehensive dataset supporting ALL 22 statistical methods.

    Design: hybrid wide+long format with ~250 subjects, some with repeated measures.
    Columns cover every test requirement: continuous, categorical, binary, time,
    paired pre/post, survival, and multi-variable regression predictors.
    """
    n = 250
    rng_local = np.random.default_rng(42)

    # ── Demographics ──
    age = np.round(rng_local.normal(55, 12, n)).clip(20, 88).astype(int)
    sex = rng_local.choice(["Male", "Female"], n, p=[0.48, 0.52])
    bmi = np.round(rng_local.normal(24.5, 3.8, n).clip(15.5, 42), 1)

    # ── Vital signs ──
    sbp = np.round(rng_local.normal(128, 16, n).clip(85, 190), 0).astype(int)
    dbp = np.round(rng_local.normal(78, 10, n).clip(50, 120), 0).astype(int)
    glucose = np.round(rng_local.normal(5.6, 1.2, n).clip(3.0, 14.0), 2)
    cholesterol = np.round(rng_local.normal(5.1, 1.1, n).clip(2.5, 9.0), 2)
    crp = np.round(rng_local.lognormal(0.5, 0.8, n).clip(0.1, 48), 2)

    # ── Categorical grouping variables ──
    group = rng_local.choice(["Control", "Treatment A", "Treatment B"], n)
    treatment = rng_local.choice(["Drug", "Placebo"], n)
    disease_stage = rng_local.choice(["Stage I", "Stage II", "Stage III", "Stage IV"], n)

    # ── Binary outcome (depends on age+bmi+sbp for logistic regression) ──
    logit_outcome = -8 + 0.03 * age + 0.05 * sbp + 0.15 * glucose + 0.12 * cholesterol
    prob_outcome = 1 / (1 + np.exp(-np.clip(logit_outcome, -10, 10)))
    outcome = (rng_local.random(n) < prob_outcome).astype(int)

    # ── 3-class diagnosis (for discriminant analysis) ──
    diagnosis_group = []
    for a, b, s, g in zip(age, bmi, sbp, glucose):
        score_low = a * 0.3 + b * 0.2 + s * 0.3 + g * 0.2
        score_met = a * 0.5 + b * 0.7 + s * 0.6 + g * 0.6
        if score_met > score_low + 15:
            diagnosis_group.append("Metabolic risk")
        elif score_low > 55:
            diagnosis_group.append("Inflammatory risk")
        else:
            diagnosis_group.append("Low risk")

    # ── Paired pre/post measurements ──
    sbp_before = np.round(sbp + rng_local.normal(0, 3, n), 1)
    sbp_after = np.round(sbp_before - rng_local.uniform(2, 15, n), 1).clip(80, 185)
    pain_before = np.round(rng_local.uniform(3, 9, n), 1)
    pain_after = np.round(np.clip(pain_before - rng_local.uniform(-1, 5, n), 0, 10), 1)

    # ── Paired categorical for McNemar ──
    diagnosis_standard = rng_local.choice(["Positive", "Negative"], n, p=[0.45, 0.55])
    diagnosis_new = []
    for d in diagnosis_standard:
        if d == "Positive":
            diagnosis_new.append(rng_local.choice(["Positive", "Negative"], p=[0.85, 0.15]))
        else:
            diagnosis_new.append(rng_local.choice(["Positive", "Negative"], p=[0.12, 0.88]))

    # ── One-sample test variable (LDL change, theoretically centered around -0.4) ──
    ldl_change = np.round(rng_local.normal(-0.42, 0.58, n), 2)

    # ── Skewed biomarker (for normality test, non-parametric) ──
    biomarker = np.round(rng_local.lognormal(1.35, 0.52, n), 2)
    biomarker_level = np.round(rng_local.lognormal(2.0, 0.6, n), 1)
    crp_level = np.round(rng_local.lognormal(2.0, 0.5, n), 1)

    # ── Efficacy score (for ANOVA, Levene) ──
    efficacy_score = np.round(rng_local.normal(12, 5, n).clip(0, 25), 1)
    response_value = np.round(rng_local.normal(13, 4, n).clip(0, 24), 2)

    # ── Survival data ──
    survival_time = np.round(rng_local.exponential(35, n).clip(1, 200), 1)
    event = (rng_local.random(n) < 0.45).astype(int)

    # ── ANCOVA variables ──
    sbp_baseline = np.round(rng_local.normal(135, 15, n).clip(100, 180), 1)
    sbp_followup = np.round(sbp_baseline - rng_local.uniform(0, 20, n) + rng_local.normal(0, 6, n), 1).clip(85, 185)

    # ── Generic continuous for correlation ──
    response = rng_local.choice(["Responder", "Non-responder", "Partial"], n)
    value = np.round(rng_local.normal(50, 15, n).clip(5, 95), 1)

    # ── Build dataframe ──
    df = pd.DataFrame({
        "patient_id": [f"P{str(i).zfill(4)}" for i in range(1, n + 1)],
        "subject_id": [f"S{str(i).zfill(3)}" for i in range(1, n + 1)],
        "age": age,
        "sex": sex,
        "bmi": bmi,
        "sbp": sbp,
        "dbp": dbp,
        "glucose": glucose,
        "cholesterol": cholesterol,
        "crp": crp,
        "crp_level": crp_level,
        "biomarker": biomarker,
        "biomarker_level": biomarker_level,
        "group": group,
        "treatment": treatment,
        "disease_stage": disease_stage,
        "outcome": outcome,
        "efficacy_score": efficacy_score,
        "response_value": response_value,
        "sbp_before": sbp_before,
        "sbp_after": sbp_after,
        "pain_before": pain_before,
        "pain_after": pain_after,
        "ldl_change": ldl_change,
        "survival_time": survival_time,
        "event": event,
        "diagnosis_group": diagnosis_group,
        "diagnosis_standard": diagnosis_standard,
        "diagnosis_new": diagnosis_new,
        "sbp_baseline": sbp_baseline,
        "sbp_followup": sbp_followup,
        "sbp_reduction": np.round(sbp_before - sbp_after, 1),
        "response": response,
        "value": value,
        "timepoint": "Week0",  # wide-format default; long rows added below
        "pain_score": pain_before,
    })

    # ── Append long-format rows for RM ANOVA / Friedman ──
    long_rows = []
    n_rm = 50
    for i in range(n_rm):
        sid = f"S{str(200 + i).zfill(3)}"
        pid = f"P{str(300 + i).zfill(4)}"
        base_sbp = float(rng_local.normal(140, 12))
        base_pain = float(rng_local.uniform(3, 8))
        for t_idx, tp in enumerate(["Week0", "Week4", "Week8", "Week12"]):
            long_rows.append({
                "patient_id": pid,
                "subject_id": sid,
                "age": int(np.clip(float(rng_local.normal(55, 10)), 30, 78)),
                "sex": rng_local.choice(["Male", "Female"], 1)[0],
                "bmi": round(float(np.clip(rng_local.normal(24.5, 3.5), 17, 38)), 1),
                "sbp": round(float(base_sbp - 2.5 * t_idx + rng_local.normal(0, 5)), 1),
                "dbp": int(round(float(np.clip(rng_local.normal(78, 10), 50, 120)))),
                "glucose": round(float(np.clip(rng_local.normal(5.6, 1.2), 3.0, 12)), 2),
                "cholesterol": round(float(np.clip(rng_local.normal(5.1, 1.1), 2.5, 8.5)), 2),
                "crp": round(float(np.clip(rng_local.lognormal(0.5, 0.8), 0.1, 45)), 2),
                "crp_level": round(float(np.clip(rng_local.lognormal(2.0, 0.5), 0.1, 40)), 1),
                "biomarker": round(float(np.clip(rng_local.lognormal(1.35, 0.52), 0.1, 30)), 2),
                "biomarker_level": round(float(np.clip(rng_local.lognormal(2.0, 0.6), 0.1, 35)), 1),
                "group": rng_local.choice(["Control", "Treatment A", "Treatment B"], 1)[0],
                "treatment": rng_local.choice(["Drug", "Placebo"], 1)[0],
                "disease_stage": rng_local.choice(["Stage I", "Stage II", "Stage III", "Stage IV"], 1)[0],
                "outcome": int(rng_local.random() < 0.4),
                "efficacy_score": round(float(np.clip(rng_local.normal(12, 5), 0, 25)), 1),
                "response_value": round(float(np.clip(rng_local.normal(13, 4), 0, 24)), 2),
                "sbp_before": None, "sbp_after": None,
                "pain_before": None, "pain_after": None,
                "ldl_change": round(float(rng_local.normal(-0.42, 0.58)), 2),
                "survival_time": round(float(np.clip(rng_local.exponential(35), 1, 180)), 1),
                "event": int(rng_local.random() < 0.45),
                "diagnosis_group": rng_local.choice(["Low risk", "Metabolic risk", "Inflammatory risk"], 1)[0],
                "diagnosis_standard": rng_local.choice(["Positive", "Negative"], 1)[0],
                "diagnosis_new": rng_local.choice(["Positive", "Negative"], 1)[0],
                "sbp_baseline": None, "sbp_followup": None,
                "sbp_reduction": None,
                "response": rng_local.choice(["Responder", "Non-responder", "Partial"], 1)[0],
                "value": round(float(np.clip(rng_local.normal(50, 15), 5, 95)), 1),
                "timepoint": tp,
                "pain_score": round(float(np.clip(base_pain - 0.4 * t_idx + rng_local.normal(0, 0.8), 0, 10)), 1),
            })
    df_long = pd.DataFrame(long_rows)
    df = pd.concat([df, df_long], ignore_index=True)

    # ── Add some missingness (realistic) ──
    for col, rate in [("bmi", 0.03), ("glucose", 0.05), ("crp", 0.06), ("cholesterol", 0.04)]:
        n_miss = max(1, int(len(df) * rate))
        miss_idx = rng_local.choice(df.index.to_numpy(), size=n_miss, replace=False)
        df.loc[miss_idx, col] = np.nan

    return df


EXAMPLE_MAKERS = {
    "comprehensive_example": make_comprehensive_example,
    # Keep aliases for backward compatibility
    "general_clinical_example": make_comprehensive_example,
    "t_test_independent_example": make_comprehensive_example,
    "t_test_paired_example": make_comprehensive_example,
    "one_sample_t_test_example": make_comprehensive_example,
    "normality_test_example": make_comprehensive_example,
    "levene_test_example": make_comprehensive_example,
    "anova_example": make_comprehensive_example,
    "chi_square_example": make_comprehensive_example,
    "fisher_exact_example": make_comprehensive_example,
    "mann_whitney_example": make_comprehensive_example,
    "kruskal_wallis_example": make_comprehensive_example,
    "wilcoxon_signed_rank_example": make_comprehensive_example,
    "mcnemar_example": make_comprehensive_example,
    "friedman_example": make_comprehensive_example,
    "repeated_measures_example": make_comprehensive_example,
    "correlation_example": make_comprehensive_example,
    "survival_example": make_comprehensive_example,
    "logistic_regression_example": make_comprehensive_example,
    "linear_regression_example": make_comprehensive_example,
    "ancova_example": make_comprehensive_example,
    "discriminant_analysis_example": make_comprehensive_example,
}
