/* ── Statistical Analysis Module ───────────────────────── */
/* Integrated with Basicpicture chart system for publication-quality visualization */

/* ── Statistical Test Catalog ─────────────────────────── */
const TEST_CATALOG = {
  t_test_independent: {
    id: 't_test_independent',
    name: '独立样本t检验',
    category: 'parametric',
    icon: 'T₂',
    description: "Welch's t-test — 比较两组独立样本的均值差异",
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    varType: 'continuous',
  },
  t_test_paired: {
    id: 't_test_paired',
    name: '配对样本t检验',
    category: 'parametric',
    icon: 'Tp',
    description: 'Paired t-test — 比较同一组对象前后测量的差异',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: true,
    varType: 'continuous',
  },
  one_sample_t_test: {
    id: 'one_sample_t_test',
    name: '单样本t检验',
    category: 'parametric',
    icon: 'T1',
    description: 'One-sample t-test — 检验单个连续变量均值是否偏离参考值',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    varType: 'continuous',
  },
  normality_test: {
    id: 'normality_test',
    name: '正态性检验',
    category: 'parametric',
    icon: 'W',
    description: 'Shapiro-Wilk — 判断连续变量分布是否显著偏离正态',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    varType: 'continuous',
  },
  levene_test: {
    id: 'levene_test',
    name: '方差齐性检验',
    category: 'parametric',
    icon: 'Lv',
    description: 'Levene / Brown-Forsythe — 比较多组连续变量的方差是否齐性',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    varType: 'continuous',
  },
  anova: {
    id: 'anova',
    name: '单因素方差分析',
    category: 'parametric',
    icon: 'Fa',
    description: 'One-way ANOVA — 比较三组及以上样本的均值差异',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    supportsPostHoc: true,
    varType: 'continuous',
  },
  chi_square: {
    id: 'chi_square',
    name: '卡方检验',
    category: 'categorical',
    icon: 'χ²',
    description: 'Chi-square test — 分析两个分类变量间的关联性',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    varType: 'categorical',
  },
  fisher_exact: {
    id: 'fisher_exact',
    name: 'Fisher精确概率法',
    category: 'categorical',
    icon: 'Fe',
    description: "Fisher's exact test — 小样本或低频数的2x2列联表精确检验",
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    varType: 'categorical',
  },
  mann_whitney: {
    id: 'mann_whitney',
    name: 'Mann-Whitney U检验',
    category: 'nonparametric',
    icon: 'Uw',
    description: 'Wilcoxon秩和检验 — 两组独立样本的非参数比较',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    varType: 'continuous',
  },
  kruskal_wallis: {
    id: 'kruskal_wallis',
    name: 'Kruskal-Wallis H检验',
    category: 'nonparametric',
    icon: 'Kw',
    description: 'Kruskal-Wallis — 多组独立样本的非参数比较',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    supportsPostHoc: true,
    varType: 'continuous',
  },
  wilcoxon_signed_rank: {
    id: 'wilcoxon_signed_rank',
    name: 'Wilcoxon符号秩检验',
    category: 'nonparametric',
    icon: 'Ws',
    description: 'Wilcoxon signed-rank — 配对样本的非参数比较',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: true,
    varType: 'continuous',
  },
  mcnemar: {
    id: 'mcnemar',
    name: 'McNemar检验',
    category: 'categorical',
    icon: 'Mb',
    description: "McNemar's test — 配对分类资料的比较",
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: true,
    varType: 'categorical',
  },
  friedman: {
    id: 'friedman',
    name: 'Friedman检验',
    category: 'nonparametric',
    icon: 'Fm',
    description: 'Friedman test — 非参数重复测量方差分析',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    requiresSubject: true,
    varType: 'continuous',
  },
  repeated_measures_anova: {
    id: 'repeated_measures_anova',
    name: '重复测量方差分析',
    category: 'parametric',
    icon: 'Rm',
    description: 'RM ANOVA — 同一组对象在不同时间点的重复测量',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    requiresSubject: true,
    varType: 'continuous',
  },
  pearson_correlation: {
    id: 'pearson_correlation',
    name: 'Pearson相关分析',
    category: 'correlation',
    icon: 'Pr',
    description: 'Pearson r — 两连续变量的线性相关分析',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: true,
    requiresPairedLabel: '变量2',
    varType: 'continuous',
  },
  spearman_correlation: {
    id: 'spearman_correlation',
    name: 'Spearman秩相关',
    category: 'correlation',
    icon: 'Sp',
    description: "Spearman's ρ — 两变量的秩相关（非参数）",
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: true,
    requiresPairedLabel: '变量2',
    varType: 'continuous',
  },
  log_rank: {
    id: 'log_rank',
    name: 'Log-Rank生存分析',
    category: 'survival',
    icon: 'Lr',
    description: 'Log-rank test — 两组或多组生存曲线比较',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    requiresTimeEvent: true,
    varType: 'continuous',
  },
  logistic_regression: {
    id: 'logistic_regression',
    name: 'Logistic回归',
    category: 'regression',
    icon: 'Lg',
    description: 'Logistic Regression — 二分类结局的回归分析',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    requiresMultiVar: true,
    varType: 'categorical',
  },
  linear_regression: {
    id: 'linear_regression',
    name: '多重线性回归',
    category: 'regression',
    icon: 'Ln',
    description: 'Multiple Linear Regression — 多因素线性回归',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    requiresMultiVar: true,
    varType: 'continuous',
  },
  discriminant_analysis: {
    id: 'discriminant_analysis',
    name: '线性判别分析',
    category: 'regression',
    icon: 'LD',
    description: 'LDA — 基于多项连续指标判别分类结局，并输出判别得分图',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    requiresMultiVar: true,
    varType: 'categorical',
  },
  quadratic_discriminant_analysis: {
    id: 'quadratic_discriminant_analysis',
    name: '二次判别分析',
    category: 'regression',
    icon: 'QD',
    description: 'QDA — 允许不同类别协方差结构的判别分类模型',
    exampleDataset: 'comprehensive_example',
    requiresGroup: false,
    requiresPaired: false,
    requiresMultiVar: true,
    varType: 'categorical',
  },
  ancova: {
    id: 'ancova',
    name: '协方差分析',
    category: 'parametric',
    icon: 'Ac',
    description: 'ANCOVA — 控制协变量后的组间比较',
    exampleDataset: 'comprehensive_example',
    requiresGroup: true,
    requiresPaired: false,
    requiresCovariate: true,
    varType: 'continuous',
  },
};

function getTestConfig(testId) {
  return TEST_CATALOG[testId] || null;
}

function getTestDefaultParams(testId) {
  const defaults = {
    t_test_independent: { y_var: 'sbp_reduction', x_var: 'treatment' },
    t_test_paired: { y_var: 'sbp_before', paired_var: 'sbp_after' },
    one_sample_t_test: { y_var: 'ldl_change' },
    normality_test: { y_var: 'biomarker' },
    levene_test: { y_var: 'response_value', x_var: 'group' },
    anova: { y_var: 'efficacy_score', x_var: 'treatment' },
    repeated_measures_anova: { y_var: 'sbp', x_var: 'timepoint', subject_var: 'subject_id' },
    ancova: { y_var: 'sbp_followup', x_var: 'treatment', covar: 'sbp_baseline' },
    mann_whitney: { y_var: 'crp_level', x_var: 'treatment' },
    kruskal_wallis: { y_var: 'biomarker_level', x_var: 'disease_stage' },
    wilcoxon_signed_rank: { y_var: 'pain_before', paired_var: 'pain_after' },
    friedman: { y_var: 'pain_score', x_var: 'timepoint', subject_var: 'subject_id' },
    chi_square: { y_var: 'outcome', x_var: 'treatment' },
    fisher_exact: { y_var: 'outcome', x_var: 'treatment' },
    mcnemar: { y_var: 'diagnosis_standard', paired_var: 'diagnosis_new' },
    pearson_correlation: { y_var: 'age', paired_var: 'bmi' },
    spearman_correlation: { y_var: 'glucose', paired_var: 'crp' },
    log_rank: { time_var: 'survival_time', event_var: 'event', x_var: 'treatment' },
    logistic_regression: { y_var: 'outcome', value_vars: ['age', 'bmi', 'glucose', 'cholesterol'] },
    linear_regression: { y_var: 'sbp', value_vars: ['age', 'bmi', 'glucose', 'cholesterol'] },
    discriminant_analysis: { y_var: 'diagnosis_group', value_vars: ['age', 'bmi', 'sbp', 'glucose', 'cholesterol', 'crp'] },
    quadratic_discriminant_analysis: { y_var: 'diagnosis_group', value_vars: ['age', 'bmi', 'sbp', 'glucose', 'cholesterol', 'crp'] },
  };
  return defaults[testId] || {};
}

/* ── Parameter definitions for all test types ────────────── */
function getTestParams(testId) {
  const paramDefs = {
    t_test_independent: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
      { key: 'equal_var', label: '方差齐性假设', type: 'select', default: 'False', options: ['False', 'True'], note: 'False=Welch校正(推荐), True=Student t' },
    ],
    t_test_paired: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
    ],
    one_sample_t_test: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
      { key: 'hypothesized_mean', label: '参考均值 μ₀', type: 'number', default: '0.0' },
    ],
    normality_test: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    levene_test: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'center', label: '中心化方法', type: 'select', default: 'median', options: ['median', 'mean'], note: 'median=Brown-Forsythe推荐' },
    ],
    anova: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    repeated_measures_anova: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    ancova: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    mann_whitney: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
    ],
    kruskal_wallis: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    wilcoxon_signed_rank: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
    ],
    friedman: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    chi_square: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'correction', label: '连续性校正', type: 'select', default: 'auto', options: ['auto', 'yes', 'no'], note: 'auto=自动判断' },
    ],
    fisher_exact: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    mcnemar: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'continuity_correction', label: '连续性校正', type: 'select', default: 'True', options: ['True', 'False'] },
    ],
    pearson_correlation: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
    ],
    spearman_correlation: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'alternative', label: '备择假设', type: 'select', default: 'two-sided', options: ['two-sided', 'less', 'greater'] },
    ],
    log_rank: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
    ],
    logistic_regression: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'random_state', label: '随机种子', type: 'number', default: '42' },
      { key: 'max_iter', label: '最大迭代次数', type: 'number', default: '2000' },
      { key: 'C', label: '正则化强度 C', type: 'number', default: '1.0', note: 'C越大正则化越弱' },
    ],
    linear_regression: [
      { key: 'alpha', label: '显著性水平 α', type: 'select', default: '0.05', options: ['0.01', '0.05', '0.10'] },
      { key: 'random_state', label: '随机种子', type: 'number', default: '42' },
    ],
    discriminant_analysis: [
      { key: 'random_state', label: '随机种子', type: 'number', default: '42' },
      { key: 'cv_folds', label: '交叉验证折数', type: 'select', default: '5', options: ['3', '5', '10'] },
    ],
    quadratic_discriminant_analysis: [
      { key: 'random_state', label: '随机种子', type: 'number', default: '42' },
      { key: 'reg_param', label: '正则化参数', type: 'number', default: '0.2', note: 'QDA协方差矩阵正则化' },
      { key: 'cv_folds', label: '交叉验证折数', type: 'select', default: '5', options: ['3', '5', '10'] },
    ],
  };
  return paramDefs[testId] || [];
}

/* ── Statistical Analysis Execution ───────────────────── */
async function runAnalysis() {
  const config = getTestConfig(STATE.activeChartType);
  if (!config && !(STATE.activeChartType && TEST_CATALOG[STATE.activeChartType])) {
    // Not a statistical test, use chart generation
    return;
  }
  const testConfig = config || getTestConfig(STATE.activeChartType);
  if (!testConfig) return;

  if (!STATE.columns || STATE.columns.length === 0) {
    toast('请先载入数据', 'warning');
    return;
  }

  const btn = el('generateChartBtn');
  if (btn) setLoading(btn, true);
  if (typeof setStatus === 'function') setStatus('正在执行统计分析...');

  try {
    const body = buildAnalysisRequest(testConfig);
    const data = await apiPost('/api/analyze', body);

    if (data.status === 'error') {
      toast(data.message || '分析失败', 'error');
      if (typeof setStatus === 'function') setStatus(data.message || '分析失败', true);
      return;
    }

    STATE.currentStatResult = data.result;
    STATE.currentResult = data.result;  // for app.js compatibility
    STATE.currentStatChartData = data.result?.chart_data || null;
    STATE.currentDiscussion = data.discussion || null;
    STATE.currentTableData = data.tables?.result || null;  // full table object with columns + rows
    STATE.currentStatTables = data.tables || null;

    // Load full dataset for chart visualization
    try {
      if (typeof loadChartDataset === 'function') {
        const fullData = await loadChartDataset(testConfig);
        STATE._statChartData = fullData;
      } else {
        STATE._statChartData = null;
      }
    } catch(e) {
      STATE._statChartData = null;
    }

    // Render results in analysis tab
    renderStatResults(data);
    updateDownloadList();

    if (typeof updateFlowLine === 'function') updateFlowLine(4);
    if (typeof setStatus === 'function') setStatus(`分析完成: ${data.result.summary || data.result.test_name}`);
    toast('统计分析完成！', 'success');
  } catch (e) {
    toast('分析失败: ' + e.message, 'error');
    if (typeof setStatus === 'function') setStatus('分析失败: ' + e.message, true);
  } finally {
    if (btn) setLoading(btn, false);
  }
}

function buildAnalysisRequest(config) {
  const params = typeof collectChartParams === 'function' ? collectChartParams() : {};
  const body = {
    test_type: STATE.activeChartType,
    var: params.var || params.y_var || '',
    use_demo: !STATE.uploadId,
    dataset_name: STATE.datasetName || 'comprehensive_example',
    upload_id: STATE.uploadId || null,
    sheet_name: STATE.activeSheet || null,
    // Include method params for parameter tuning
    params: STATE.methodParams || {},
  };

  if (config.requiresGroup) {
    body.group_var = params.group_var || params.x_var || '';
  }
  if (config.requiresPaired) {
    body.paired_var = params.paired_var || params.end_var || params.var2 || '';
  }
  if (config.supportsPostHoc) {
    body.post_hoc = STATE.postHocMethod || null;
  }
  if (config.requiresSubject) {
    body.subject_var = params.subject_var || '';
  }
  if (config.requiresTimeEvent) {
    body.time_var = params.time_var || params.x_var || '';
    body.event_var = params.event_var || '';
  }
  if (config.requiresCovariate) {
    body.covar = params.covar || '';
  }
  if (config.requiresMultiVar) {
    body.x_vars = params.value_vars || params.x_vars || [];
  }

  return body;
}

/* ── Statistical Result Rendering ─────────────────────── */
function renderStatResults(data) {
  const r = data.result;
  const tables = data.tables || {};

  // Render compact statistical summary
  const summaryContainer = el('resultSummary');
  if (summaryContainer) {
    let html = '';
    html += `<div class="stat-compact-summary">
      <div class="stat-compact-kicker">主要结果</div>
      <div class="stat-compact-text">${escapeHtml(buildCompactResultSentence(r))}</div>
    </div>`;

    if (data.discussion) {
      html += renderDiscussionBlock(data.discussion);
    }

    summaryContainer.innerHTML = html;
  }

  // Render tables into their containers
  const resultTableContainer = el('resultTableContainer');
  if (resultTableContainer) {
    resultTableContainer.innerHTML = tables.result
      ? `<h4 class="analysis-section-title">结果表</h4>${renderStatThreeLineTable(tables.result)}`
      : '';
  }

  const groupContainer = el('groupStatsContainer');
  if (groupContainer) {
    groupContainer.innerHTML = tables.group_stats
      ? `<h4 class="analysis-section-title">分组描述统计</h4>${renderStatThreeLineTable(tables.group_stats)}`
      : '';
  }

  const postContainer = el('postHocContainer');
  if (postContainer) {
    postContainer.innerHTML = tables.post_hoc
      ? `<h4 class="analysis-section-title">事后两两比较</h4>${renderStatThreeLineTable(tables.post_hoc)}`
      : '';
  }

  // Also render chart in the chart tab using the loaded dataset
  const chartContainer = el('chartPreviewContainer');
  if (chartContainer && r.test_name) {
    renderStatChart(r, data.result || {});
  }

  // Update chart preview title to match statistical result
  const previewTitle = el('chartPreviewTitle');
  if (previewTitle && r.test_name) {
    previewTitle.textContent = `${r.test_name} — 统计图形`;
  }

  // 图形标题右侧模型指标徽标已移除，避免与左侧流程重复。
  const badge = el('chartPreviewBadge');
  if (badge) {
    badge.textContent = '';
    badge.style.display = 'none';
  }

  // 旧统计描述标题行已删除，统一导出按钮在结果顶栏显示。
  const analysisExportBar = el('analysisExportBar');
  if (analysisExportBar) analysisExportBar.style.display = 'none';
  const topExportBar = el('resultUnifiedExportBar');
  if (topExportBar) topExportBar.hidden = false;

  const chartExportBar = el('chartExportBar');
  if (chartExportBar) chartExportBar.style.display = 'flex';

  if (typeof activateWorkspaceTab === 'function') activateWorkspaceTab('analysis');
}

function buildCompactResultSentence(r) {
  if (!r) return '分析已完成。';
  const name = String(r.test_name || r.method || '统计分析').replace(/\s+—\s+.*$/, '');
  const d = r.details || {};
  const parts = [];

  const add = (label, value, digits = 4) => {
    if (value === null || value === undefined || value === '') return;
    const num = Number(value);
    if (Number.isFinite(num)) parts.push(`${label} = ${num.toFixed(digits)}`);
    else parts.push(`${label} = ${value}`);
  };

  add('Accuracy', r.accuracy ?? d.accuracy ?? d.test_accuracy ?? d.train_accuracy);
  add('CV accuracy', r.cv_accuracy ?? d.cv_accuracy ?? d.cross_validation_accuracy);
  add('baseline', r.baseline ?? d.baseline ?? d.baseline_accuracy);
  add('AUC', r.auc ?? d.auc);
  add('R²', r.r2 ?? d.r2, 3);
  if (r.p_value != null) parts.push(`P = ${formatPValueDisplay(r.p_value)}`);
  else if (r.statistic != null && !parts.length) add('统计量', r.statistic);
  add('n', r.n ?? d.n ?? d.total_n, 0);

  const compact = parts.length ? parts.join('，') : (r.summary || '结果见下方统计结论和结果表。');
  return `${name}已完成：${compact}。`;
}


function renderStatThreeLineTable(tableData) {
  if (!tableData || !tableData.columns || !tableData.rows) return '';
  const { columns, rows, title } = tableData;
  let html = '<div class="compact-table-wrap"><table class="three-line">';
  if (title) html += `<caption>${escapeHtml(title)}</caption>`;
  html += '<thead><tr>';
  columns.forEach(c => { html += `<th>${escapeHtml(String(c))}</th>`; });
  html += '</tr></thead><tbody>';
  (rows || []).forEach(row => {
    html += '<tr>';
    columns.forEach(c => {
      const v = row[c] !== undefined && row[c] !== null ? row[c] : '—';
      html += `<td>${escapeHtml(String(v))}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function renderDiscussionBlock(discussion) {
  if (!discussion) return '';
  let html = '<div class="result-discussion compact-discussion">';
  (discussion.sections || []).forEach(section => {
    html += '<section class="discussion-section">';
    html += `<h4 class="analysis-section-title">${escapeHtml(section.title || '')}</h4>`;
    html += '<ul>';
    (section.items || []).slice(0, 4).forEach(item => {
      html += `<li>${escapeHtml(item)}</li>`;
    });
    html += '</ul></section>';
  });
  html += '</div>';
  return html;
}

function renderTestDetails(r) {
  let html = '';
  const d = r.details || {};
  const tt = r.test_type;

  if (tt === 't_test_independent') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${d.group_1?.name}: n=${d.group_1?.n}, Mean=${d.group_1?.mean}, SD=${d.group_1?.std}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${d.group_2?.name}: n=${d.group_2?.n}, Mean=${d.group_2?.mean}, SD=${d.group_2?.std}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">均值差: ${d.mean_diff}, 95%CI=${(d.ci_95 || []).join(', ')}</p>`;
  } else if (tt === 't_test_paired') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">配对: ${d.n_pairs}对, 干预前: Mean=${d.mean_before}, SD=${d.std_before}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">干预后: Mean=${d.mean_after}, SD=${d.std_after}, 均值差: ${d.mean_diff} ± ${d.std_diff}</p>`;
  } else if (tt === 'one_sample_t_test') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n=${d.n}, Mean=${d.mean}, SD=${d.std}, 参考均值=${d.hypothesized_mean}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">均值差=${d.mean_diff}, 95%CI=[${(d.ci_95 || []).join(', ')}]</p>`;
  } else if (tt === 'normality_test') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n=${d.n}, W统计量=${r.statistic}, 正态性判断: ${d.normal ? '未见显著偏离' : '显著偏离'}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">偏度=${d.skewness}, 峰度=${d.kurtosis}, Median=${d.median} (${d.q1}, ${d.q3})</p>`;
  } else if (tt === 'levene_test') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">组数: ${d.n_groups}, 总样本: ${d.total_n}, 方差齐性: ${d.equal_var ? '可接受' : '不齐'}</p>`;
    if (d.group_stats) {
      for (const [g, s] of Object.entries(d.group_stats)) {
        html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${g}: n=${s.n}, SD=${s.std}, Var=${s.variance}</p>`;
      }
    }
  } else if (tt === 'anova') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">组数: ${d.n_groups}, 总样本: ${d.total_n}</p>`;
    if (d.levene_test) {
      html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">Levene检验: p=${d.levene_test.p_value} (${d.levene_test.equal_var ? '方差齐' : '方差不齐'})</p>`;
    }
    if (d.group_stats) {
      for (const [g, s] of Object.entries(d.group_stats)) {
        html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${g}: n=${s.n}, Mean=${s.mean}, SD=${s.std}</p>`;
      }
    }
  } else if (tt === 'chi_square') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">自由度: ${d.degrees_of_freedom}, 最小期望频数: ${d.min_expected}</p>`;
  } else if (tt === 'fisher_exact' && d.odds_ratio) {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">OR = ${d.odds_ratio}</p>`;
  } else if (tt === 'mann_whitney') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${d.group_1?.name}: n=${d.group_1?.n}, Median=${d.group_1?.median} (${d.group_1?.q1}, ${d.group_1?.q3})</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${d.group_2?.name}: n=${d.group_2?.n}, Median=${d.group_2?.median} (${d.group_2?.q1}, ${d.group_2?.q3})</p>`;
  } else if (tt === 'kruskal_wallis' && d.group_stats) {
    for (const [g, s] of Object.entries(d.group_stats)) {
      html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${g}: n=${s.n}, Median=${s.median} (${s.q1}, ${s.q3})</p>`;
    }
  } else if (tt === 'wilcoxon_signed_rank') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">配对: ${d.n_pairs}对, 正差: ${d.n_positive_diffs}, 负差: ${d.n_negative_diffs}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">差值中位数: ${d.median_diff}</p>`;
  } else if (tt === 'mcnemar' && d.discordant_pairs) {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">不一致对: b=${d.discordant_pairs.b}, c=${d.discordant_pairs.c}</p>`;
  } else if (tt === 'friedman' || tt === 'repeated_measures_anova') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">完整观测: ${d.n_subjects_complete}, 组数: ${d.n_groups}</p>`;
  } else if (tt === 'pearson_correlation' || tt === 'spearman_correlation') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n = ${d.n}${d.r_squared !== undefined ? `, R² = ${d.r_squared}` : ''}</p>`;
  } else if (tt === 'log_rank') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">组别: ${(d.groups || []).join(', ')}</p>`;
  } else if (tt === 'logistic_regression') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n = ${d.n}, 特征数: ${d.n_features}</p>`;
    if (d.odds_ratios) {
      for (const [vname, or] of Object.entries(d.odds_ratios)) {
        html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${vname}: OR = ${or}</p>`;
      }
    }
  } else if (tt === 'linear_regression') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n = ${d.n}, R² = ${d.r_squared}</p>`;
    if (d.coefficients) {
      for (const [vname, coef] of Object.entries(d.coefficients)) {
        html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">${vname}: β = ${coef}</p>`;
      }
    }
  } else if (tt === 'discriminant_analysis' || tt === 'quadratic_discriminant_analysis') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n = ${d.n}, 类别数 = ${d.n_classes}, 预测变量数 = ${d.n_predictors}</p>`;
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">训练准确率 = ${d.accuracy}, 交叉验证准确率 = ${d.cv_accuracy ?? '—'}, 基线准确率 = ${d.baseline_accuracy}</p>`;
  } else if (tt === 'ancova') {
    html += `<p style="margin:4px 0;font-size:12px;color:var(--muted);">n = ${d.n}, 协变量: ${d.covariate}, R² = ${d.r2_full}</p>`;
  }
  return html;
}

/* ── Helpers ──────────────────────────────────────────── */
function formatPValueDisplay(p) {
  if (p === null || p === undefined) return '—';
  if (p < 0.0001) return '< 0.0001';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(4);
}

/* ── Post-hoc Section ─────────────────────────────────── */
function updatePostHocSection() {
  // Post-hoc is now handled via chart params; migrated from old UI
}

/* ── Statistical Chart Visualization ───────────────────── */
/* Computes chart data using the Basicpicture publication-quality pipeline.
   Actual Plotly rendering is deferred to renderChart() when the chart tab becomes visible. */
function renderStatChart(result, fullResult) {
  if (!window.Plotly) return;

  // Prefer full dataset (loaded by loadChartDataset), fall back to preview rows
  let rawData = STATE._statChartData || null;
  if (!rawData || Object.keys(rawData).length === 0) {
    rawData = typeof buildDataFromState === 'function' ? buildDataFromState() : {};
  }
  const params = typeof collectChartParams === 'function' ? collectChartParams() : {};
  const varName = params.var || '';
  const groupVar = params.group_var || '';
  const pairedVar = params.paired_var || '';
  const tt = result.test_type;
  let chartType = tt;

  let traces = [];

  const chartData = result.chart_data || fullResult?.chart_data || STATE.currentStatChartData || null;
  const customTitle = (params.title || (el('chartTitleInput') ? el('chartTitleInput').value : '') || '').trim();
  const titleText = customTitle || chartData?.title || result.test_name || '';
  let layout = { title: { text: titleText } };
  const backendPlot = buildStatPlotFromChartData(chartData, titleText);
  if (backendPlot) {
    traces = backendPlot.traces || [];
    layout = backendPlot.layout || layout;
    chartType = backendPlot.chartType || chartType;
  }

  if (!backendPlot) {
  try {
    if (tt === 't_test_independent' && varName && groupVar && rawData[varName] && rawData[groupVar]) {
      const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
      traces = groups.map((g, i) => ({
        type: 'box', name: String(g),
        y: rawData[varName].filter((_, idx) => rawData[groupVar][idx] == g),
        meta: { colorIndex: i },
        boxmean: 'sd', boxpoints: 'outliers',
      }));
      layout.yaxis = { title: { text: varName } };
      layout.xaxis = { title: { text: groupVar } };
    }
    else if (tt === 't_test_paired' && varName && pairedVar && rawData[varName] && rawData[pairedVar]) {
      const x = rawData[varName].map(Number).filter(v => !isNaN(v));
      const y = rawData[pairedVar].map(Number).filter(v => !isNaN(v));
      const n = Math.min(x.length, y.length);
      traces = [{
        type: 'scatter', mode: 'markers',
        x: x.slice(0, n), y: y.slice(0, n),
        meta: { colorIndex: 0 },
        name: '配对数据点',
      }];
      const allVals = [...x.slice(0, n), ...y.slice(0, n)];
      const lo = Math.min(...allVals), hi = Math.max(...allVals);
      traces.push({ type: 'scatter', mode: 'lines', x: [lo, hi], y: [lo, hi],
        meta: { colorIndex: 1 }, name: 'y=x',
        line: { dash: 'dash' } });
      layout.xaxis = { title: { text: varName } };
      layout.yaxis = { title: { text: pairedVar } };
    }
    else if (tt === 'one_sample_t_test' && varName && rawData[varName]) {
      const vals = rawData[varName].map(Number).filter(v => !isNaN(v));
      traces = [{
        type: 'histogram', x: vals, nbinsx: 28,
        meta: { colorIndex: 0 },
        name: varName,
      }];
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      traces.push({ type: 'scatter', mode: 'lines', x: [mean, mean], y: [0, vals.length],
        meta: { colorIndex: 1 }, name: `均值=${mean.toFixed(2)}`,
        line: { dash: 'dash' } });
      layout.xaxis = { title: { text: varName } };
      layout.yaxis = { title: { text: '频数' } };
      layout.bargap = 0.05;
    }
    else if (tt === 'normality_test' && varName && rawData[varName]) {
      const vals = rawData[varName].map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
      const n = vals.length;
      if (n > 2) {
        const mean = vals.reduce((a, b) => a + b, 0) / n;
        const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
        const qqX = [], qqY = [];
        for (let i = 0; i < n; i++) {
          const p = (i + 0.5) / n;
          const z = _normalInv(p);
          qqX.push(mean + std * z);
          qqY.push(vals[i]);
        }
        traces = [{
          type: 'scatter', mode: 'markers',
          x: qqX, y: qqY,
          meta: { colorIndex: 0 },
          name: 'Q-Q 点',
        }];
        const lo = Math.min(...qqX, ...qqY), hi = Math.max(...qqX, ...qqY);
        traces.push({ type: 'scatter', mode: 'lines', x: [lo, hi], y: [lo, hi],
          meta: { colorIndex: 1 }, name: '参考线',
          line: { dash: 'dash' } });
        layout.xaxis = { title: { text: '理论分位数' } };
        layout.yaxis = { title: { text: '样本分位数' } };
      }
    }
    else if ((tt === 'anova' || tt === 'levene_test' || tt === 'kruskal_wallis') && varName && groupVar && rawData[varName] && rawData[groupVar]) {
      const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
      traces = groups.map((g, i) => ({
        type: 'box', name: String(g),
        y: rawData[varName].filter((_, idx) => rawData[groupVar][idx] == g),
        meta: { colorIndex: i },
        boxmean: 'sd', boxpoints: 'outliers',
      }));
      layout.yaxis = { title: { text: varName } };
      layout.xaxis = { title: { text: groupVar } };
    }
    else if ((tt === 'chi_square' || tt === 'fisher_exact') && varName && groupVar && rawData[varName] && rawData[groupVar]) {
      const rowVals = [...new Set(rawData[varName].filter(v => v !== '' && v != null))];
      const colVals = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
      traces = colVals.map((c, i) => ({
        type: 'bar', name: String(c),
        x: rowVals.map(String),
        y: rowVals.map(rv => rawData[varName].filter((_, idx) => rawData[varName][idx] == rv && rawData[groupVar][idx] == c).length),
        meta: { colorIndex: i },
      }));
      layout.barmode = 'stack';
      layout.xaxis = { title: { text: varName } };
      layout.yaxis = { title: { text: '频数' } };
    }
    else if ((tt === 'mann_whitney') && varName && groupVar && rawData[varName] && rawData[groupVar]) {
      const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
      traces = groups.map((g, i) => ({
        type: 'box', name: String(g),
        y: rawData[varName].filter((_, idx) => rawData[groupVar][idx] == g),
        meta: { colorIndex: i },
        boxmean: 'sd', boxpoints: 'outliers',
      }));
      layout.yaxis = { title: { text: varName } };
      layout.xaxis = { title: { text: groupVar } };
    }
    else if (tt === 'wilcoxon_signed_rank' && varName && pairedVar && rawData[varName] && rawData[pairedVar]) {
      const x = rawData[varName].map(Number).filter(v => !isNaN(v));
      const y = rawData[pairedVar].map(Number).filter(v => !isNaN(v));
      const n = Math.min(x.length, y.length);
      if (n > 0) {
        traces = [{
          type: 'scatter', mode: 'markers',
          x: x.slice(0, n), y: y.slice(0, n),
          meta: { colorIndex: 0 },
          name: '配对数据点',
        }];
        layout.xaxis = { title: { text: varName } };
        layout.yaxis = { title: { text: pairedVar } };
      }
    }
    else if (tt === 'mcnemar') {
      // McNemar uses categorical paired data — use backend chart_data for grouped bar chart
      const cd = result.chart_data || fullResult.chart_data || {};
      const cats = cd.categories || [];
      const c1 = cd.var_1_counts || [];
      const c2 = cd.var_2_counts || [];
      if (cats.length > 0) {
        traces = [
          {
            type: 'bar', name: cd.var_1_name || varName || '变量1',
            x: cats.map(String), y: c1,
            meta: { colorIndex: 0 },
          },
          {
            type: 'bar', name: cd.var_2_name || pairedVar || '变量2',
            x: cats.map(String), y: c2,
            meta: { colorIndex: 1 },
          },
        ];
        layout.barmode = 'group';
        layout.xaxis = { title: { text: '类别' } };
        layout.yaxis = { title: { text: '频数' } };
      }
    }
    else if ((tt === 'pearson_correlation' || tt === 'spearman_correlation') && varName && pairedVar && rawData[varName] && rawData[pairedVar]) {
      const x = rawData[varName].map(Number).filter(v => !isNaN(v));
      const y = rawData[pairedVar].map(Number).filter(v => !isNaN(v));
      const n = Math.min(x.length, y.length);
      traces = [{
        type: 'scatter', mode: 'markers',
        x: x.slice(0, n), y: y.slice(0, n),
        meta: { colorIndex: 0 },
        name: '数据点',
      }];
      if (n > 2) {
        const xs = x.slice(0, n), ys = y.slice(0, n);
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
        if (den > 0) {
          const slope = num / den, intercept = my - slope * mx;
          const xRange = [Math.min(...xs), Math.max(...xs)];
          traces.push({ type: 'scatter', mode: 'lines', x: xRange, y: xRange.map(xv => slope * xv + intercept),
            meta: { colorIndex: 1 }, name: '回归线',
            line: { dash: 'dash' } });
        }
      }
      layout.xaxis = { title: { text: varName } };
      layout.yaxis = { title: { text: pairedVar } };
    }
    else if (tt === 'log_rank') {
      const timeVar = params.time_var || '';
      const eventVar = params.event_var || '';
      if (timeVar && eventVar && rawData[timeVar] && rawData[eventVar] && groupVar && rawData[groupVar]) {
        const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
        traces = groups.map((g, gi) => {
          const times = [], probs = [];
          const groupTimes = rawData[timeVar].filter((_, idx) => rawData[groupVar][idx] == g).map(Number).filter(v => !isNaN(v)).sort((a, b) => a - b);
          const groupEvents = rawData[eventVar].filter((_, idx) => rawData[groupVar][idx] == g);
          let surv = 1.0;
          let atRisk = groupTimes.length;
          times.push(0); probs.push(1);
          for (let i = 0; i < groupTimes.length; i++) {
            const died = groupEvents[i] == 1 || groupEvents[i] == '1' || groupEvents[i] === true;
            if (died) { surv *= (atRisk - 1) / atRisk; }
            atRisk--;
            times.push(groupTimes[i]); probs.push(surv);
          }
          return { type: 'scatter', mode: 'lines', name: String(g), x: times, y: probs, meta: { colorIndex: gi } };
        });
        layout.xaxis = { title: { text: '时间' } };
        layout.yaxis = { title: { text: '生存概率' }, range: [0, 1.05] };
      }
    }
    else if (tt === 'logistic_regression' || tt === 'linear_regression' || tt === 'discriminant_analysis' || tt === 'quadratic_discriminant_analysis') {
      const d = result.details || {};
      const coefs = d.coefficients || d.odds_ratios || {};
      const names = Object.keys(coefs);
      if (names.length > 0) {
        traces = [{
          type: 'bar', name: tt === 'logistic_regression' ? 'OR' : 'β',
          x: names, y: names.map(n => Number(coefs[n]) || 0),
          marker: { color: names.map((_, i) => _statPalette()[i % _statPalette().length]) },
          meta: { colorIndex: 0 },
        }];
        layout.xaxis = { title: { text: '变量' } };
        layout.yaxis = { title: { text: tt === 'logistic_regression' ? 'OR值' : '回归系数β' } };
      }
    }
    else if (tt === 'ancova' && varName && groupVar) {
      if (rawData[varName] && rawData[groupVar]) {
        const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
        traces = groups.map((g, i) => ({
          type: 'box', name: String(g),
          y: rawData[varName].filter((_, idx) => rawData[groupVar][idx] == g),
          meta: { colorIndex: i },
          boxmean: 'sd', boxpoints: 'outliers',
        }));
        layout.yaxis = { title: { text: varName } };
        layout.xaxis = { title: { text: groupVar } };
      }
    }
    else if (tt === 'friedman' || tt === 'repeated_measures_anova') {
      if (varName && groupVar && rawData[varName] && rawData[groupVar]) {
        const groups = [...new Set(rawData[groupVar].filter(v => v !== '' && v != null))];
        traces = groups.map((g, i) => ({
          type: 'box', name: String(g),
          y: rawData[varName].filter((_, idx) => rawData[groupVar][idx] == g),
          meta: { colorIndex: i },
          boxmean: 'sd', boxpoints: 'outliers',
        }));
        layout.yaxis = { title: { text: varName } };
        layout.xaxis = { title: { text: groupVar } };
      }
    }
  } catch (e) {
    console.warn('Stat chart computation failed:', e);
  }
  }

  // No chart data — show placeholder and clear state
  if (traces.length === 0) {
    const container = el('chartPreviewContainer');
    if (container) {
      const oldPlot = container.querySelector('.js-plotly-plot');
      if (oldPlot && window.Plotly) Plotly.purge(oldPlot);
      container.innerHTML = `<div style="width:100%;padding:24px 28px;text-align:center;">
        <h3 style="margin:0 0 12px;color:var(--ink);">${escapeHtml(result.test_name || '')}</h3>
        <p style="font-size:15px;color:var(--muted);">${escapeHtml(result.summary || '')}</p>
      </div>`;
    }
    STATE.currentPlotlyData = null;
    STATE.currentPlotlyLayout = null;
    STATE.currentPlotlyDataRaw = null;
    STATE.currentPlotlyLayoutRaw = null;
    STATE.currentChartKind = null;
    STATE.currentChartSourceData = null;
    STATE.statChartVariants = [];
    STATE.activeStatChartVariantIndex = 0;
    return;
  }

  // ── Apply Basicpicture publication-quality pipeline ──
  const theme = typeof getActiveTheme === 'function' ? getActiveTheme() : (CHART_THEMES ? CHART_THEMES[STATE.chartTheme || 'cnsTheme'] : {});
  const defaultMargin = { l: 72, r: 48, t: 72, b: 72 };
  STATE.currentChartKind = chartType;
  const rawTracesForVariants = JSON.parse(JSON.stringify(traces || []));
  const rawLayoutForVariants = JSON.parse(JSON.stringify(layout || {}));
  STATE.statChartVariants = buildStatChartVariants(rawTracesForVariants, rawLayoutForVariants, chartType, result, rawData, params);
  STATE.activeStatChartVariantIndex = 0;
  STATE.currentPlotlyDataRaw = JSON.parse(JSON.stringify(STATE.statChartVariants[0]?.traces || traces || []));
  STATE.currentPlotlyLayoutRaw = JSON.parse(JSON.stringify(STATE.statChartVariants[0]?.layout || layout || {}));

  if (typeof polishTracesForPublication === 'function') {
    traces = polishTracesForPublication(JSON.parse(JSON.stringify(traces || [])), theme);
  }
  if (typeof applyThemeLayout === 'function') {
    layout = applyThemeLayout(JSON.parse(JSON.stringify(layout || {})), theme);
  }
  layout.margin = { ...defaultMargin, ...(layout.margin || {}) };
  if (typeof polishLayoutForPublication === 'function') {
    layout = polishLayoutForPublication(layout, chartType, theme);
  }
  layout.autosize = true;
  if (layout.showlegend === undefined) {
    layout.showlegend = traces.some(t => t && t.showlegend !== false && t.name);
  }

  // Store polished chart data in STATE (defer Plotly rendering to renderChart())
  STATE.currentPlotlyData = traces;
  STATE.currentPlotlyLayout = layout;
  STATE.currentChartSourceData = rawData;
  if (typeof saveCurrentChartParams === 'function') saveCurrentChartParams(params);

  // Prepare container placeholder
  const container = el('chartPreviewContainer');
  if (container) {
    if (typeof disconnectChartResizeObserver === 'function') disconnectChartResizeObserver();
    const oldPlot = container.matches('.js-plotly-plot') ? container : container.querySelector('.js-plotly-plot');
    if (oldPlot && window.Plotly) Plotly.purge(oldPlot);
    container.innerHTML = '<div class="empty-state">图表数据已准备，切换到可视化标签查看</div>';
    container.classList.remove('js-plotly-plot');
  }
}



function sigmoidForPlot(x) {
  return 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, x))));
}

function getNumericArrayFromRaw(rawData, col) {
  if (!rawData || !col || !rawData[col]) return [];
  return (rawData[col] || []).map(Number).map(v => Number.isFinite(v) ? v : null);
}

function getStandardizedMatrixFromRaw(rawData, predictors) {
  const arrays = predictors.map(p => getNumericArrayFromRaw(rawData, p));
  const n = Math.min(...arrays.map(a => a.length).filter(Boolean));
  if (!Number.isFinite(n) || n <= 0) return null;
  const means = arrays.map(a => {
    const vals = a.filter(v => v !== null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  });
  const sds = arrays.map((a, j) => {
    const vals = a.filter(v => v !== null);
    if (vals.length < 2) return 1;
    const m = means[j];
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1));
    return sd || 1;
  });
  return { arrays, n, means, sds };
}


function buildLogisticAdvancedVariants(result, rawData, params, baseLayout) {
  const variants = [];
  const details = result.details || {};
  const ors = details.odds_ratios || {};
  const coefs = details.coefficients || {};
  const predictors = details.encoded_predictors || details.predictors || Object.keys(ors);
  const outcome = params.var || params.outcome_var || '';
  const titleBase = result.test_name || 'Logistic回归分析';

  const orRows = predictors
    .map((name, idx) => ({
      name,
      coef: Number(coefs[name]),
      or: Number(ors[name]),
      idx,
    }))
    .filter(d => Number.isFinite(d.or) && d.or > 0);

  if (orRows.length) {
    const sorted = orRows.slice().sort((a, b) => Math.abs(Math.log(b.or)) - Math.abs(Math.log(a.or)));
    const orMin = Math.min(...sorted.map(d => d.or), 1);
    const orMax = Math.max(...sorted.map(d => d.or), 1);
    const xMin = Math.max(0.2, orMin * 0.88);
    const xMax = Math.min(5.5, orMax * 1.14);
    const yVals = sorted.map((_, i) => sorted.length - i);

    // 主图：高分期刊风格 OR 参考谱（每个变量单独一条，可独立改色）
    const mainTraces = [];
    sorted.forEach((d, i) => {
      const y = yVals[i];
      mainTraces.push({
        type: 'scatter',
        mode: 'lines+markers+text',
        x: [1, d.or],
        y: [y, y],
        name: d.name,
        text: ['', `${d.or.toFixed(2)}`],
        textposition: 'middle right',
        marker: { size: [0, 11], symbol: ['circle-open', d.or >= 1 ? 'diamond' : 'circle'] },
        line: { width: 3.2 },
        hovertemplate: `${d.name}<br>OR=${d.or.toFixed(3)}<extra></extra>`,
        meta: { colorIndex: i, visualRole: 'effectLollipop' },
        showlegend: false,
      });
    });
    variants.push({
      label: '主图',
      title: `${titleBase} — OR参考谱`,
      chartType: 'logistic_or_reference',
      traces: mainTraces,
      layout: {
        title: { text: `${titleBase} — OR参考谱` },
        xaxis: {
          title: { text: 'Odds ratio（每1 SD增加）' },
          type: 'log',
          range: [Math.log10(xMin), Math.log10(xMax)],
          tickvals: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax),
          ticktext: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax).map(v => String(v)),
          zeroline: false,
          showline: true,
        },
        yaxis: {
          title: { text: '' },
          tickmode: 'array',
          tickvals: yVals,
          ticktext: sorted.map(d => d.name),
          range: [0.5, sorted.length + 0.5],
          automargin: true,
          zeroline: false,
        },
        shapes: [{
          type: 'line', x0: 1, x1: 1, y0: 0.5, y1: sorted.length + 0.5,
          xref: 'x', yref: 'y',
          line: { color: '#111827', width: 1.5, dash: 'dash' },
        }],
        annotations: [{
          x: 1, y: sorted.length + 0.35, xref: 'x', yref: 'y',
          text: 'OR=1', showarrow: false, font: { size: 12, color: '#334155' },
        }],
        margin: { l: 128, r: 64, t: 88, b: 76 },
        showlegend: false,
      },
    });

    // 第二图：OR双效谱（更强调高于/低于1）
    variants.push({
      label: 'OR双效谱',
      title: `${titleBase} — OR双效谱`,
      chartType: 'logistic_or_profile',
      traces: [{
        type: 'bar',
        orientation: 'h',
        y: sorted.map(d => d.name).slice().reverse(),
        x: sorted.map(d => d.or).slice().reverse(),
        base: 1,
        text: sorted.map(d => d.or.toFixed(2)).slice().reverse(),
        textposition: 'outside',
        marker: {
          color: sorted.map((d, i) => i).slice().reverse(),
          colorscale: sorted.map((d, i, arr) => [arr.length <= 1 ? 1 : i / (arr.length - 1), d.or >= 1 ? '#c65b52' : '#2e8c83']),
          line: { color: 'rgba(31,41,55,0.22)', width: 0.8 },
        },
        hovertemplate: '%{y}<br>OR=%{x:.3f}<extra></extra>',
        showlegend: false,
        meta: { visualRole: 'effectBar' },
      }],
      layout: {
        title: { text: `${titleBase} — OR双效谱` },
        xaxis: {
          title: { text: 'Odds ratio（每1 SD增加）' },
          type: 'log',
          range: [Math.log10(xMin), Math.log10(xMax)],
          tickvals: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax),
          ticktext: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax).map(v => String(v)),
        },
        yaxis: { title: { text: '预测变量' }, automargin: true },
        shapes: [{ type: 'line', x0: 1, x1: 1, y0: -0.5, y1: sorted.length - 0.5, xref: 'x', yref: 'y', line: { color: '#111827', width: 1.5, dash: 'dash' } }],
        margin: { l: 138, r: 66, t: 88, b: 76 },
        showlegend: false,
      },
    });

    // 第三图：棒棒糖图（每个变量单独一个 trace，可逐一改色，不再“悬空”）
    const lollipopTraces = [];
    sorted.forEach((d, i) => {
      const x = i + 1;
      const lo = Math.min(1, d.or);
      const hi = Math.max(1, d.or);
      lollipopTraces.push({
        type: 'scatter',
        mode: 'lines+markers',
        x: [x, x],
        y: [lo, hi],
        name: d.name,
        marker: { size: [0, 11], symbol: ['circle-open', d.or >= 1 ? 'diamond' : 'circle'] },
        line: { width: 2.8 },
        hovertemplate: `${d.name}<br>OR=${d.or.toFixed(3)}<extra></extra>`,
        meta: { colorIndex: i, visualRole: 'effectLollipop' },
        showlegend: false,
      });
    });
    variants.push({
      label: '棒棒糖图',
      title: `${titleBase} — OR棒棒糖图`,
      chartType: 'lollipop',
      traces: lollipopTraces,
      layout: {
        title: { text: `${titleBase} — OR棒棒糖图` },
        xaxis: {
          title: { text: '预测变量' },
          tickmode: 'array',
          tickvals: sorted.map((_, i) => i + 1),
          ticktext: sorted.map(d => d.name),
          range: [0.5, sorted.length + 0.5],
          automargin: true,
        },
        yaxis: {
          title: { text: 'Odds ratio（每1 SD增加）' },
          type: 'log',
          range: [Math.log10(xMin), Math.log10(xMax)],
          tickvals: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax),
          ticktext: [0.5, 0.75, 1, 1.5, 2, 3].filter(v => v >= xMin && v <= xMax).map(v => String(v)),
          zeroline: false,
        },
        shapes: [{
          type: 'line', x0: 0.5, x1: sorted.length + 0.5, y0: 1, y1: 1,
          xref: 'x', yref: 'y',
          line: { color: '#111827', width: 1.5, dash: 'dash' },
        }],
        annotations: [{
          x: sorted.length + 0.32, y: 1, xref: 'x', yref: 'y',
          text: 'OR=1', showarrow: false, font: { size: 12, color: '#334155' },
        }],
        margin: { l: 92, r: 54, t: 88, b: 90 },
        showlegend: false,
      },
    });

    // 第四图：极坐标贡献图（发散一点）
    variants.push({
      label: '极坐标贡献',
      title: `${titleBase} — 极坐标贡献图`,
      chartType: 'polar_bar',
      traces: [{
        type: 'barpolar',
        theta: sorted.map(d => d.name),
        r: sorted.map(d => Math.abs(Math.log2(d.or)) * 100),
        text: sorted.map(d => `OR=${d.or.toFixed(2)}`),
        marker: {
          color: sorted.map(d => d.or >= 1 ? '#c65b52' : '#2e8c83'),
          line: { color: 'rgba(31,41,55,0.18)', width: 0.8 },
        },
        hovertemplate: '%{theta}<br>%{text}<br>Effect magnitude=%{r:.1f}<extra></extra>',
        meta: { visualRole: 'polarEffect' },
        showlegend: false,
      }],
      layout: {
        title: { text: `${titleBase} — 极坐标贡献图` },
        polar: {
          radialaxis: { title: { text: '|log2(OR)| × 100' }, ticksuffix: '' },
          angularaxis: { direction: 'clockwise' },
        },
        margin: { l: 54, r: 54, t: 88, b: 54 },
        showlegend: false,
      },
    });
  }

  const matrixPredictors = (details.numeric_predictors || predictors)
    .filter(p => rawData && rawData[p] && Number.isFinite(Number(coefs[p])));
  const matrix = getStandardizedMatrixFromRaw(rawData, matrixPredictors);
  const yRaw = rawData && outcome ? (rawData[outcome] || []) : [];
  if (matrix && matrixPredictors.length && yRaw.length) {
    const probs = [];
    const labels = [];
    for (let i = 0; i < matrix.n; i++) {
      let ok = true;
      let lp = Number(details.intercept || 0);
      matrixPredictors.forEach((p, j) => {
        const v = matrix.arrays[j][i];
        if (v === null) ok = false;
        lp += Number(coefs[p] || 0) * ((v - matrix.means[j]) / matrix.sds[j]);
      });
      if (!ok || yRaw[i] === null || yRaw[i] === undefined || yRaw[i] === '') continue;
      probs.push(sigmoidForPlot(lp));
      labels.push(String(yRaw[i]));
    }
    if (probs.length > 20) {
      const groups = [...new Set(labels)].slice(0, 4);
      const boxTraces = groups.map((g, idx) => ({
        type: 'violin',
        name: g,
        y: probs.filter((_, i) => labels[i] === g),
        points: 'all',
        jitter: 0.18,
        pointpos: 0,
        marker: { size: 5.5, opacity: 0.45 },
        box: { visible: true },
        meanline: { visible: true },
        spanmode: 'hard',
        hovertemplate: `${g}<br>Predicted probability=%{y:.3f}<extra></extra>`,
        meta: { colorIndex: idx },
      })).filter(t => t.y.length);
      if (boxTraces.length) {
        variants.push({
          label: '预测概率分布',
          title: `${titleBase} — 预测概率分布`,
          chartType: 'probability_distribution',
          traces: boxTraces,
          layout: {
            title: { text: `${titleBase} — 预测概率分布` },
            xaxis: { title: { text: '实际类别' }, type: 'category' },
            yaxis: { title: { text: 'Predicted probability' }, range: [0, 1] },
            violinmode: 'group',
            showlegend: false,
            margin: { l: 86, r: 42, t: 86, b: 78 },
          },
        });
      }

      const bins = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, pred: [], obs: [] }));
      const positive = groups[groups.length - 1];
      probs.forEach((p, i) => {
        const b = Math.min(9, Math.max(0, Math.floor(p * 10)));
        bins[b].pred.push(p);
        bins[b].obs.push(labels[i] === positive ? 1 : 0);
      });
      const cal = bins.map((b, i) => ({
        x: b.pred.length ? b.pred.reduce((s, v) => s + v, 0) / b.pred.length : null,
        y: b.obs.length ? b.obs.reduce((s, v) => s + v, 0) / b.obs.length : null,
        n: b.obs.length,
        label: `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`,
      })).filter(d => d.x !== null && d.y !== null);
      if (cal.length >= 3) {
        variants.push({
          label: '校准曲线',
          title: `${titleBase} — 校准曲线`,
          chartType: 'calibration_curve',
          traces: [
            { type: 'scatter', mode: 'lines', x: [0, 1], y: [0, 1], name: '理想校准', line: { dash: 'dash', width: 2 }, meta: { fixedColor: '#94a3b8' } },
            { type: 'scatter', mode: 'lines+markers', x: cal.map(d => d.x), y: cal.map(d => d.y), text: cal.map(d => `n=${d.n}`), name: '观察校准', marker: { size: cal.map(d => Math.max(8, Math.min(22, Math.sqrt(d.n) * 2.2))) }, meta: { colorIndex: 0 } },
          ],
          layout: {
            title: { text: `${titleBase} — 校准曲线` },
            xaxis: { title: { text: 'Mean predicted probability' }, range: [0, 1] },
            yaxis: { title: { text: 'Observed event rate' }, range: [0, 1] },
            showlegend: true,
            margin: { l: 86, r: 42, t: 86, b: 78 },
          },
        });
      }
    }
  }

  return variants;
}


function buildLinearAdvancedVariants(result, rawData, params, baseLayout) {
  const variants = [];
  const details = result.details || {};
  const coefs = details.coefficients || {};
  const predictors = details.encoded_predictors || details.predictors || Object.keys(coefs);
  const yVar = params.var || params.y_var || params.outcome_var || '';
  const titleBase = result.test_name || '线性回归分析';

  const rows = predictors
    .map((name, idx) => ({ name, beta: Number(coefs[name]), idx }))
    .filter(d => Number.isFinite(d.beta));

  if (rows.length) {
    const sorted = rows.slice().sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));
    const absMax = Math.max(...sorted.map(d => Math.abs(d.beta)), 0.5);
    const xMin = -absMax * 1.16;
    const xMax = absMax * 1.16;
    const yVals = sorted.map((_, i) => sorted.length - i);

    // 主图：β参考谱（横向从0出发，不再是粗糙默认柱图）
    const mainTraces = [];
    sorted.forEach((d, i) => {
      const y = yVals[i];
      mainTraces.push({
        type: 'scatter',
        mode: 'lines+markers+text',
        x: [0, d.beta],
        y: [y, y],
        name: d.name,
        text: ['', `${d.beta.toFixed(2)}`],
        textposition: d.beta >= 0 ? 'middle right' : 'middle left',
        marker: { size: [0, 11], symbol: ['circle-open', d.beta >= 0 ? 'diamond' : 'circle'] },
        line: { width: 3.0 },
        hovertemplate: `${d.name}<br>β=${d.beta.toFixed(3)}<extra></extra>`,
        meta: { colorIndex: i, visualRole: 'effectLollipop' },
        showlegend: false,
      });
    });
    variants.push({
      label: '主图',
      title: `${titleBase} — β参考谱`,
      chartType: 'linear_beta_reference',
      traces: mainTraces,
      layout: {
        title: { text: `${titleBase} — β参考谱` },
        xaxis: {
          title: { text: '标准化回归系数 β' },
          range: [xMin, xMax],
          zeroline: false,
          showline: true,
        },
        yaxis: {
          title: { text: '' },
          tickmode: 'array',
          tickvals: yVals,
          ticktext: sorted.map(d => d.name),
          range: [0.5, sorted.length + 0.5],
          automargin: true,
          zeroline: false,
        },
        shapes: [{
          type: 'line', x0: 0, x1: 0, y0: 0.5, y1: sorted.length + 0.5,
          xref: 'x', yref: 'y',
          line: { color: '#111827', width: 1.5, dash: 'dash' },
        }],
        annotations: [{
          x: 0, y: sorted.length + 0.35, xref: 'x', yref: 'y',
          text: 'β=0', showarrow: false, font: { size: 12, color: '#334155' },
        }],
        margin: { l: 130, r: 64, t: 88, b: 76 },
        showlegend: false,
      },
    });

    // β系数谱：左右分叉柱状图
    variants.push({
      label: 'β系数谱',
      title: `${titleBase} — 标准化β系数谱`,
      chartType: 'linear_beta_profile',
      traces: [{
        type: 'bar',
        orientation: 'h',
        y: sorted.map(d => d.name).slice().reverse(),
        x: sorted.map(d => d.beta).slice().reverse(),
        name: 'β',
        text: sorted.map(d => d.beta.toFixed(2)).slice().reverse(),
        textposition: 'outside',
        marker: {
          color: sorted.map(d => d.beta >= 0 ? '#d95f59' : '#2a9d8f').slice().reverse(),
          line: { color: 'rgba(31,41,55,0.20)', width: 0.8 },
        },
        showlegend: false,
        meta: { visualRole: 'effectBar' },
      }],
      layout: {
        title: { text: `${titleBase} — 标准化β系数谱` },
        xaxis: { title: { text: '标准化回归系数 β' }, range: [xMin, xMax] },
        yaxis: { title: { text: '预测变量' }, automargin: true },
        shapes: [{ type: 'line', x0: 0, x1: 0, y0: -0.5, y1: sorted.length - 0.5, xref: 'x', yref: 'y', line: { color: '#111827', width: 1.5, dash: 'dash' } }],
        margin: { l: 138, r: 66, t: 88, b: 76 },
        showlegend: false,
      },
    });

    // 棒棒糖图：明确从0出发，不再悬空
    const lollipopTraces = [];
    sorted.forEach((d, i) => {
      const x = i + 1;
      lollipopTraces.push({
        type: 'scatter',
        mode: 'lines+markers',
        x: [x, x],
        y: [0, d.beta],
        name: d.name,
        marker: { size: [0, 11], symbol: ['circle-open', d.beta >= 0 ? 'diamond' : 'circle'] },
        line: { width: 2.8 },
        hovertemplate: `${d.name}<br>β=${d.beta.toFixed(3)}<extra></extra>`,
        meta: { colorIndex: i, visualRole: 'effectLollipop' },
        showlegend: false,
      });
    });
    variants.push({
      label: '棒棒糖图',
      title: `${titleBase} — β棒棒糖图`,
      chartType: 'lollipop',
      traces: lollipopTraces,
      layout: {
        title: { text: `${titleBase} — β棒棒糖图` },
        xaxis: {
          title: { text: '预测变量' },
          tickmode: 'array',
          tickvals: sorted.map((_, i) => i + 1),
          ticktext: sorted.map(d => d.name),
          range: [0.5, sorted.length + 0.5],
          automargin: true,
        },
        yaxis: {
          title: { text: '标准化回归系数 β' },
          range: [Math.min(0, xMin), Math.max(0, xMax)],
          zeroline: false,
        },
        shapes: [{
          type: 'line', x0: 0.5, x1: sorted.length + 0.5, y0: 0, y1: 0,
          xref: 'x', yref: 'y',
          line: { color: '#111827', width: 1.5, dash: 'dash' },
        }],
        annotations: [{
          x: sorted.length + 0.32, y: 0, xref: 'x', yref: 'y',
          text: 'β=0', showarrow: false, font: { size: 12, color: '#334155' },
        }],
        margin: { l: 92, r: 54, t: 88, b: 90 },
        showlegend: false,
      },
    });

    // 极坐标贡献图
    variants.push({
      label: '极坐标贡献',
      title: `${titleBase} — 极坐标贡献图`,
      chartType: 'polar_bar',
      traces: [{
        type: 'barpolar',
        theta: sorted.map(d => d.name),
        r: sorted.map(d => Math.abs(d.beta) * 100),
        text: sorted.map(d => `β=${d.beta.toFixed(2)}`),
        marker: {
          color: sorted.map(d => d.beta >= 0 ? '#d95f59' : '#2a9d8f'),
          line: { color: 'rgba(31,41,55,0.18)', width: 0.8 },
        },
        hovertemplate: '%{theta}<br>%{text}<br>Effect magnitude=%{r:.1f}<extra></extra>',
        meta: { visualRole: 'polarEffect' },
        showlegend: false,
      }],
      layout: {
        title: { text: `${titleBase} — 极坐标贡献图` },
        polar: {
          radialaxis: { title: { text: '|β| × 100' } },
          angularaxis: { direction: 'clockwise' },
        },
        margin: { l: 54, r: 54, t: 88, b: 54 },
        showlegend: false,
      },
    });
  }

  const matrixPredictors = (details.numeric_predictors || predictors)
    .filter(p => rawData && rawData[p] && Number.isFinite(Number(coefs[p])));
  const matrix = getStandardizedMatrixFromRaw(rawData, matrixPredictors);
  const y = getNumericArrayFromRaw(rawData, yVar);
  if (matrix && matrixPredictors.length && y.length) {
    const observed = [];
    const predicted = [];
    const resid = [];
    for (let i = 0; i < matrix.n; i++) {
      let ok = true;
      let pred = Number(details.intercept || 0);
      matrixPredictors.forEach((p, j) => {
        const v = matrix.arrays[j][i];
        if (v === null) ok = false;
        pred += Number(coefs[p] || 0) * ((v - matrix.means[j]) / matrix.sds[j]);
      });
      if (!ok || !Number.isFinite(y[i])) continue;
      observed.push(y[i]);
      predicted.push(pred);
      resid.push(y[i] - pred);
    }
    if (observed.length > 20) {
      const minVal = Math.min(...observed, ...predicted);
      const maxVal = Math.max(...observed, ...predicted);
      variants.push({
        label: '预测-观察',
        title: `${titleBase} — 预测值与观察值`,
        chartType: 'observed_predicted',
        traces: [
          {
            type: 'scatter',
            mode: 'markers',
            x: predicted,
            y: observed,
            name: '样本',
            marker: { size: 8, opacity: 0.72 },
            meta: { colorIndex: 0 },
            showlegend: false,
          },
          {
            type: 'scatter',
            mode: 'lines',
            x: [minVal, maxVal],
            y: [minVal, maxVal],
            name: '理想线',
            line: { dash: 'dash', width: 2.2 },
            meta: { fixedColor: '#94a3b8' },
            showlegend: false,
          },
        ],
        layout: {
          title: { text: `${titleBase} — 预测值与观察值` },
          xaxis: { title: { text: 'Predicted' } },
          yaxis: { title: { text: 'Observed' } },
          margin: { l: 86, r: 42, t: 86, b: 78 },
        },
      });

      variants.push({
        label: '残差诊断',
        title: `${titleBase} — 残差诊断`,
        chartType: 'residual_diagnostic',
        traces: [{
          type: 'scatter',
          mode: 'markers',
          x: predicted,
          y: resid,
          name: '残差',
          marker: { size: 7.5, opacity: 0.72 },
          meta: { colorIndex: 1 },
          showlegend: false,
        }],
        layout: {
          title: { text: `${titleBase} — 残差诊断` },
          xaxis: { title: { text: 'Predicted' } },
          yaxis: { title: { text: 'Residual' } },
          shapes: [{
            type: 'line', x0: Math.min(...predicted), x1: Math.max(...predicted), y0: 0, y1: 0,
            xref: 'x', yref: 'y',
            line: { color: '#111827', width: 1.3, dash: 'dash' },
          }],
          showlegend: false,
          margin: { l: 86, r: 42, t: 86, b: 78 },
        },
      });
    }
  }
  return variants;
}

function buildDiscriminantAdvancedVariants(result, rawData, params, baseLayout) {
  const variants = [];
  const details = result.details || {};
  const coefs = details.coefficients || {};
  const titleBase = result.test_name || '判别分析';

  const names = Object.keys(coefs).filter(k => Number.isFinite(Number(coefs[k])));
  if (names.length) {
    const sorted = names.sort((a, b) => Math.abs(Number(coefs[b])) - Math.abs(Number(coefs[a]))).slice(0, 12);
    variants.push({
      label: '变量贡献',
      title: `${titleBase} — 变量贡献`,
      chartType: 'discriminant_loading',
      traces: [{
        type: 'bar',
        orientation: 'h',
        y: sorted.slice().reverse(),
        x: sorted.slice().reverse().map(k => Math.abs(Number(coefs[k]))),
        name: '|loading|',
        text: sorted.slice().reverse().map(k => Math.abs(Number(coefs[k])).toFixed(2)),
        textposition: 'outside',
        meta: { colorIndex: 0 },
      }],
      layout: {
        title: { text: `${titleBase} — 变量贡献` },
        xaxis: { title: { text: 'Absolute standardized loading' } },
        yaxis: { title: { text: '变量' }, automargin: true },
        showlegend: false,
        margin: { l: 135, r: 60, t: 88, b: 74 },
      },
    });
  }
  return variants;
}



function getStringArrayFromRaw(rawData, col) {
  if (!rawData || !col || !rawData[col]) return [];
  return (rawData[col] || []).map(v => v == null ? '' : String(v));
}

function _finiteNums(arr) {
  return (arr || []).map(v => Number(v)).filter(v => Number.isFinite(v));
}

function _mean(arr) {
  const vals = _finiteNums(arr);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

function _sd(arr) {
  const vals = _finiteNums(arr);
  if (vals.length < 2) return null;
  const m = _mean(vals);
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1));
}

function _quantile(arr, q) {
  const vals = _finiteNums(arr).sort((a, b) => a - b);
  if (!vals.length) return null;
  const pos = (vals.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return vals[base + 1] !== undefined ? vals[base] + rest * (vals[base + 1] - vals[base]) : vals[base];
}

function _cleanPairedXY(x, y) {
  const pairs = [];
  const n = Math.min((x || []).length, (y || []).length);
  for (let i = 0; i < n; i += 1) {
    const xv = Number(x[i]);
    const yv = Number(y[i]);
    if (Number.isFinite(xv) && Number.isFinite(yv)) pairs.push([xv, yv]);
  }
  return pairs;
}

function _groupedNumericFromRaw(rawData, yVar, gVar) {
  const y = getNumericArrayFromRaw(rawData, yVar);
  const g = getStringArrayFromRaw(rawData, gVar);
  const n = Math.min(y.length, g.length);
  const map = new Map();
  for (let i = 0; i < n; i += 1) {
    const yi = y[i];
    const gi = g[i];
    if (!Number.isFinite(yi) || gi == null || gi === '') continue;
    if (!map.has(gi)) map.set(gi, []);
    map.get(gi).push(yi);
  }
  return map;
}

function _silvermanBandwidth(vals) {
  const x = _finiteNums(vals);
  if (x.length < 2) return 1;
  const sd = _sd(x) || 1;
  const iqr = (_quantile(x, 0.75) - _quantile(x, 0.25)) || sd;
  const sigma = Math.min(sd, iqr / 1.34) || sd || 1;
  return Math.max(1e-6, 0.9 * sigma * Math.pow(x.length, -0.2));
}

function _gaussian(u) { return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI); }

function _kdeSeries(vals, nPts = 160) {
  const x = _finiteNums(vals);
  if (x.length < 5) return null;
  const min = Math.min(...x);
  const max = Math.max(...x);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null;
  const bw = _silvermanBandwidth(x);
  const pad = Math.max((max - min) * 0.08, bw * 2.4);
  const start = min - pad;
  const end = max + pad;
  const xs = [];
  const ys = [];
  for (let i = 0; i < nPts; i += 1) {
    const xi = start + (end - start) * (i / (nPts - 1));
    const yi = x.reduce((s, v) => s + _gaussian((xi - v) / bw), 0) / (x.length * bw);
    xs.push(xi);
    ys.push(yi);
  }
  return { x: xs, y: ys };
}

function buildSingleContinuousAdvancedVariants(result, rawData, params) {
  const variants = [];
  const varName = params.var || params.y_var || params.outcome_var || params.outcome_vars?.[0] || '';
  const vals = _finiteNums(getNumericArrayFromRaw(rawData, varName));
  if (vals.length < 5) return variants;
  const m = _mean(vals);
  const med = _quantile(vals, 0.5);
  const q1 = _quantile(vals, 0.25);
  const q3 = _quantile(vals, 0.75);
  const kde = _kdeSeries(vals);

  if (kde) {
    const refMean = Number(result?.details?.hypothesized_mean);
    const hasRef = Number.isFinite(refMean);
    variants.push({
      label: '密度曲线',
      titleSuffix: '密度曲线',
      chartType: 'density',
      traces: [
        {
          type: 'scatter',
          mode: 'lines',
          x: kde.x,
          y: kde.y,
          fill: 'tozeroy',
          name: 'Density',
          line: { width: 3.2 },
          meta: { colorIndex: 0, visualRole: 'densityArea' },
          showlegend: false,
        },
        {
          type: 'scatter',
          mode: 'lines',
          x: [m, m],
          y: [0, Math.max(...kde.y) * 1.04],
          name: 'Mean',
          line: { dash: 'dash', width: 2.1 },
          meta: { fixedColor: '#D95F59', visualRole: 'referenceLine' },
          showlegend: false,
        },
        hasRef ? {
          type: 'scatter',
          mode: 'lines',
          x: [refMean, refMean],
          y: [0, Math.max(...kde.y) * 1.04],
          name: 'Reference',
          line: { dash: 'dot', width: 2.0 },
          meta: { fixedColor: '#475569', visualRole: 'referenceLine' },
          showlegend: false,
        } : null,
      ],
      layout: {
        xaxis: { title: { text: varName } },
        yaxis: { title: { text: 'Density' } },
        annotations: [
          { x: m, y: Math.max(...kde.y) * 1.02, xref: 'x', yref: 'y', text: `Mean=${m.toFixed(2)}`, showarrow: false, font: { size: 12 } },
          { x: med, y: Math.max(...kde.y) * 0.90, xref: 'x', yref: 'y', text: `Median=${med.toFixed(2)}`, showarrow: false, font: { size: 12 } },
        ],
        margin: { l: 78, r: 36, t: 88, b: 72 },
        showlegend: false,
      },
    });
  }

  variants.push({
    label: '小提琴摘要',
    titleSuffix: '小提琴摘要',
    chartType: 'violin',
    traces: [{
      type: 'violin',
      y: vals,
      x: Array(vals.length).fill(varName),
      name: varName,
      points: 'all',
      jitter: 0.08,
      pointpos: 0,
      box: { visible: true },
      meanline: { visible: true },
      meta: { colorIndex: 0, visualRole: 'distributionViolin' },
      showlegend: false,
    }],
    layout: {
      yaxis: { title: { text: varName } },
      xaxis: { title: { text: '' } },
      annotations: [
        { x: 0.98, y: 0.98, xref: 'paper', yref: 'paper', xanchor: 'right', yanchor: 'top', showarrow: false,
          text: `n=${vals.length}<br>Q1=${q1.toFixed(2)}<br>Median=${med.toFixed(2)}<br>Q3=${q3.toFixed(2)}`, align: 'left', font: { size: 12 } }
      ],
      margin: { l: 78, r: 44, t: 88, b: 60 },
      showlegend: false,
    },
  });

  variants.push({
    label: 'ECDF',
    titleSuffix: '经验累积分布',
    chartType: 'ecdf',
    traces: [{
      type: 'scatter',
      mode: 'lines',
      x: vals.slice().sort((a, b) => a - b),
      y: vals.slice().sort((a, b) => a - b).map((_, i) => (i + 1) / vals.length),
      name: 'ECDF',
      line: { width: 3.0 },
      meta: { colorIndex: 0, visualRole: 'lineSeries' },
      showlegend: false,
    }],
    layout: {
      xaxis: { title: { text: varName } },
      yaxis: { title: { text: 'Cumulative probability' }, range: [0, 1.02] },
      margin: { l: 78, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });
  return variants;
}

function buildGroupedContinuousAdvancedVariants(result, rawData, params) {
  const variants = [];
  const yVar = params.var || params.y_var || params.outcome_var || params.outcome_vars?.[0] || '';
  const gVar = params.group_var || params.x_var || params.research_vars?.[0] || '';
  const groups = _groupedNumericFromRaw(rawData, yVar, gVar);
  const labels = Array.from(groups.keys());
  if (labels.length < 2) return variants;

  variants.push({
    label: '雨云图',
    titleSuffix: '雨云图',
    chartType: 'violin',
    traces: labels.flatMap((lab, i) => {
      const vals = groups.get(lab) || [];
      return [
        {
          type: 'violin',
          x: Array(vals.length).fill(lab),
          y: vals,
          side: 'positive',
          width: 0.82,
          points: false,
          box: { visible: true },
          meanline: { visible: true },
          spanmode: 'soft',
          name: lab,
          meta: { colorIndex: i, visualRole: 'distributionViolin' },
          showlegend: false,
        },
        {
          type: 'scatter',
          mode: 'markers',
          x: vals.map(() => lab),
          y: vals.map((v, j) => v + 0),
          name: `${lab}样本`,
          marker: { size: 6, opacity: 0.45 },
          meta: { colorIndex: i, visualRole: 'jitterPoints' },
          showlegend: false,
        },
      ];
    }),
    layout: {
      violinmode: 'group',
      xaxis: { title: { text: gVar } },
      yaxis: { title: { text: yVar } },
      margin: { l: 82, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });

  const stats = labels.map(lab => {
    const vals = groups.get(lab) || [];
    const m = _mean(vals);
    const sd = _sd(vals) || 0;
    const se = vals.length > 1 ? sd / Math.sqrt(vals.length) : 0;
    return { label: lab, n: vals.length, mean: m, lo: m - 1.96 * se, hi: m + 1.96 * se };
  }).filter(d => Number.isFinite(d.mean));

  if (stats.length) {
    variants.push({
      label: '均值CI',
      titleSuffix: '均值与95%CI',
      chartType: 'scatter',
      traces: [{
        type: 'scatter',
        mode: 'markers+text',
        x: stats.map(d => d.label),
        y: stats.map(d => d.mean),
        text: stats.map(d => d.mean.toFixed(2)),
        textposition: 'top center',
        error_y: { type: 'data', symmetric: false, array: stats.map(d => d.hi - d.mean), arrayminus: stats.map(d => d.mean - d.lo), thickness: 1.4, width: 0 },
        marker: { size: 11 },
        name: 'Mean ± 95%CI',
        meta: { colorIndex: 0, visualRole: 'pointEstimate' },
        showlegend: false,
      }],
      layout: {
        xaxis: { title: { text: gVar } },
        yaxis: { title: { text: `${yVar} (mean ± 95%CI)` } },
        margin: { l: 82, r: 36, t: 88, b: 72 },
        showlegend: false,
      },
    });
  }
  return variants;
}

function buildPairedContinuousAdvancedVariants(result, rawData, params) {
  const variants = [];
  const beforeVar = params.var || params.y_var || params.outcome_var || params.outcome_vars?.[0] || '';
  const afterVar = params.paired_var || params.end_var || params.var2 || params.outcome_vars?.[1] || '';
  const pairs = _cleanPairedXY(getNumericArrayFromRaw(rawData, beforeVar), getNumericArrayFromRaw(rawData, afterVar));
  if (pairs.length < 3) return variants;

  variants.push({
    label: '配对轨迹',
    titleSuffix: '配对轨迹',
    chartType: 'paired_spaghetti',
    traces: [
      ...pairs.map((p, i) => ({
        type: 'scatter',
        mode: 'lines+markers',
        x: ['Before', 'After'],
        y: [p[0], p[1]],
        name: `个体${i + 1}`,
        line: { width: 1.4 },
        marker: { size: 6 },
        meta: { colorIndex: i, visualRole: 'pairedLine' },
        opacity: 0.32,
        showlegend: false,
      })),
      {
        type: 'scatter',
        mode: 'lines+markers+text',
        x: ['Before', 'After'],
        y: [_mean(pairs.map(p => p[0])), _mean(pairs.map(p => p[1]))],
        text: [_mean(pairs.map(p => p[0])).toFixed(2), _mean(pairs.map(p => p[1])).toFixed(2)],
        textposition: 'top center',
        name: 'Mean',
        line: { width: 3.6 },
        marker: { size: 10 },
        meta: { fixedColor: '#D95F59', visualRole: 'summaryLine' },
        showlegend: false,
      },
    ],
    layout: {
      xaxis: { title: { text: '' } },
      yaxis: { title: { text: beforeVar } },
      margin: { l: 82, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });

  const diffs = pairs.map(p => p[1] - p[0]);
  const avgs = pairs.map(p => (p[1] + p[0]) / 2);
  const md = _mean(diffs);
  const sdd = _sd(diffs) || 0;
  variants.push({
    label: 'Bland-Altman',
    titleSuffix: 'Bland–Altman 图',
    chartType: 'bland_altman',
    traces: [
      {
        type: 'scatter',
        mode: 'markers',
        x: avgs,
        y: diffs,
        marker: { size: 8, opacity: 0.65 },
        name: '差值',
        meta: { colorIndex: 0, visualRole: 'markers' },
        showlegend: false,
      },
      {
        type: 'scatter', mode: 'lines', x: [Math.min(...avgs), Math.max(...avgs)], y: [md, md],
        line: { dash: 'dash', width: 2.0 }, name: 'Mean diff', meta: { fixedColor: '#D95F59' }, showlegend: false,
      },
      {
        type: 'scatter', mode: 'lines', x: [Math.min(...avgs), Math.max(...avgs)], y: [md + 1.96 * sdd, md + 1.96 * sdd],
        line: { dash: 'dot', width: 1.6 }, name: '+1.96SD', meta: { fixedColor: '#64748B' }, showlegend: false,
      },
      {
        type: 'scatter', mode: 'lines', x: [Math.min(...avgs), Math.max(...avgs)], y: [md - 1.96 * sdd, md - 1.96 * sdd],
        line: { dash: 'dot', width: 1.6 }, name: '-1.96SD', meta: { fixedColor: '#64748B' }, showlegend: false,
      },
    ],
    layout: {
      xaxis: { title: { text: `( ${beforeVar} + ${afterVar} ) / 2` } },
      yaxis: { title: { text: `${afterVar} - ${beforeVar}` } },
      margin: { l: 82, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });
  return variants;
}

function buildCategoricalAssociationAdvancedVariants(result, rawData, params) {
  const variants = [];
  const xVar = params.group_var || params.x_var || params.research_vars?.[0] || '';
  const yVar = params.outcome_var || params.var || params.outcome_vars?.[0] || '';
  const x = getStringArrayFromRaw(rawData, xVar);
  const y = getStringArrayFromRaw(rawData, yVar);
  const n = Math.min(x.length, y.length);
  const xLevels = [];
  const yLevels = [];
  const table = {};
  for (let i = 0; i < n; i += 1) {
    if (!x[i] || !y[i]) continue;
    if (!xLevels.includes(x[i])) xLevels.push(x[i]);
    if (!yLevels.includes(y[i])) yLevels.push(y[i]);
    if (!table[x[i]]) table[x[i]] = {};
    table[x[i]][y[i]] = (table[x[i]][y[i]] || 0) + 1;
  }
  if (xLevels.length < 1 || yLevels.length < 1) return variants;

  const countMatrix = xLevels.map(xl => yLevels.map(yl => table[xl]?.[yl] || 0));
  const propSeries = yLevels.map((yl, j) => ({
    type: 'bar',
    x: xLevels,
    y: xLevels.map((xl, i) => {
      const rowSum = countMatrix[i].reduce((s, v) => s + v, 0) || 1;
      return countMatrix[i][j] / rowSum;
    }),
    name: yl,
    meta: { colorIndex: j, visualRole: 'categoryBar' },
  }));
  variants.push({
    label: '构成比',
    titleSuffix: '构成比堆叠图',
    chartType: 'bar',
    traces: propSeries,
    layout: {
      barmode: 'stack',
      xaxis: { title: { text: xVar } },
      yaxis: { title: { text: 'Proportion' }, range: [0, 1] },
      margin: { l: 82, r: 36, t: 88, b: 72 },
    },
  });

  variants.push({
    label: '列联热图',
    titleSuffix: '列联热图',
    chartType: 'heatmap',
    traces: [{
      type: 'heatmap',
      x: yLevels,
      y: xLevels,
      z: countMatrix,
      text: countMatrix,
      texttemplate: '%{text}',
      hovertemplate: `${xVar}=%{y}<br>${yVar}=%{x}<br>n=%{z}<extra></extra>`,
      showscale: true,
      meta: { visualRole: 'heatmap' },
    }],
    layout: {
      xaxis: { title: { text: yVar } },
      yaxis: { title: { text: xVar } },
      margin: { l: 96, r: 42, t: 88, b: 76 },
    },
  });
  return variants;
}

function buildCorrelationAdvancedVariants(result, rawData, params) {
  const variants = [];
  const xVar = params.x_var || params.research_vars?.[0] || '';
  const yVar = params.y_var || params.outcome_var || params.outcome_vars?.[0] || '';
  const pairs = _cleanPairedXY(getNumericArrayFromRaw(rawData, xVar), getNumericArrayFromRaw(rawData, yVar));
  if (pairs.length < 5) return variants;
  const xs = pairs.map(p => p[0]);
  const ys = pairs.map(p => p[1]);
  const xm = _mean(xs), ym = _mean(ys);
  const cov = xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0) / Math.max(xs.length - 1, 1);
  const sx = _sd(xs) || 1, sy = _sd(ys) || 1;
  const slope = cov / (sx * sx);
  const intercept = ym - slope * xm;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  variants.push({
    label: '散点拟合',
    titleSuffix: '散点拟合图',
    chartType: 'scatter',
    traces: [
      {
        type: 'scatter', mode: 'markers', x: xs, y: ys, name: '样本',
        marker: { size: 7, opacity: 0.62 },
        meta: { colorIndex: 0, visualRole: 'markers' }, showlegend: false,
      },
      {
        type: 'scatter', mode: 'lines', x: [x0, x1], y: [intercept + slope * x0, intercept + slope * x1], name: 'Fit',
        line: { width: 2.8 }, meta: { fixedColor: '#D95F59', visualRole: 'fitLine' }, showlegend: false,
      }
    ],
    layout: {
      xaxis: { title: { text: xVar } },
      yaxis: { title: { text: yVar } },
      margin: { l: 82, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });

  const rx = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ry = ys.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranksX = Array(xs.length); rx.forEach((d, i) => { ranksX[d.i] = i + 1; });
  const ranksY = Array(ys.length); ry.forEach((d, i) => { ranksY[d.i] = i + 1; });
  variants.push({
    label: '秩散点',
    titleSuffix: '秩相关图',
    chartType: 'scatter',
    traces: [{
      type: 'scatter', mode: 'markers', x: ranksX, y: ranksY, name: '秩次',
      marker: { size: 7, opacity: 0.62 },
      meta: { colorIndex: 1, visualRole: 'markers' }, showlegend: false,
    }],
    layout: {
      xaxis: { title: { text: `${xVar} rank` } },
      yaxis: { title: { text: `${yVar} rank` } },
      margin: { l: 82, r: 36, t: 88, b: 72 },
      showlegend: false,
    },
  });
  return variants;
}

function buildStatChartVariants(traces, layout, chartType, result, rawData = {}, params = {}) {
  const variants = [];
  const clone = obj => JSON.parse(JSON.stringify(obj || {}));
  const baseTitle = result?.test_name || layout?.title?.text || '统计图形';
  const pushVariant = (label, vTraces, vLayout, vType, titleSuffix = '') => {
    const cleaned = (vTraces || []).filter(Boolean);
    if (!cleaned.length) return;
    const title = titleSuffix ? `${baseTitle} — ${titleSuffix}` : baseTitle;
    variants.push({
      label,
      title,
      chartType: vType || chartType,
      traces: clone(cleaned),
      layout: { ...clone(layout), ...clone(vLayout || {}), title: { text: title } },
    });
  };

  if (['logistic_regression', 'linear_regression'].includes(result?.test_type)) {
    if (result?.test_type === 'logistic_regression') {
      buildLogisticAdvancedVariants(result, rawData, params, layout).forEach(v => variants.push(v));
    } else if (result?.test_type === 'linear_regression') {
      buildLinearAdvancedVariants(result, rawData, params, layout).forEach(v => variants.push(v));
    }
  } else {
    pushVariant('主图', traces, layout, chartType);
  }

  // 高级模型类图形：不是简单翻转，而是提供不同统计解释视角。
  if (result?.test_type === 'logistic_regression') {
    // Logistic 已使用高级主图，避免保留基础粗糙柱图。
  }
  if (result?.test_type === 'linear_regression') {
    // Linear regression 已使用高级主图，避免保留基础粗糙柱图。
  }
  if (['discriminant_analysis', 'quadratic_discriminant_analysis'].includes(result?.test_type)) {
    buildDiscriminantAdvancedVariants(result, rawData, params, layout).forEach(v => variants.push(v));
  }

  const hasType = type => (traces || []).some(t => t && t.type === type);
  const hasScatter = (traces || []).some(t => (t.type || 'scatter') === 'scatter');
  const hasLine = (traces || []).some(t => (t.type || 'scatter') === 'scatter' && String(t.mode || '').includes('lines'));
  const hasBar = hasType('bar') || hasType('histogram');
  const hasBox = hasType('box');
  const hasViolin = hasType('violin');

  if (hasViolin || hasBox) {
    const boxOnly = (traces || []).filter(t => t.type === 'box').map(t => ({
      ...clone(t),
      type: 'box',
      boxpoints: t.boxpoints || 'outliers',
      jitter: t.jitter ?? 0.22,
      pointpos: t.pointpos ?? 0,
      showlegend: true,
    }));
    if (boxOnly.length) pushVariant('箱线图', boxOnly, { boxmode: 'group', violinmode: undefined }, 'box', '箱线图');

    const violinOnly = (traces || []).filter(t => t.type === 'violin').map(t => ({
      ...clone(t),
      type: 'violin',
      points: false,
      showlegend: true,
    }));
    if (violinOnly.length) pushVariant('小提琴图', violinOnly, { violinmode: 'group', boxmode: undefined }, 'violin', '小提琴图');

    const points = [];
    (traces || []).filter(t => t.type === 'box' || t.type === 'violin').forEach((t, i) => {
      const y = (t.y || []).map(Number).filter(Number.isFinite);
      const name = t.name || `Group ${i + 1}`;
      if (!y.length) return;
      const x = y.map(() => name);
      points.push({
        type: 'box',
        x, y,
        name,
        boxpoints: 'all',
        jitter: 0.42,
        pointpos: 0,
        marker: { size: 5, opacity: 0.58 },
        line: { width: 1.4 },
        fillcolor: 'rgba(255,255,255,0.04)',
        meta: { colorIndex: i },
      });
    });
    if (points.length) pushVariant('散点分布', points, { boxmode: 'group' }, 'scatter', '散点分布');
  }

  // Generic bar-to-lollipop derivative removed: it created duplicate low-quality lollipop charts and confusing color controls.


  if (hasScatter) {
    const scatterTraces = (traces || []).filter(t => (t.type || 'scatter') === 'scatter' && Array.isArray(t.x) && Array.isArray(t.y));
    if (scatterTraces.length) {
      const isDiscriminantScatter = ['discriminant_analysis', 'quadratic_discriminant_analysis'].includes(result?.test_type);

      const centroidTraces = scatterTraces.map((t, i) => {
        const faded = clone(t);
        faded.marker = { ...(faded.marker || {}), size: 6.2, opacity: 0.26 };
        faded.meta = { ...(faded.meta || {}), colorIndex: Number.isFinite(Number(faded.meta?.colorIndex)) ? Number(faded.meta.colorIndex) : i, visualRole: faded.meta?.visualRole || 'classScatter' };
        faded.showlegend = !isDiscriminantScatter;
        return faded;
      });

      scatterTraces.forEach((t, i) => {
        const pts = (t.x || []).map((x, idx) => [Number(x), Number((t.y || [])[idx])]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
        if (!pts.length) return;
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        centroidTraces.push({
          type: 'scatter',
          mode: 'markers+text',
          x: [cx],
          y: [cy],
          text: [t.name || `组${i + 1}`],
          textposition: 'top center',
          name: `${t.name || `组${i + 1}`}中心`,
          showlegend: false,
          marker: { size: isDiscriminantScatter ? 19 : 18, symbol: 'diamond', line: { width: 2.5, color: '#ffffff' } },
          meta: { colorIndex: i, visualRole: 'centroidMarker' },
        });

        if (isDiscriminantScatter) {
          centroidTraces.push({
            type: 'scatter',
            mode: 'lines',
            x: [0, cx],
            y: [0, cy],
            showlegend: false,
            hoverinfo: 'skip',
            line: { dash: 'dot', width: 1.4 },
            meta: { colorIndex: i, visualRole: 'centroidGuide' },
          });
        }
      });
      if (centroidTraces.length > scatterTraces.length) pushVariant('类别中心图', centroidTraces, layout, 'scatter', isDiscriminantScatter ? '类别中心定位图' : '类别中心图');

      const trendTraces = scatterTraces.map(t => clone(t));
      scatterTraces.forEach((t, i) => {
        const pts = (t.x || []).map((x, idx) => [Number(x), Number((t.y || [])[idx])]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
        if (pts.length < 3) return;
        const n = pts.length;
        const sx = pts.reduce((s, p) => s + p[0], 0);
        const sy = pts.reduce((s, p) => s + p[1], 0);
        const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0);
        const sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
        const denom = n * sxx - sx * sx;
        if (Math.abs(denom) < 1e-9) return;
        const slope = (n * sxy - sx * sy) / denom;
        const intercept = (sy - slope * sx) / n;
        const xs = pts.map(p => p[0]);
        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);
        trendTraces.push({
          type: 'scatter',
          mode: 'lines',
          x: [x0, x1],
          y: [intercept + slope * x0, intercept + slope * x1],
          name: `${t.name || `组${i + 1}`}趋势`,
          line: { dash: 'dash', width: 2 },
          meta: { colorIndex: i, visualRole: 'trendLine' },
        });
      });
      if (trendTraces.length > scatterTraces.length && !hasLine) pushVariant('趋势线图', trendTraces, layout, 'scatter', '趋势线图');
    }
  }

  const tt = result?.test_type || '';
  let extraAdvanced = [];
  if (['one_sample_t_test', 'normality_test'].includes(tt)) {
    extraAdvanced = buildSingleContinuousAdvancedVariants(result, rawData, params);
  } else if (['t_test_independent', 'mann_whitney', 'anova', 'kruskal_wallis', 'levene_test', 'ancova'].includes(tt)) {
    extraAdvanced = buildGroupedContinuousAdvancedVariants(result, rawData, params);
  } else if (['t_test_paired', 'wilcoxon_signed_rank'].includes(tt)) {
    extraAdvanced = buildPairedContinuousAdvancedVariants(result, rawData, params);
  } else if (['chi_square', 'fisher_exact', 'mcnemar_test'].includes(tt)) {
    extraAdvanced = buildCategoricalAssociationAdvancedVariants(result, rawData, params);
  } else if (['pearson_correlation', 'spearman_correlation'].includes(tt)) {
    extraAdvanced = buildCorrelationAdvancedVariants(result, rawData, params);
  }
  (extraAdvanced || []).forEach(v => pushVariant(v.label, v.traces, v.layout, v.chartType, v.titleSuffix));


  const seen = new Set();
  return variants.filter(v => {
    const key = `${v.label}-${(v.traces || []).map(t => t.type + ':' + (t.mode || '')).join('|')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}


function _statPalette() {
  const theme = typeof getActiveTheme === 'function' ? getActiveTheme() : {};
  return (theme.colorway || ['#2E6F9E', '#D95F59', '#2A9D8F', '#E9A93A', '#6F5AA7', '#7C8B52']);
}

function buildStatPlotFromChartData(chartData, titleText) {
  if (!chartData || !chartData.chart_type) return null;
  const type = chartData.chart_type;
  const title = titleText || chartData.title || '';

  if (type === 'box_violin') {
    const traces = [];
    (chartData.traces || []).forEach((row, i) => {
      const name = String(row.name ?? `Group ${i + 1}`);
      const values = cleanStatNumeric(row.values || []);
      if (!values.length) return;
      const x = Array(values.length).fill(name);
      traces.push({
        type: 'violin',
        x,
        y: values,
        name,
        points: false,
        hoveron: 'violins',
        side: 'both',
        spanmode: 'soft',
        showlegend: false,
        meta: { colorIndex: i },
      });
      traces.push({
        type: 'box',
        x,
        y: values,
        name,
        boxmean: 'sd',
        boxpoints: 'all',
        jitter: 0.22,
        pointpos: 0,
        width: 0.28,
        meta: { colorIndex: i },
      });
    });
    return {
      chartType: 'violin_box_scatter',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: chartData.x_label || '' }, type: 'category' },
        yaxis: { title: { text: chartData.y_label || 'Value' } },
        violinmode: 'overlay',
        boxmode: 'overlay',
      },
    };
  }

  if (type === 'paired_box') {
    const a = cleanStatNumeric(chartData.var_1_values || []);
    const b = cleanStatNumeric(chartData.var_2_values || []);
    const n = Math.min(a.length, b.length);
    const left = String(chartData.var_1_name || 'Before');
    const right = String(chartData.var_2_name || 'After');
    const traces = [];
    for (let i = 0; i < Math.min(n, 120); i++) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: [left, right],
        y: [a[i], b[i]],
        name: 'paired trajectory',
        showlegend: false,
        hoverinfo: 'skip',
        meta: { fixedColor: '#94A3B8', visualRole: 'backgroundTrajectory' },
      });
    }
    [
      { name: left, values: a.slice(0, n), colorIndex: 0 },
      { name: right, values: b.slice(0, n), colorIndex: 1 },
    ].forEach(row => {
      traces.push({
        type: 'box',
        x: Array(row.values.length).fill(row.name),
        y: row.values,
        name: row.name,
        boxmean: 'sd',
        boxpoints: 'all',
        jitter: 0.18,
        width: 0.28,
        meta: { colorIndex: row.colorIndex },
      });
    });
    return {
      chartType: 'paired_box',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: '' }, type: 'category' },
        yaxis: { title: { text: chartData.y_label || 'Value' } },
      },
    };
  }

  if (type === 'bar_grouped' || type === 'paired_bar') {
    const categories = (chartData.categories || []).map(String);
    const series = type === 'paired_bar'
      ? [
          { name: chartData.var_1_name || 'Variable 1', values: chartData.var_1_counts || [] },
          { name: chartData.var_2_name || 'Variable 2', values: chartData.var_2_counts || [] },
        ]
      : (chartData.series || []);
    const traces = series.map((row, i) => {
      const values = (row.values || []).map(v => Number(v) || 0);
      return {
        type: 'bar',
        name: String(row.name ?? `Series ${i + 1}`),
        x: categories,
        y: values,
        text: values.map(v => String(v)),
        meta: { colorIndex: i },
      };
    });
    return {
      chartType: 'bar_grouped',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        barmode: 'group',
        bargap: 0.18,
        xaxis: { title: { text: chartData.x_label || '' }, type: 'category' },
        yaxis: { title: { text: chartData.y_label || 'Count' } },
      },
    };
  }

  if (type === 'ancova_adjusted') {
    const xValues = chartData.x_values || [];
    const yValues = chartData.y_values || [];
    const groupValues = (chartData.group_values || []).map(v => String(v));
    const rows = [];
    const n = Math.min(xValues.length, yValues.length, groupValues.length || xValues.length);
    for (let i = 0; i < n; i++) {
      const x = Number(xValues[i]);
      const y = Number(yValues[i]);
      const group = String(groupValues[i] ?? 'Group');
      if (Number.isFinite(x) && Number.isFinite(y)) rows.push({ x, y, group });
    }
    if (!rows.length) return null;
    const groups = (chartData.groups && chartData.groups.length)
      ? chartData.groups.map(v => String(v))
      : [...new Set(rows.map(row => row.group))];
    const traces = [];
    groups.forEach((group, i) => {
      const groupRows = rows.filter(row => String(row.group) === String(group));
      if (!groupRows.length) return;
      traces.push({
        type: 'scatter',
        mode: 'markers',
        name: group,
        x: groupRows.map(row => row.x),
        y: groupRows.map(row => row.y),
        marker: { size: 7.5, opacity: 0.72 },
        meta: { colorIndex: i, visualRole: 'ancovaObserved' },
      });
    });
    (chartData.lines || []).forEach((line, i) => {
      const lineRows = cleanStatPairs(line.x || [], line.y || []);
      if (lineRows.length < 2) return;
      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: `${line.name || groups[i] || `Group ${i + 1}`} adjusted line`,
        x: lineRows.map(row => row.x),
        y: lineRows.map(row => row.y),
        line: { width: 2.4 },
        meta: { colorIndex: i, visualRole: 'ancovaAdjustedLine' },
      });
    });
    (chartData.adjusted_points || []).forEach((point, i) => {
      const x = Number(point.x);
      const y = Number(point.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      traces.push({
        type: 'scatter',
        mode: 'markers',
        name: `${point.group || groups[i] || `Group ${i + 1}`} adjusted mean`,
        x: [x],
        y: [y],
        marker: { symbol: 'diamond', size: 12, line: { color: '#111827', width: 1 } },
        showlegend: false,
        meta: { colorIndex: i, visualRole: 'ancovaAdjustedMean' },
      });
    });
    const covMean = Number(chartData.covariate_mean);
    const annotations = [];
    if (Number.isFinite(Number(chartData.f_stat))) {
      annotations.push({
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'left',
        yanchor: 'top',
        text: `F(${chartData.df1 ?? ''},${chartData.df2 ?? ''}) = ${chartData.f_stat}, p = ${chartData.p_value}`,
        showarrow: false,
        bgcolor: 'rgba(255,255,255,0.86)',
        bordercolor: '#E2E8F0',
        borderwidth: 1,
        borderpad: 5,
        font: { size: 11 },
      });
    }
    return {
      chartType: 'scatter',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: chartData.x_label || chartData.x_var || 'Covariate' } },
        yaxis: { title: { text: chartData.y_label || chartData.y_var || 'Outcome' } },
        shapes: Number.isFinite(covMean) ? [{
          type: 'line',
          x0: covMean,
          x1: covMean,
          y0: 0,
          y1: 1,
          xref: 'x',
          yref: 'paper',
          line: { color: '#94A3B8', width: 1.2, dash: 'dot' },
        }] : [],
        annotations,
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.16, yanchor: 'top' },
      },
    };
  }

  if (type === 'scatter_regression') {
    const pairs = cleanStatPairs(chartData.x_values || [], chartData.y_values || []);
    const x = pairs.map(p => p.x);
    const y = pairs.map(p => p.y);
    const traces = [{
      type: 'scatter',
      mode: 'markers',
      name: 'Data',
      x,
      y,
      meta: { colorIndex: 0 },
    }];
    const fit = fitStatLine(x, y);
    if (fit) {
      const xs = [Math.min(...x), Math.max(...x)];
      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: 'Fit',
        x: xs,
        y: xs.map(v => fit.slope * v + fit.intercept),
        line: { dash: 'solid' },
        meta: { colorIndex: 1 },
      });
    }
    const annotation = chartData.r != null ? [{
      x: 0.02,
      y: 0.98,
      xref: 'paper',
      yref: 'paper',
      xanchor: 'left',
      yanchor: 'top',
      text: `r = ${chartData.r}, p = ${chartData.p_value}`,
      showarrow: false,
      bgcolor: 'rgba(255,255,255,0.86)',
      bordercolor: '#E2E8F0',
      borderwidth: 1,
      borderpad: 5,
      font: { size: 11 },
    }] : [];
    return {
      chartType: 'scatter',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: chartData.x_var || 'X' } },
        yaxis: { title: { text: chartData.y_var || 'Y' } },
        annotations: annotation,
      },
    };
  }

  if (type === 'histogram') {
    const first = (chartData.traces || [])[0] || {};
    const values = cleanStatNumeric(first.values || []);
    return {
      chartType: 'histogram',
      traces: [{
        type: 'histogram',
        x: values,
        nbinsx: 28,
        name: String(first.name || chartData.x_label || 'Value'),
        meta: { colorIndex: 0 },
      }],
      layout: {
        title: { text: title || chartData.title || '' },
        bargap: 0.04,
        xaxis: { title: { text: chartData.x_label || '' } },
        yaxis: { title: { text: chartData.y_label || 'Count' } },
      },
    };
  }

  if (type === 'repeated_measures') {
    const groups = (chartData.groups || []).map(String);
    const values = chartData.values || {};
    const matrix = groups.map(g => cleanStatNumeric(values[g] || []));
    const lengths = matrix.map(row => row.length).filter(Boolean);
    if (!groups.length || !lengths.length) return null;
    const n = Math.min(...lengths);
    const traces = [];
    for (let i = 0; i < Math.min(n, 120); i++) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: groups,
        y: matrix.map(row => row[i]),
        showlegend: false,
        hoverinfo: 'skip',
        meta: { fixedColor: '#94A3B8', visualRole: 'backgroundTrajectory' },
      });
    }
    traces.push({
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Mean',
      x: groups,
      y: matrix.map(row => statMean(row.slice(0, n))),
      meta: { colorIndex: 0 },
    });
    return {
      chartType: 'repeated_measures',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: chartData.x_label || 'Time / condition' }, type: 'category' },
        yaxis: { title: { text: chartData.y_label || 'Value' } },
      },
    };
  }

  if (type === 'discriminant_scores') {
    const labels = (chartData.labels || []).map(v => String(v));
    const pairs = cleanStatPairs(chartData.x_values || [], chartData.y_values || [], labels);
    const classes = (chartData.classes && chartData.classes.length)
      ? chartData.classes.map(String)
      : [...new Set(pairs.map(p => p.label).filter(Boolean))];
    const traces = [];
    classes.forEach((className, i) => {
      const rows = pairs.filter(p => String(p.label) === String(className));
      if (!rows.length) return;
      traces.push({
        type: 'scatter',
        mode: 'markers',
        name: className,
        x: rows.map(p => p.x),
        y: rows.map(p => p.y),
        marker: { size: 7.5, opacity: 0.82 },
        meta: { colorIndex: i, visualRole: 'classScatter' },
        meta: { colorIndex: i },
      });
      if (rows.length >= 3) {
        traces.push({
          type: 'scatter',
          mode: 'markers',
          name: `${className} center`,
          x: [statMean(rows.map(p => p.x))],
          y: [statMean(rows.map(p => p.y))],
          showlegend: false,
          marker: { symbol: 'x', size: 14, line: { color: '#111827', width: 1.1 } },
          meta: { colorIndex: i },
        });
      }
    });
    return {
      chartType: 'scatter',
      traces,
      layout: {
        title: { text: title || chartData.title || '' },
        xaxis: { title: { text: chartData.x_label || 'LD1' }, zeroline: true, zerolinewidth: 1, zerolinecolor: '#CBD5E1' },
        yaxis: { title: { text: chartData.y_label || 'LD2' }, zeroline: true, zerolinewidth: 1, zerolinecolor: '#CBD5E1' },
        legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.16, yanchor: 'top' },
      },
    };
  }

  if (type === 'survival') {
    const curves = chartData.km_curves || [];
    if (!curves.length) return null;
    const traces = curves.map((curve, i) => ({
      type: 'scatter',
      mode: 'lines',
      name: String(curve.name || `Group ${i + 1}`),
      x: (curve.times || []).map(Number),
      y: (curve.survival || []).map(Number),
      meta: { colorIndex: i },
      line: { shape: 'hv', width: 2.2 },
    }));
    // Add risk table annotation if time_var info available
    const xLabel = chartData.time_var || 'Time';
    return {
      chartType: 'survival',
      traces,
      layout: {
        title: { text: title || chartData.title || 'Kaplan-Meier 生存曲线' },
        xaxis: { title: { text: xLabel }, rangemode: 'nonnegative' },
        yaxis: { title: { text: 'Survival probability' }, range: [0, 1.02] },
        hovermode: 'x unified',
      },
    };
  }

  return null;
}

function cleanStatNumeric(values) {
  return (values || [])
    .map(v => Number(v))
    .filter(v => Number.isFinite(v));
}

function cleanStatPairs(xValues, yValues, labels) {
  const rows = [];
  const n = Math.min((xValues || []).length, (yValues || []).length);
  for (let i = 0; i < n; i++) {
    const x = Number(xValues[i]);
    const y = Number(yValues[i]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      rows.push({ x, y, label: labels ? labels[i] : undefined });
    }
  }
  return rows;
}

function fitStatLine(x, y) {
  const n = Math.min((x || []).length, (y || []).length);
  if (n < 2) return null;
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const mx = statMean(xs);
  const my = statMean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

function statMean(values) {
  const clean = (values || []).filter(v => Number.isFinite(Number(v))).map(Number);
  if (!clean.length) return null;
  return clean.reduce((sum, v) => sum + v, 0) / clean.length;
}

function rerenderCurrentStatChart() {
  if (!STATE.currentStatResult) return false;
  const keepIndex = Number.isFinite(Number(STATE.activeStatChartVariantIndex)) ? Number(STATE.activeStatChartVariantIndex) : 0;
  renderStatChart(STATE.currentStatResult, STATE.currentStatResult || {});
  if (Array.isArray(STATE.statChartVariants) && STATE.statChartVariants.length) {
    const idx = Math.max(0, Math.min(keepIndex, STATE.statChartVariants.length - 1));
    const v = STATE.statChartVariants[idx];
    STATE.activeStatChartVariantIndex = idx;
    STATE.currentChartKind = v.chartType || STATE.currentChartKind;
    STATE.currentPlotlyDataRaw = JSON.parse(JSON.stringify(v.traces || []));
    STATE.currentPlotlyLayoutRaw = JSON.parse(JSON.stringify(v.layout || {}));
  }
  if (STATE.activeWsTab === 'chart' && STATE.currentPlotlyDataRaw && STATE.currentPlotlyDataRaw.length > 0) {
    renderChart(STATE.currentPlotlyDataRaw, STATE.currentPlotlyLayoutRaw || {});
  }
  return true;
}

// Approximate inverse normal CDF (Abramowitz & Stegun)
function _normalInv(p) {
  if (p <= 0) return -4;
  if (p >= 1) return 4;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104799983e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277058772e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/* ── Descriptive Statistics ───────────────────────────── */
async function runDescriptive() {
  if (!STATE.columns || STATE.columns.length === 0) { toast('请先载入数据', 'warning'); return; }
  try {
    const body = {
      use_demo: !STATE.uploadId,
      dataset_name: STATE.datasetName || 'comprehensive_example',
      upload_id: STATE.uploadId || null,
    };
    const data = await apiPost('/api/descriptive', body);
    if (data.status === 'ok' && data.table) {
      const container = el('descriptiveTableContainer');
      if (container) {
        container.innerHTML = `<div style="width:100%;overflow-y:auto;padding:4px 0;">
          <h4 style="margin:0 0 10px;">描述统计结果</h4>${renderStatThreeLineTable(data.table)}</div>`;
      }
      toast('描述统计生成完成！', 'success');
      if (typeof activateWorkspaceTab === 'function') activateWorkspaceTab('descriptive');
    }
  } catch (e) {
    toast('描述统计失败: ' + e.message, 'error');
  }
}
