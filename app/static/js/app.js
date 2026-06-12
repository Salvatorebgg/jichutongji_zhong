/* ── Main Application Entry ─────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupStepNavigation();
  setupWorkspaceTabs();
  setupFileInputs();
  setupExportButtons();
  setupThemeSelector();
  setupPostHocSelect();
  setupMethodGrid();
  renderMiniTestGrid('parametric');
  bootEmptyState();
});

// ===== State (extends base STATE from utils.js) =====
Object.assign(STATE, {
  activeStep: 'upload',
  activeWsTab: 'preview',
  activeChartCategory: 'parametric',
  _testWorkspaces: {},
  currentPlotlyDataRaw: null,
  currentPlotlyLayoutRaw: null,
  currentChartKind: null,
  currentAppearanceContext: null,
  chartVisualStyle: STATE.chartVisualStyle || 'solid',
  chartBgPreset: STATE.chartBgPreset || 'white',
  chartPaperBg: STATE.chartPaperBg || '#ffffff',
  chartPlotBg: STATE.chartPlotBg || '#ffffff',
  chartGridColor: STATE.chartGridColor || '#e5edf7',
  chartGridMode: STATE.chartGridMode || 'grid',
  barWidth: STATE.barWidth || 0.62,
});

// DOM helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function el(id) { return document.getElementById(id); }

// ===== Step Navigation =====
function setupStepNavigation() {
  $$('.nav-step').forEach(btn => {
    btn.addEventListener('click', () => activateStep(btn.dataset.step));
  });
}

function activateStep(stepName) {
  STATE.activeStep = stepName;
  $$('.nav-step').forEach(b => b.classList.remove('active'));
  $$('.step-panel').forEach(p => p.style.display = 'none');
  const btn = $(`.nav-step[data-step="${stepName}"]`);
  const panel = document.getElementById(`step-panel-${stepName}`);
  if (btn) btn.classList.add('active');
  if (panel) panel.style.display = 'flex';

  // Default tab per step: controls are rendered in the right workspace, not in the left sidebar.
  if (stepName === 'upload') activateWsTab('preview');
  else if (stepName === 'variables') activateWsTab('variables');
  else if (stepName === 'methods') activateWsTab('methods');
  else if (stepName === 'run') activateWsTab('run');
  else if (stepName === 'result') activateWsTab(STATE.currentStatResult ? 'descriptive' : 'descriptive');
  updateResultTopTabsVisibility();
}

// ===== Workspace Tabs =====
function setupWorkspaceTabs() {
  $$('.ws-tab').forEach(tab => {
    tab.addEventListener('click', () => activateWsTab(tab.dataset.tab));
  });
  $$('.result-top-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (STATE.activeStep !== 'result') activateStep('result');
      activateWsTab(tab.dataset.tab);
    });
  });
}

function activateWorkspaceTab(tabName) { return activateWsTab(tabName); }

function activateWsTab(tabName) {
  STATE.activeWsTab = tabName;
  $$('.ws-tab').forEach(t => t.classList.remove('active'));
  $$('.ws-panel').forEach(p => p.classList.remove('active'));
  const tab = $(`.ws-tab[data-tab="${tabName}"]`);
  const panel = document.getElementById(`ws-${tabName}`);
  if (tab) tab.classList.add('active');
  if (panel) panel.classList.add('active');

  // Reload chart when switching to chart tab
  updateResultTopTabsActive(tabName);
  if (tabName === 'chart' && STATE.currentPlotlyData && STATE.currentPlotlyData.length > 0) {
    setTimeout(() => renderChart(STATE.currentPlotlyData, STATE.currentPlotlyLayout), 100);
  }
  updateChartSettingsVisibility();
  if (tabName === 'run') updateRunPanel();
}

function updateResultTopTabsVisibility() {
  const bar = el('resultTopTabs');
  const exportBar = el('resultUnifiedExportBar');
  if (!bar) return;
  const show = STATE.activeStep === 'result';
  bar.hidden = !show;
  bar.classList.toggle('is-visible', show);
  if (exportBar) exportBar.hidden = !(show && !!STATE.currentStatResult);
  updateResultTopTabsActive(STATE.activeWsTab || 'descriptive');
}

function updateResultTopTabsActive(tabName) {
  $$('.result-top-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
}

// ===== File Inputs =====
function setupFileInputs() {
  const fileInput = el('wsFileInput');
  const uploadBtn = el('uploadDataBtn');
  if (uploadBtn && fileInput) uploadBtn.addEventListener('click', () => fileInput.click());
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0], { fromChart: true });
        fileInput.value = '';
      }
    });
  }

  const loadBtn = el('loadExampleBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => doLoadExample());

  // Preview / workflow next buttons
  const nextBtn = el('previewNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => activateStep('variables'));
  const variableNextBtn = el('variableNextBtn');
  if (variableNextBtn) variableNextBtn.addEventListener('click', () => activateStep('methods'));
  const methodNextBtn = el('methodNextBtn');
  if (methodNextBtn) methodNextBtn.addEventListener('click', () => activateStep('run'));

  $$('.result-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateStep('result');
      activateWsTab(btn.dataset.resultTab || 'descriptive');
    });
  });
}

async function doLoadExample() {
  const loadBtn = el('loadExampleBtn');
  if (loadBtn) loadBtn.disabled = true;
  try {
    await loadExampleDataset('comprehensive_example', { silent: true });
    buildVarControls();
    renderAppearanceControls();
    updateMetricGrid();
    updatePreviewTable();
    updateDownloadList();
    updateDataMeta();
    updateStep2DataInfo();
    updateWorkflowButtons();
    el('generateChartBtn').disabled = true;
    setWorkflowHint('示例数据已加载！请先查看右侧数据预览，然后点击下一步');
    activateStep('upload');
    activateWsTab('preview');
  } catch(e) {
    toast('加载示例失败: ' + e.message, 'error');
  } finally {
    if (loadBtn) loadBtn.disabled = false;
  }
}

// ===== Method Grid =====
function setupMethodGrid() {
  const grid = el('miniTestGrid');
  if (!grid) return;
  grid.addEventListener('click', function(e) {
    const card = e.target.closest('.mini-chart-card');
    if (!card) return;
    if (card.classList.contains('method-disabled')) {
      const reason = card.querySelector('.method-reason');
      toast(reason ? reason.textContent : '该方法不适用于当前数据', 'warning');
      return;
    }
    const testId = card.dataset.test;
    if (testId) selectTest(testId);
  });

  // Category tabs
  $$('#testCatTabs .cat-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      $$('#testCatTabs .cat-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      STATE.activeChartCategory = this.dataset.cat;
      renderMiniTestGrid(this.dataset.cat);
    });
  });
}

function renderMiniTestGrid(category) {
  const grid = el('miniTestGrid');
  if (!grid || typeof TEST_CATALOG === 'undefined') return;
  const tests = Object.values(TEST_CATALOG).filter(t => t.category === category);

  const hasData = STATE.columns && STATE.columns.length > 0;
  const selVars = collectSelectedVars();
  const availabilityMap = {};
  Object.values(TEST_CATALOG).forEach(test => {
    availabilityMap[test.id] = hasData ? checkMethodAvailability(test, selVars) : { available: true, reason: '' };
  });
  STATE.methodAvailability = availabilityMap;

  grid.innerHTML = tests.map(test => {
    const avail = availabilityMap[test.id] || { available: true, reason: '' };
    const disabledClass = hasData && !avail.available ? ' method-disabled' : '';
    const selectedClass = STATE.activeChartType === test.id ? ' selected' : '';
    const reasonHtml = hasData && !avail.available
      ? `<span class="method-reason">${escapeHtml(avail.reason)}</span>`
      : `<span class="method-reason method-ok">当前变量可用</span>`;

    return `
      <div class="mini-chart-card${selectedClass}${disabledClass}" data-test="${test.id}">
        <span class="mini-chart-icon">${escapeHtml(test.icon)}</span>
        <span class="mini-chart-name">${escapeHtml(test.name)}</span>
        ${reasonHtml}
      </div>
    `;
  }).join('');
  updateStep3DataInfo();
  updateWorkflowButtons();
}

function selectTest(testId) {
  STATE.activeChartType = testId;
  STATE.currentResult = null;
  STATE.currentStatResult = null;
  STATE.currentStatChartData = null;
  STATE.currentPlotlyDataRaw = null;
  STATE.currentPlotlyLayoutRaw = null;
  STATE.currentChartKind = null;
  STATE.currentAppearanceContext = null;
  STATE.currentPlotlyData = null;
  STATE.currentPlotlyLayout = null;
  STATE.currentTables = null;
  STATE.currentDiscussion = null;
  STATE.currentTableData = null;
  STATE.postHocMethod = el('postHocSelect')?.value || null;

  const config = getTestConfig(testId);
  if (config && !STATE.uploadId && !STATE.datasetName) {
    STATE.datasetName = 'comprehensive_example';
  }

  renderMiniTestGrid(STATE.activeChartCategory);

  const label = el('selectedTestLabel');
  if (label) label.textContent = config ? '已选：' + config.name : '请选择统计方法';

  const analysisTitle = el('analysisTitle');
  if (analysisTitle) analysisTitle.textContent = config ? config.name + ' — 分析结果' : '分析结果';

  const resultBadge = el('resultBadge');
  if (resultBadge) { resultBadge.textContent = config ? config.description || '' : ''; }

  updatePostHocSection();
  updateDataMeta();
  updateDownloadList();
  updateMetricGrid();
  resetResults();

  // Enable workflow buttons
  const runBtn = el('generateChartBtn');
  if (runBtn) runBtn.disabled = !(STATE.columns && STATE.columns.length > 0);
  updateWorkflowButtons();
}

function collectSelectedVars() {
  const vars = {};
  const selects = $$('#varControls select');
  selects.forEach(sel => {
    const key = sel.id.replace('chartVar_', '');
    if (sel.multiple) {
      const roleIds = ['research_vars', 'covar_vars', 'outcome_vars'];
      vars[key] = roleIds.includes(key)
        ? [...sel.options].map(o => o.value).filter(Boolean)
        : [...sel.selectedOptions].map(o => o.value).filter(Boolean);
    } else {
      vars[key] = sel.value;
    }
  });

  // New universal variable-selection model:
  // 研究变量 = exposure / grouping / predictor candidates
  // 协变量/混杂因素 = adjustment variables / subject id / additional predictors
  // 结局变量 = outcome / response / paired second endpoint / survival time-event pair
  let research = Array.isArray(vars.research_vars) ? vars.research_vars : [];
  let covars = Array.isArray(vars.covar_vars) ? vars.covar_vars : [];
  let outcomes = Array.isArray(vars.outcome_vars) ? vars.outcome_vars : [];
  const uniq = arr => [...new Set((arr || []).filter(Boolean))];

  // 防止用户还未完成四栏变量转移时点击“开始分析”直接报错：
  // 使用当前统计方法的默认字段作为兜底，并且只采用当前数据集中真实存在的列。
  const defaults = (typeof getTestDefaultParams === 'function') ? getTestDefaultParams(STATE.activeChartType) : {};
  const hasCol = v => !!v && (!STATE.columns || STATE.columns.includes(v));
  if (defaults) {
    const defaultOutcome = [defaults.y_var, defaults.var, defaults.outcome_var].find(hasCol);
    const defaultResearch = [defaults.x_var, defaults.group_var, defaults.time_var].find(hasCol);
    const defaultPaired = [defaults.paired_var, defaults.event_var, defaults.var2].find(hasCol);
    const defaultCovars = [
      ...(Array.isArray(defaults.value_vars) ? defaults.value_vars : []),
      ...(Array.isArray(defaults.x_vars) ? defaults.x_vars : []),
      ...(Array.isArray(defaults.predictor_vars) ? defaults.predictor_vars : []),
      defaults.covar,
      defaults.subject_var,
    ].filter(hasCol);
    if (!outcomes.length && defaultOutcome) outcomes = uniq([defaultOutcome, defaultPaired].filter(hasCol));
    if (!research.length && defaultResearch) research = uniq([defaultResearch].filter(hasCol));
    if (!covars.length && defaultCovars.length) {
      covars = uniq(defaultCovars.filter(v => v !== defaultOutcome && v !== defaultResearch && v !== defaultPaired));
    }
  }

  const primaryOutcome = outcomes[0] || research[0] || '';
  const primaryResearch = research[0] || '';
  const secondaryOutcome = outcomes.find(v => v !== primaryOutcome) || outcomes[1] || '';
  const secondaryResearch = research.find(v => v !== primaryResearch) || research[1] || '';
  const predictors = uniq([...research, ...covars].filter(v => v !== primaryOutcome));

  // Compatibility aliases consumed by the existing backend/statistical services.
  vars.var = primaryOutcome;
  vars.y_var = primaryOutcome;
  vars.group_var = primaryResearch;
  vars.x_var = primaryResearch;
  vars.paired_var = secondaryOutcome || secondaryResearch;
  vars.covar = covars[0] || '';
  vars.value_vars = predictors;
  vars.x_vars = predictors;

  const idLike = [...covars, ...research, ...outcomes].find(v => /(^id$|_id$|id_|subject|patient|编号|序号)/i.test(String(v)));
  vars.subject_var = idLike || covars[0] || research[0] || '';

  const allSelected = uniq([...outcomes, ...research, ...covars]);
  const timeLike = allSelected.find(v => /time|survival|follow|duration|天|月|时间|生存/i.test(String(v)));
  const eventLike = allSelected.find(v => /event|death|status|outcome|结局|事件|死亡/i.test(String(v)));
  vars.time_var = timeLike || outcomes[0] || '';
  vars.event_var = eventLike && eventLike !== vars.time_var ? eventLike : (outcomes.find(v => v !== vars.time_var) || outcomes[1] || '');

  return vars;
}

// ===== Method Availability Checker =====
function getColumnTypeMap() {
  const colTypeMap = {};
  const groupedVT = STATE.variableTypes || {};
  for (const [typeName, typeCols] of Object.entries(groupedVT)) {
    if (Array.isArray(typeCols)) typeCols.forEach(c => { colTypeMap[c] = typeName; });
  }
  return colTypeMap;
}

function getColumnType(col) {
  return getColumnTypeMap()[col] || '';
}

function isContinuousVar(col) {
  const t = getColumnType(col);
  return ['continuous', 'numeric', 'date', 'time'].includes(t);
}

function isCategoricalVar(col) {
  const t = getColumnType(col);
  return ['categorical', 'binary', 'group', 'outcome_candidate', 'ordinal_categorical', 'region'].includes(t);
}

function isBinaryVar(col) {
  const t = getColumnType(col);
  return ['binary', 'outcome_candidate'].includes(t) || /event|death|status|outcome|结局|事件|死亡/i.test(String(col));
}

function asArrayValue(v) {
  return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
}

function getAnalysisRows() {
  if (Array.isArray(STATE.previewRows) && STATE.previewRows.length) return STATE.previewRows;
  return [];
}

function normalizeCellValue(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || ['NA', 'N/A', 'nan', 'NaN', 'None', 'none', 'null', 'NULL'].includes(s)) return null;
  return s;
}

function getColumnValues(col) {
  const rows = getAnalysisRows();
  if (!col || !rows.length) return [];
  return rows.map(row => row ? row[col] : undefined);
}

function toFiniteNumber(v) {
  const s = normalizeCellValue(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function nonMissingValues(col) {
  return getColumnValues(col).map(normalizeCellValue).filter(v => v !== null);
}

function numericValues(col) {
  return getColumnValues(col).map(toFiniteNumber).filter(v => v !== null);
}

function uniqueCount(values) {
  return new Set((values || []).map(v => String(v))).size;
}

function categoryLevels(col) {
  return [...new Set(nonMissingValues(col).map(v => String(v)))];
}

function hasNumericSignal(col, minN = 3) {
  const vals = numericValues(col);
  return vals.length >= minN && uniqueCount(vals) > 1;
}

function isIdLikeForAvailability(col) {
  if (!col) return false;
  return getColumnType(col) === 'id' || /(^id$|_id$|id_|subject|patient|record|编号|序号)/i.test(String(col));
}

function groupedNumericCounts(yVar, groupVar) {
  const y = getColumnValues(yVar);
  const g = getColumnValues(groupVar);
  const n = Math.min(y.length, g.length);
  const map = new Map();
  for (let i = 0; i < n; i += 1) {
    const gy = normalizeCellValue(g[i]);
    const yy = toFiniteNumber(y[i]);
    if (gy === null || yy === null) continue;
    if (!map.has(gy)) map.set(gy, 0);
    map.set(gy, map.get(gy) + 1);
  }
  return map;
}

function pairedNumericCount(aVar, bVar) {
  const a = getColumnValues(aVar);
  const b = getColumnValues(bVar);
  const n = Math.min(a.length, b.length);
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    if (toFiniteNumber(a[i]) !== null && toFiniteNumber(b[i]) !== null) count += 1;
  }
  return count;
}

function pairedCategoricalInfo(aVar, bVar) {
  const a = getColumnValues(aVar);
  const b = getColumnValues(bVar);
  const levels = new Set();
  let count = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const av = normalizeCellValue(a[i]);
    const bv = normalizeCellValue(b[i]);
    if (av === null || bv === null) continue;
    levels.add(av);
    levels.add(bv);
    count += 1;
  }
  return { count, levels: [...levels] };
}

function contingencyShape(aVar, bVar) {
  const a = getColumnValues(aVar);
  const b = getColumnValues(bVar);
  const rowLevels = new Set();
  const colLevels = new Set();
  let count = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const av = normalizeCellValue(a[i]);
    const bv = normalizeCellValue(b[i]);
    if (av === null || bv === null) continue;
    rowLevels.add(av);
    colLevels.add(bv);
    count += 1;
  }
  return { rows: rowLevels.size, cols: colLevels.size, count };
}

function binaryEventInfo(col) {
  const raw = nonMissingValues(col);
  const nums = getColumnValues(col).map(toFiniteNumber).filter(v => v !== null);
  const levels = [...new Set(nums.map(Number))];
  const validBinary = raw.length > 0 && nums.length / Math.max(raw.length, 1) >= 0.85 && levels.length <= 2 && levels.every(v => v === 0 || v === 1);
  return { valid: validBinary, n: nums.length, levels };
}

function survivalGroupCounts(timeVar, eventVar, groupVar) {
  const time = getColumnValues(timeVar);
  const event = getColumnValues(eventVar);
  const group = getColumnValues(groupVar);
  const n = Math.min(time.length, event.length, group.length);
  const map = new Map();
  for (let i = 0; i < n; i += 1) {
    const t = toFiniteNumber(time[i]);
    const e = toFiniteNumber(event[i]);
    const g = normalizeCellValue(group[i]);
    if (t === null || t < 0 || g === null || !(e === 0 || e === 1)) continue;
    if (!map.has(g)) map.set(g, 0);
    map.set(g, map.get(g) + 1);
  }
  return map;
}

function repeatedCompleteSubjects(yVar, subjectVar, groupVar) {
  const y = getColumnValues(yVar);
  const s = getColumnValues(subjectVar);
  const g = getColumnValues(groupVar);
  const groups = categoryLevels(groupVar);
  const bySubject = new Map();
  const n = Math.min(y.length, s.length, g.length);
  for (let i = 0; i < n; i += 1) {
    const sv = normalizeCellValue(s[i]);
    const gv = normalizeCellValue(g[i]);
    const yv = toFiniteNumber(y[i]);
    if (sv === null || gv === null || yv === null) continue;
    if (!bySubject.has(sv)) bySubject.set(sv, new Set());
    bySubject.get(sv).add(gv);
  }
  let complete = 0;
  bySubject.forEach(set => {
    if (groups.every(level => set.has(level))) complete += 1;
  });
  return { complete, nGroups: groups.length };
}

function ancovaCompleteInfo(yVar, groupVar, covarVar) {
  const y = getColumnValues(yVar);
  const g = getColumnValues(groupVar);
  const c = getColumnValues(covarVar);
  const groups = new Set();
  let count = 0;
  const n = Math.min(y.length, g.length, c.length);
  for (let i = 0; i < n; i += 1) {
    const yv = toFiniteNumber(y[i]);
    const cv = toFiniteNumber(c[i]);
    const gv = normalizeCellValue(g[i]);
    if (yv === null || cv === null || gv === null) continue;
    groups.add(gv);
    count += 1;
  }
  return { count, nGroups: groups.size };
}

function getUsableModelFeatures(predictors, options = {}) {
  const allowCategorical = options.allowCategorical !== false;
  const uniquePredictors = [...new Set((predictors || []).filter(Boolean))];
  const features = [];
  const skipped = [];
  uniquePredictors.forEach(col => {
    if (!STATE.columns || !STATE.columns.includes(col)) return;
    const raw = nonMissingValues(col);
    const numeric = numericValues(col);
    const numericRatio = raw.length ? numeric.length / raw.length : 0;
    const levels = categoryLevels(col);
    if (isIdLikeForAvailability(col)) {
      skipped.push({ name: col, reason: 'ID或标识符列' });
      return;
    }
    if (raw.length && numericRatio >= 0.85) {
      if (numeric.length >= 3 && uniqueCount(numeric) > 1) features.push({ name: col, kind: 'numeric', encoded: [col] });
      else skipped.push({ name: col, reason: '数值列无有效变异' });
      return;
    }
    if (!allowCategorical) {
      skipped.push({ name: col, reason: '需要连续数值变量' });
      return;
    }
    const maxLevels = Math.max(8, Math.min(20, Math.floor(Math.max(raw.length, 1) * 0.2)));
    if (levels.length < 2) skipped.push({ name: col, reason: '分类水平不足' });
    else if (levels.length > maxLevels) skipped.push({ name: col, reason: '高基数分类变量' });
    else features.push({ name: col, kind: 'categorical', encoded: levels.slice(1).map(level => `${col}_${level}`) });
  });
  return {
    features,
    skipped,
    encodedCount: features.reduce((sum, f) => sum + (f.encoded?.length || 0), 0),
    numericCount: features.filter(f => f.kind === 'numeric').length,
  };
}

function modelCompleteInfo(outcomeVar, features, options = {}) {
  const outcomeKind = options.outcomeKind || 'categorical';
  const y = getColumnValues(outcomeVar);
  const featureValues = features.map(f => ({ feature: f, values: getColumnValues(f.name) }));
  const n = Math.min(y.length, ...featureValues.map(fv => fv.values.length).filter(Boolean));
  const classCounts = new Map();
  let count = 0;
  let yUniqueNumeric = new Set();
  for (let i = 0; i < n; i += 1) {
    let ok = true;
    let yValue;
    if (outcomeKind === 'continuous') {
      yValue = toFiniteNumber(y[i]);
      ok = yValue !== null;
      if (ok) yUniqueNumeric.add(yValue);
    } else {
      yValue = normalizeCellValue(y[i]);
      ok = yValue !== null;
    }
    if (!ok) continue;
    for (const fv of featureValues) {
      const raw = fv.values[i];
      if (fv.feature.kind === 'numeric') {
        if (toFiniteNumber(raw) === null) { ok = false; break; }
      } else if (normalizeCellValue(raw) === null) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    count += 1;
    if (outcomeKind !== 'continuous') classCounts.set(String(yValue), (classCounts.get(String(yValue)) || 0) + 1);
  }
  return { count, classCounts, nClasses: classCounts.size, yUniqueNumeric: yUniqueNumeric.size };
}

function checkMethodAvailability(config, selectedVars) {
  if (!config) return { available: true, reason: '' };

  const cols = STATE.columns || [];
  if (!cols.length) return { available: true, reason: '' };
  if (!getAnalysisRows().length) return { available: false, reason: '没有可用于判定的行数据' };

  const research = asArrayValue(selectedVars.research_vars);
  const covars = asArrayValue(selectedVars.covar_vars);
  const outcomes = asArrayValue(selectedVars.outcome_vars);
  const predictors = [...new Set([...research, ...covars])];
  const outcome = outcomes[0] || '';
  const groupVar = research[0] || '';

  if (!outcome) return { available: false, reason: '请先在“结局变量”中选择变量' };

  const numericOutcomeReason = (minN = 3) => {
    if (!hasNumericSignal(outcome, minN)) return `结局变量至少需要${minN}个有效数值观测且不能为常量`;
    return '';
  };

  if (config.requiresGroup) {
    if (!groupVar) return { available: false, reason: '需要选择研究变量作为分组变量' };
    if (categoryLevels(groupVar).length < 2) return { available: false, reason: '研究变量至少需要2个有效分组' };
  }

  const pairedCandidate = outcomes[1] || research.find(v => v !== outcome) || '';

  switch (config.id) {
    case 'one_sample_t_test':
    case 'normality_test': {
      const reason = numericOutcomeReason(3);
      if (reason) return { available: false, reason };
      break;
    }

    case 't_test_independent':
    case 'mann_whitney': {
      const reason = numericOutcomeReason(3);
      if (reason) return { available: false, reason };
      if (categoryLevels(groupVar).length !== 2) return { available: false, reason: '该检验需要恰好2个分组' };
      const counts = groupedNumericCounts(outcome, groupVar);
      if ([...counts.values()].filter(n => n >= 2).length < 2) return { available: false, reason: '每组至少需要2个有效数值观测' };
      break;
    }

    case 'levene_test':
    case 'anova':
    case 'kruskal_wallis': {
      const reason = numericOutcomeReason(3);
      if (reason) return { available: false, reason };
      const counts = groupedNumericCounts(outcome, groupVar);
      if ([...counts.values()].filter(n => n >= 2).length < 2) return { available: false, reason: '至少2组各有2个以上有效数值观测' };
      break;
    }

    case 't_test_paired':
    case 'pearson_correlation':
    case 'spearman_correlation': {
      if (!pairedCandidate) return { available: false, reason: '需要第二个配对/相关变量' };
      if (pairedCandidate === outcome) return { available: false, reason: '配对变量不能与结局变量相同' };
      const minPairs = config.id === 't_test_paired' ? 3 : 3;
      if (pairedNumericCount(outcome, pairedCandidate) < minPairs) return { available: false, reason: `至少需要${minPairs}对完整数值观测` };
      break;
    }

    case 'wilcoxon_signed_rank': {
      if (!pairedCandidate) return { available: false, reason: '需要第二个配对变量' };
      if (pairedCandidate === outcome) return { available: false, reason: '配对变量不能与结局变量相同' };
      if (pairedNumericCount(outcome, pairedCandidate) < 5) return { available: false, reason: '至少需要5对完整数值观测' };
      break;
    }

    case 'chi_square': {
      const shape = contingencyShape(outcome, groupVar);
      if (shape.rows < 2 || shape.cols < 2) return { available: false, reason: '两个分类变量均至少需要2个水平' };
      break;
    }

    case 'fisher_exact': {
      const shape = contingencyShape(outcome, groupVar);
      if (shape.rows !== 2 || shape.cols !== 2) return { available: false, reason: 'Fisher精确检验仅开放2×2列联表' };
      break;
    }

    case 'mcnemar': {
      if (!pairedCandidate) return { available: false, reason: '需要第二个配对分类变量' };
      if (pairedCandidate === outcome) return { available: false, reason: '配对变量不能与结局变量相同' };
      const info = pairedCategoricalInfo(outcome, pairedCandidate);
      if (info.count < 1 || info.levels.length < 2) return { available: false, reason: '需要完整配对分类数据且至少2个分类水平' };
      break;
    }

    case 'log_rank': {
      if (outcomes.length < 2) return { available: false, reason: '生存分析需在结局变量中选择“时间+事件”' };
      const allSelected = [...new Set([...outcomes, ...research, ...covars].filter(Boolean))];
      const timeVar = [selectedVars.time_var, ...outcomes, ...research].find(v => v && hasNumericSignal(v, 2) && /time|survival|duration|follow|天|月|时间|生存/i.test(String(v))) ||
        [selectedVars.time_var, ...outcomes, ...research].find(v => v && hasNumericSignal(v, 2));
      const eventVar = [selectedVars.event_var, ...allSelected].find(v => v && v !== timeVar && binaryEventInfo(v).valid);
      if (!timeVar || !eventVar) return { available: false, reason: '需要生存时间变量和0/1事件变量' };
      const counts = survivalGroupCounts(timeVar, eventVar, groupVar);
      if ([...counts.values()].filter(n => n >= 2).length < 2) return { available: false, reason: '至少2组各有2个完整生存观测' };
      break;
    }

    case 'friedman':
    case 'repeated_measures_anova': {
      const subjectVar = selectedVars.subject_var || [...covars, ...research, ...outcomes].find(isIdLikeForAvailability) || '';
      if (!subjectVar) return { available: false, reason: '重复测量需在协变量中选择受试者ID' };
      const reason = numericOutcomeReason(3);
      if (reason) return { available: false, reason };
      const info = repeatedCompleteSubjects(outcome, subjectVar, groupVar);
      if (info.nGroups < 2) return { available: false, reason: '重复测量至少需要2个时间点/处理条件' };
      if (info.complete < 3) return { available: false, reason: '至少需要3个受试者拥有所有条件的完整数值观测' };
      break;
    }

    case 'ancova': {
      const covar = covars.find(v => hasNumericSignal(v, 3)) || '';
      if (!covars.length) return { available: false, reason: '需要至少1个协变量/混杂因素' };
      if (!covar) return { available: false, reason: '协变量需包含有效连续数值变量' };
      const reason = numericOutcomeReason(3);
      if (reason) return { available: false, reason };
      const info = ancovaCompleteInfo(outcome, groupVar, covar);
      if (info.nGroups < 2) return { available: false, reason: 'ANCOVA需要至少2个有效分组' };
      if (info.count < 10) return { available: false, reason: 'ANCOVA至少需要10个完整观测' };
      break;
    }

    case 'logistic_regression': {
      const features = getUsableModelFeatures(predictors, { allowCategorical: true });
      if (features.encodedCount < 1) return { available: false, reason: '需要至少1个可入模的预测/协变量' };
      const info = modelCompleteInfo(outcome, features.features, { outcomeKind: 'categorical' });
      if (info.count < 20) return { available: false, reason: `样本量不足（仅${info.count}个完整观测），需要至少20个` };
      if (info.nClasses !== 2) return { available: false, reason: 'Logistic回归结局必须是二分类变量' };
      break;
    }

    case 'linear_regression': {
      const features = getUsableModelFeatures(predictors, { allowCategorical: true });
      if (features.encodedCount < 1) return { available: false, reason: '需要至少1个可入模的预测/协变量' };
      const info = modelCompleteInfo(outcome, features.features, { outcomeKind: 'continuous' });
      if (info.count < 20) return { available: false, reason: `样本量不足（仅${info.count}个完整观测），需要至少20个` };
      if (info.yUniqueNumeric <= 1) return { available: false, reason: '线性回归结局变量需为有变异的连续数值变量' };
      break;
    }

    case 'discriminant_analysis':
    case 'quadratic_discriminant_analysis': {
      const features = getUsableModelFeatures(predictors, { allowCategorical: false });
      if (features.numericCount < 1) return { available: false, reason: '判别分析需要至少1个连续数值预测变量' };
      const info = modelCompleteInfo(outcome, features.features, { outcomeKind: 'categorical' });
      if (info.count < 20) return { available: false, reason: `样本量不足（仅${info.count}个完整观测），需要至少20个` };
      if (info.nClasses < 2) return { available: false, reason: '判别分析结局至少需要2个类别' };
      if (Math.min(...info.classCounts.values()) < 3) return { available: false, reason: '每个结局类别至少需要3个完整观测' };
      break;
    }

    default: {
      if (config.varType === 'continuous') {
        const reason = numericOutcomeReason(3);
        if (reason) return { available: false, reason };
      }
      if (config.varType === 'categorical' && categoryLevels(outcome).length < 2) {
        return { available: false, reason: '分类结局至少需要2个水平' };
      }
    }
  }

  return { available: true, reason: '' };
}

// ===== Variable Controls =====
function buildVarControls() {
  const container = el('varControls');
  if (!container) return;

  if (!STATE.columns || STATE.columns.length === 0) {
    container.innerHTML = '<div class="empty-state small">请先在步骤1中加载数据</div>';
    updateWorkflowButtons();
    return;
  }

  const cols = STATE.columns || [];
  container.innerHTML = buildFourColumnVariablePicker(cols);
  bindRoleTransferControls();
  updateVariablePoolFromRoles();

  $$('#varControls select').forEach(sel => {
    sel.addEventListener('change', () => {
      renderMiniTestGrid(STATE.activeChartCategory);
      updateStep2DataInfo();
      updateStep3DataInfo();
      updateWorkflowButtons();
    });
    sel.addEventListener('dblclick', () => {
      if (sel.id === 'variablePoolList') return;
      removeSelectedFromRole(sel.id.replace('chartVar_', ''));
    });
  });
  updateWorkflowButtons();
}

function buildFourColumnVariablePicker(cols) {
  let html = '';
  html += `<div class="var-pool-card var-transfer-card">
    <div class="var-transfer-head">
      <label class="form-label var-role-label">所有变量</label>
      <span class="var-transfer-count" id="poolVarCount">${cols.length}</span>
    </div>
    <select id="variablePoolList" class="hidden-role-select" multiple>
      ${(cols || []).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}${getVariableTypeBadgeText(c)}</option>`).join('')}
    </select>
    <div id="visual_pool" class="var-visual-list" data-role="pool"></div>
    <small class="form-hint">单击可多选；也可按住鼠标拖拽一个或多个变量到右侧角色栏。</small>
  </div>`;

  html += buildTransferRoleCard('research_vars', '研究变量',
    '暴露因素、分组变量、处理组、主要自变量或模型预测变量。');
  html += buildTransferRoleCard('covar_vars', '协变量 / 混杂因素',
    '年龄、性别、BMI、基线值、受试者ID等需要控制或辅助建模的变量。');
  html += buildTransferRoleCard('outcome_vars', '结局变量',
    '主要终点、响应变量、被解释变量；生存分析请选择“生存时间”和“事件变量(0/1)”。');

  html += `<div class="var-screen-note">
    <strong>选择规则：</strong>左侧为数据集全部变量；右侧三栏支持“+ / −”移动，也支持单个或多个变量直接拖拽。三个角色均支持单选和多选；如果变量类型和统计方法不匹配，对应方法会自动变灰。
  </div>`;
  return html;
}

function buildTransferRoleCard(id, label, hint) {
  const elementId = `chartVar_${id}`;
  return `<div class="form-group var-role-card var-transfer-card" data-role="${id}">
    <div class="var-transfer-head">
      <label class="form-label var-role-label">${escapeHtml(label)}</label>
      <div class="var-transfer-actions">
        <button type="button" class="var-transfer-btn add" data-action="add" data-target="${id}" title="添加到${escapeHtml(label)}">+</button>
        <button type="button" class="var-transfer-btn remove" data-action="remove" data-target="${id}" title="从${escapeHtml(label)}移除">−</button>
      </div>
    </div>
    <select id="${elementId}" class="hidden-role-select" multiple></select>
    <div id="visual_${id}" class="var-visual-list" data-role="${id}"></div>
    <small class="form-hint">${escapeHtml(hint)}</small>
  </div>`;
}

function bindRoleTransferControls() {
  $$('.var-transfer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.target;
      if (btn.dataset.action === 'add') addSelectedToRole(role);
      else removeSelectedFromRole(role);
    });
  });
  renderVariableVisualLists();
  bindVariableVisualEvents();
}

function hiddenSelectForRole(role) {
  if (role === 'pool') return el('variablePoolList');
  return el(`chartVar_${role}`);
}

function visualListForRole(role) {
  return el(`visual_${role}`);
}

function getOptionLabel(value) {
  return `${value}${getVariableTypeBadgeText(value)}`;
}

function optionExists(selectEl, value) {
  return !!selectEl && [...selectEl.options].some(o => o.value === value);
}

function addOptionSorted(selectEl, value) {
  if (!selectEl || !value || optionExists(selectEl, value)) return;
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = getOptionLabel(value);
  selectEl.appendChild(opt);
  sortSelectOptions(selectEl);
}

function removeOptionByValue(selectEl, value) {
  if (!selectEl) return;
  [...selectEl.options].forEach(o => { if (o.value === value) o.remove(); });
}

function sortSelectOptions(selectEl) {
  if (!selectEl) return;
  const order = new Map((STATE.columns || []).map((c, i) => [c, i]));
  const opts = [...selectEl.options].sort((a, b) => (order.get(a.value) ?? 9999) - (order.get(b.value) ?? 9999));
  selectEl.innerHTML = '';
  opts.forEach(o => selectEl.appendChild(o));
}

function renderVariableVisualLists() {
  ['pool', 'research_vars', 'covar_vars', 'outcome_vars'].forEach(role => {
    const selectEl = hiddenSelectForRole(role);
    const visual = visualListForRole(role);
    if (!selectEl || !visual) return;
    const values = [...selectEl.options].map(o => o.value);
    visual.innerHTML = values.map(value => `
      <div class="var-chip-item" draggable="true" data-var="${escapeHtml(value)}" title="${escapeHtml(value)}">
        <span class="var-chip-name">${escapeHtml(value)}</span>
        <span class="var-chip-type">${escapeHtml(getColumnType(value) || '变量')}</span>
      </div>`).join('');
    if (!values.length) {
      visual.innerHTML = '<div class="var-empty-tip">拖拽变量到这里</div>';
    }
  });
  const count = el('poolVarCount');
  const pool = el('variablePoolList');
  if (count && pool) count.textContent = pool.options.length;
}

function bindVariableVisualEvents() {
  $$('.var-visual-list').forEach(list => {
    if (list.dataset.bound === '1') return;
    list.dataset.bound = '1';
    list.addEventListener('click', ev => {
      const item = ev.target.closest('.var-chip-item');
      if (!item) return;
      if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
        // 普通单击也支持多选：不清空同栏已有选择，方便新手直接连续点选。
      }
      item.classList.toggle('selected');
    });

    list.addEventListener('dblclick', ev => {
      const item = ev.target.closest('.var-chip-item');
      if (!item) return;
      const role = list.dataset.role;
      if (role === 'pool') return;
      moveVariables([item.dataset.var], role, 'pool');
    });

    list.addEventListener('dragstart', ev => {
      const item = ev.target.closest('.var-chip-item');
      if (!item) return;
      const role = list.dataset.role;
      const selected = getSelectedVisualValues(role);
      const values = selected.includes(item.dataset.var) ? selected : [item.dataset.var];
      ev.dataTransfer.setData('application/json', JSON.stringify({ sourceRole: role, values }));
      ev.dataTransfer.setData('text/plain', values.join('\n'));
      ev.dataTransfer.effectAllowed = 'move';
      item.classList.add('dragging');
      list.classList.add('drag-source');
    });

    list.addEventListener('dragend', () => {
      $$('.var-visual-list').forEach(x => x.classList.remove('drag-source', 'drag-over'));
      $$('.var-chip-item.dragging').forEach(x => x.classList.remove('dragging'));
    });

    ['dragenter', 'dragover'].forEach(evt => {
      list.addEventListener(evt, ev => {
        ev.preventDefault();
        list.classList.add('drag-over');
        ev.dataTransfer.dropEffect = 'move';
      });
    });

    list.addEventListener('dragleave', ev => {
      if (!list.contains(ev.relatedTarget)) list.classList.remove('drag-over');
    });

    list.addEventListener('drop', ev => {
      ev.preventDefault();
      list.classList.remove('drag-over');
      let payload = null;
      try { payload = JSON.parse(ev.dataTransfer.getData('application/json') || '{}'); } catch (_) { payload = null; }
      const values = (payload?.values || ev.dataTransfer.getData('text/plain').split(/\n|,/)).map(v => String(v).trim()).filter(Boolean);
      const sourceRole = payload?.sourceRole || 'pool';
      const targetRole = list.dataset.role || 'pool';
      if (values.length) moveVariables(values, sourceRole, targetRole);
    });
  });
}

function getSelectedVisualValues(role) {
  const visual = visualListForRole(role);
  if (!visual) return [];
  return [...visual.querySelectorAll('.var-chip-item.selected')].map(x => x.dataset.var).filter(Boolean);
}

function removeVariableFromAllRoles(value, exceptRole) {
  ['research_vars', 'covar_vars', 'outcome_vars'].forEach(role => {
    if (role === exceptRole) return;
    removeOptionByValue(hiddenSelectForRole(role), value);
  });
}

function moveVariables(values, sourceRole, targetRole) {
  const unique = [...new Set((values || []).filter(Boolean))];
  if (!unique.length || sourceRole === targetRole) return;
  unique.forEach(value => {
    if (targetRole === 'pool') {
      ['research_vars', 'covar_vars', 'outcome_vars'].forEach(role => removeOptionByValue(hiddenSelectForRole(role), value));
      addOptionSorted(hiddenSelectForRole('pool'), value);
    } else {
      removeVariableFromAllRoles(value, targetRole);
      removeOptionByValue(hiddenSelectForRole('pool'), value);
      addOptionSorted(hiddenSelectForRole(targetRole), value);
    }
    if (sourceRole && sourceRole !== targetRole) removeOptionByValue(hiddenSelectForRole(sourceRole), value);
  });
  refreshVariableSelectionAfterMove();
}

function addSelectedToRole(role) {
  const selected = getSelectedVisualValues('pool');
  if (!selected.length) {
    toast('请先在“所有变量”中选择变量，或直接拖拽到右侧栏', 'warning');
    return;
  }
  moveVariables(selected, 'pool', role);
}

function removeSelectedFromRole(role) {
  const selected = getSelectedVisualValues(role);
  if (!selected.length) {
    toast('请先在该变量栏中选择要移除的变量，或直接拖回“所有变量”', 'warning');
    return;
  }
  moveVariables(selected, role, 'pool');
}

function updateVariablePoolFromRoles() {
  const pool = hiddenSelectForRole('pool');
  if (!pool) return;
  const selected = new Set();
  ['research_vars', 'covar_vars', 'outcome_vars'].forEach(role => {
    const sel = hiddenSelectForRole(role);
    if (!sel) return;
    [...sel.options].forEach(o => selected.add(o.value));
  });
  [...pool.options].forEach(o => { if (selected.has(o.value)) o.remove(); });
  const count = el('poolVarCount');
  if (count) count.textContent = pool.options.length;
}

function refreshVariableSelectionAfterMove() {
  updateVariablePoolFromRoles();
  ['pool', 'research_vars', 'covar_vars', 'outcome_vars'].forEach(role => sortSelectOptions(hiddenSelectForRole(role)));
  renderVariableVisualLists();
  bindVariableVisualEvents();
  renderMiniTestGrid(STATE.activeChartCategory);
  updateStep2DataInfo();
  updateStep3DataInfo();
  updateWorkflowButtons();
}

function getVariableTypeBadgeText(col) {
  const t = getColumnType(col);
  const map = {
    continuous: '  · 连续', numeric: '  · 数值', date: '  · 日期', time: '  · 时间',
    categorical: '  · 分类', binary: '  · 二分类', group: '  · 分组', outcome_candidate: '  · 结局候选',
    ordinal_categorical: '  · 有序分类', id: '  · ID', region: '  · 地区'
  };
  return map[t] || '';
}

function updateStep2DataInfo() {
  // removed per user request
}

function updateRunPanel() {
  const summary = el('runConfigSummary');
  if (!summary) return;
  const config = getTestConfig(STATE.activeChartType);
  const vars = collectSelectedVars();
  const hasData = STATE.columns && STATE.columns.length > 0;
  if (!hasData) {
    summary.innerHTML = '<div class="empty-state">请先加载示例或上传数据，然后选择统计方法与变量</div>';
    return;
  }
  if (!config) {
    summary.innerHTML = '<div class="empty-state">请先在「方案选择」中选定一个统计检验方法</div>';
    return;
  }
  const lines = [];
  lines.push(`<strong>检验方法：</strong>${escapeHtml(config.name)}`);
  if (config.description) lines.push(`<small>${escapeHtml(config.description)}</small>`);
  if (vars.var) lines.push(`<strong>分析变量：</strong>${escapeHtml(vars.var)}`);
  if (vars.group_var) lines.push(`<strong>分组变量：</strong>${escapeHtml(vars.group_var)}`);
  const research = asArrayValue(vars.research_vars).filter(Boolean);
  if (research.length) lines.push(`<strong>研究变量：</strong>${escapeHtml(research.join('、'))}`);
  const covars = asArrayValue(vars.covar_vars).filter(Boolean);
  if (covars.length) lines.push(`<strong>协变量：</strong>${escapeHtml(covars.join('、'))}`);
  if (vars.paired_var) lines.push(`<strong>配对变量：</strong>${escapeHtml(vars.paired_var)}`);
  const outcomes = asArrayValue(vars.outcome_vars).filter(Boolean);
  if (outcomes.length) lines.push(`<strong>结局变量：</strong>${escapeHtml(outcomes.join('、'))}`);
  if (STATE.rowCount) lines.push(`<strong>数据规模：</strong>${STATE.rowCount} 行 × ${STATE.colCount} 列`);
  summary.innerHTML = lines.length > 1
    ? lines.map(l => `<div style="margin:4px 0">${l}</div>`).join('')
    : '<div class="empty-state">请完成变量配置后点击左侧「开始分析」按钮</div>';
}

function updateStep3DataInfo() {
  const el3 = el('step3DataInfo');
  if (!el3) return;
  const hasData = STATE.columns && STATE.columns.length > 0;
  if (!hasData) { el3.textContent = '请先完成变量选择'; return; }

  const avail = STATE.methodAvailability || {};
  const disabledCount = Object.values(avail).filter(v => v && !v.available).length;
  if (disabledCount > 0) {
    el3.textContent = `${Object.keys(avail).length - disabledCount}/${Object.keys(avail).length} 种方法可用（${disabledCount} 种不适用）`;
  } else {
    el3.textContent = '所有方法均可用';
  }
}

// ===== Theme Selector =====
function setupThemeSelector() {
  const sel = el('chartThemeSelect');
  if (sel) {
    sel.value = STATE.chartTheme || 'cnsTheme';
    sel.addEventListener('change', () => {
      STATE.chartTheme = sel.value;
      STATE.userColors = null;
      renderAppearanceControls();
      toast('主题: ' + (typeof CHART_THEMES !== 'undefined' && CHART_THEMES[sel.value]?.name || sel.value), 'info');
      refreshCurrentVisualization();
    });
  }

  const titleInput = el('chartTitleInput');
  if (titleInput && !titleInput.dataset.boundStatTitleRefresh) {
    titleInput.dataset.boundStatTitleRefresh = 'true';
    let titleTimer = null;
    titleInput.addEventListener('input', () => {
      clearTimeout(titleTimer);
      titleTimer = setTimeout(() => refreshCurrentVisualization(), 220);
    });
  }
}

function refreshCurrentVisualization() {
  // 图形参数调节只重绘当前激活图形，不能重新执行统计图生成；
  // 否则多图切换中的 activeStatChartVariantIndex 会被重置为 0，表现为一调参数就跳回第一张图。
  if (STATE.currentPlotlyDataRaw && STATE.currentPlotlyDataRaw.length > 0) {
    if (STATE.activeWsTab === 'chart') renderChart(STATE.currentPlotlyDataRaw, STATE.currentPlotlyLayoutRaw || STATE.currentPlotlyLayout || {});
    return true;
  }
  if (STATE.currentPlotlyData && STATE.currentPlotlyData.length > 0) {
    if (STATE.activeWsTab === 'chart') renderChart(STATE.currentPlotlyData, STATE.currentPlotlyLayout || {});
    return true;
  }
  if (typeof rerenderCurrentStatChart === 'function' && rerenderCurrentStatChart()) return true;
  return false;
}

// ===== Post Hoc =====
function setupPostHocSelect() {
  const sel = el('postHocSelect');
  if (!sel) return;
  sel.addEventListener('change', () => { STATE.postHocMethod = sel.value || null; });
}

function updatePostHocSection() {
  const section = el('postHocSection');
  if (!section) return;
  const config = getTestConfig(STATE.activeChartType);
  section.hidden = !(config && config.supportsPostHoc);
}

// ===== Data Meta =====
function updateDataMeta() {
  // removed per user request
}

function updateDownloadList() {
  const list = el('downloadList');
  if (!list) return;
  const hasResult = !!STATE.currentResult;
  if (hasResult) {
    list.className = 'download-list';
    list.innerHTML = `
      <a class="download-link" href="/api/examples/comprehensive_example/download" download><span>下载示例数据</span><small>综合临床 CSV</small></a>
      <a class="download-link" href="#" onclick="event.preventDefault();exportTableExcel();"><span>导出 Excel</span><small>结果表格</small></a>
      <a class="download-link" href="#" onclick="event.preventDefault();exportTableCSV();"><span>导出 CSV</span><small>结果表格</small></a>
    `;
  } else if (STATE.columns && STATE.columns.length > 0) {
    list.className = 'download-list';
    list.innerHTML = `<a class="download-link" href="/api/examples/comprehensive_example/download" download><span>下载示例数据</span><small>综合临床 CSV</small></a>`;
  } else {
    list.className = 'download-list empty';
    list.innerHTML = '加载数据后可下载示例，分析完成后可导出结果';
  }
}

// ===== Metric Grid =====
function updateMetricGrid() {
  const grid = el('metricGrid');
  if (!grid) return;
  const hasData = STATE.columns && STATE.columns.length > 0;
  const summary = STATE.summary || {};
  const config = typeof getTestConfig === 'function' ? getTestConfig(STATE.activeChartType) : null;

  grid.innerHTML = `
    <div class="summary-card"><span>N</span><strong>${hasData ? (STATE.rowCount || '—') : '--'}</strong><small>样本</small></div>
    <div class="summary-card"><span>Vars</span><strong>${hasData ? (STATE.colCount || '—') : '--'}</strong><small>变量</small></div>
    <div class="summary-card"><span>Missing</span><strong>${hasData ? (summary.missing_percent || '—') : '--'}</strong><small>缺失%</small></div>
    <div class="summary-card"><span>Method</span><strong>${config ? config.icon : '--'}</strong><small>${config ? config.name : '—'}</small></div>
  `;
}

// ===== Preview Table =====
function updatePreviewTable() {
  const target = el('previewTable');
  if (!target) return;
  const rows = STATE.previewRows || [];
  const cols = STATE.columns || [];

  if (!rows.length || !cols.length) {
    target.innerHTML = '<div class="empty-state">请先在左侧步骤 1 中加载数据</div>';
    return;
  }

  const displayCols = cols.slice(0, 12);
  let html = '<table class="three-line"><thead><tr>';
  displayCols.forEach(c => { html += `<th>${escapeHtml(String(c))}</th>`; });
  html += '</tr></thead><tbody>';
  const showRows = rows.slice(0, 30);
  showRows.forEach(row => {
    html += '<tr>';
    displayCols.forEach(c => {
      const v = row[c];
      html += `<td>${v !== undefined && v !== null ? escapeHtml(String(v)) : ''}</td>`;
    });
    html += '</tr>';
  });
  const totalRows = STATE.rowCount || rows.length;
  if (totalRows > showRows.length) html += `<caption>显示前 ${showRows.length} 行 / 共 ${totalRows} 行</caption>`;
  html += '</tbody></table>';
  target.innerHTML = html;

  // Update previewNextBtn
  const btn = el('previewNextBtn');
  if (btn) btn.disabled = false;
  updateWorkflowButtons();
}

// ===== Dataset Meta =====
function updateDatasetMeta() {
  const meta = el('datasetMeta');
  if (!meta) return;
  const hasData = STATE.columns && STATE.columns.length > 0;
  meta.textContent = hasData
    ? `${STATE.fileName || STATE.datasetName || '已载入'} · ${STATE.rowCount || 0} 行 × ${STATE.colCount || 0} 列`
    : '未载入数据';
}

// ===== Reset Results =====
function resetResults() {
  STATE.currentStatResult = null;
  STATE.currentStatChartData = null;

  const summaryContainer = el('resultSummary');
  if (summaryContainer) {
    summaryContainer.innerHTML = '<div class="empty-state">请选择统计方法并执行分析</div>';
  }
  ['resultTableContainer', 'groupStatsContainer', 'postHocContainer', 'descriptiveTableContainer'].forEach(id => {
    const c = el(id); if (c) c.innerHTML = '';
  });

  const exportBar = el('analysisExportBar');
  if (exportBar) exportBar.style.display = 'none';
  const unifiedExportBar = el('resultUnifiedExportBar');
  if (unifiedExportBar) unifiedExportBar.hidden = true;
  const chartExportBar = el('chartExportBar');
  if (chartExportBar) chartExportBar.hidden = true;

  const chartContainer = el('chartPreviewContainer');
  if (chartContainer) {
    const oldPlot = chartContainer.querySelector('.js-plotly-plot');
    if (oldPlot && window.Plotly) Plotly.purge(oldPlot);
    chartContainer.innerHTML = '<div class="empty-state">完成分析后选择图形预览</div>';
  }

  const badge = el('chartPreviewBadge');
  if (badge) badge.style.display = 'none';
  const variantBar = el('chartVariantBar');
  if (variantBar) { variantBar.hidden = true; variantBar.innerHTML = ''; }
}

// ===== Appearance Controls =====
function normalizeColorInputValue(value, fallback = '#ffffff') {
  const v = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return '#' + v.slice(1).split('').map(ch => ch + ch).join('');
  }
  return fallback;
}

function getCurrentChartFeatureFlags() {
  const traces = (STATE.currentPlotlyDataRaw && STATE.currentPlotlyDataRaw.length ? STATE.currentPlotlyDataRaw : STATE.currentPlotlyData) || [];
  const clean = (traces || []).filter(t => t && !(typeof isDecorativeTrace === 'function' && isDecorativeTrace(t)));
  const flags = { hasMarkers: false, hasLines: false, hasBars: false, hasDistribution: false, hasFill: false, hasPie: false };
  clean.forEach(t => {
    const type = String(t.type || 'scatter');
    const mode = String(t.mode || '');
    if (type === 'bar' || type === 'histogram' || type === 'barpolar') flags.hasBars = true;
    if (type === 'barpolar') flags.hasLines = true;
    if (['box', 'violin'].includes(type)) flags.hasDistribution = true;
    if (['pie', 'funnel', 'treemap'].includes(type)) flags.hasPie = true;
    if (type === 'scatter') {
      if (mode.includes('markers') || !mode || mode === 'markers') flags.hasMarkers = true;
      if (mode.includes('lines')) flags.hasLines = true;
      if (t.fill && t.fill !== 'none') flags.hasFill = true;
    }
    if (Array.isArray(t.marker?.size) || t.marker || type === 'scattergl') {
      if (type !== 'bar' && type !== 'histogram') flags.hasMarkers = flags.hasMarkers || mode.includes('markers');
    }
  });
  return flags;
}

function renderAppearanceControls() {
  const container = el('appearanceControls');
  if (!container) return;

  const theme = (typeof CHART_THEMES !== 'undefined' && typeof getActiveTheme === 'function')
    ? getActiveTheme() : null;
  const palette = (theme && theme.colorway)
    ? theme.colorway
    : ['#3f73c8', '#c0616e', '#55998b', '#c8922a', '#6F5AA7', '#7C8B52'];

  const ctx = typeof getCurrentAppearanceContext === 'function'
    ? getCurrentAppearanceContext(STATE.currentChartKind)
    : { targets: [], styleOptions: [{ id: 'solid', label: '标准' }], maxColors: 0 };
  STATE.currentAppearanceContext = ctx;
  const flags = getCurrentChartFeatureFlags();
  const targetCount = ctx.maxColors || 0;
  const targets = ctx.targets || [];
  const styleOptions = ctx.styleOptions || [{ id: 'solid', label: '标准' }];
  const validStyleIds = styleOptions.map(o => o.id);
  if (!validStyleIds.includes(STATE.chartVisualStyle)) STATE.chartVisualStyle = styleOptions[0].id;

  if (targetCount > 0) {
    const nextColors = Array.isArray(STATE.userColors) ? STATE.userColors.slice(0, targetCount) : [];
    while (nextColors.length < targetCount) nextColors.push(palette[nextColors.length % palette.length]);
    STATE.userColors = nextColors;
  } else {
    STATE.userColors = null;
  }

  let html = '';
  html += '<div class="appearance-section compact-appearance-section">';
  html += '<label class="appearance-label">图形风格</label>';
  html += `<div class="style-preset-row">${styleOptions.map(opt => `<button type="button" class="style-preset-btn ${STATE.chartVisualStyle === opt.id ? 'active' : ''}" data-style-id="${opt.id}">${opt.label}</button>`).join('')}</div>`;
  html += '</div>';

  const bgPreset = STATE.chartBgPreset || 'white';
  const gridMode = STATE.chartGridMode || 'grid';
  html += `<div class="appearance-section compact-appearance-section">
    <label class="appearance-label">背景与网格</label>
    <div class="bg-control-grid bg-control-grid-v88">
      <label><span>背景</span>
        <select id="chartBgPresetSelect" class="form-select compact-control">
          <option value="white" ${bgPreset === 'white' ? 'selected' : ''}>白色背景</option>
          <option value="transparent" ${bgPreset === 'transparent' ? 'selected' : ''}>透明背景</option>
        </select>
      </label>
      <label><span>网格线</span>
        <select id="chartGridModeSelect" class="form-select compact-control">
          <option value="grid" ${gridMode === 'grid' ? 'selected' : ''}>显示</option>
          <option value="blank" ${gridMode === 'blank' ? 'selected' : ''}>隐藏</option>
        </select>
      </label>
    </div>
  </div>`;

  if (targetCount > 0) {
    html += '<div class="appearance-section">';
    html += `<label class="appearance-label">配色映射（${targetCount} 项）</label>`;
    html += '<div class="color-picker-grid" id="colorPickerRow">';
    targets.forEach((target, i) => {
      const c = (STATE.userColors && STATE.userColors[i]) || palette[i % palette.length];
      html += `
        <label class="color-target-card">
          <span class="color-target-name" title="${target.label}">${target.label}</span>
          <span class="color-target-meta">${target.mode === 'point' ? '单项' : '系列'}</span>
          <input type="color" class="color-swatch" data-idx="${i}" value="${c}" title="${target.label}">
        </label>`;
    });
    html += '<button class="color-reset-btn" id="resetColorsBtn">重置颜色</button>';
    html += '</div></div>';
  }

  if (flags.hasBars) {
    const bw = STATE.barWidth || 0.62;
    html += `<div class="appearance-section"><label class="appearance-label">柱体宽度</label>
      <div class="slider-row"><input type="range" id="barWidthInput" min="0.2" max="0.95" step="0.05" value="${bw}" class="app-slider">
      <span class="slider-val" id="barWidthVal">${bw}</span></div></div>`;
  }

  if (flags.hasMarkers) {
    const ms = STATE.markerSize || 8;
    html += `<div class="appearance-section"><label class="appearance-label">点 / 标记大小</label>
      <div class="slider-row"><input type="range" id="markerSizeInput" min="3" max="20" value="${ms}" class="app-slider">
      <span class="slider-val" id="markerSizeVal">${ms}</span></div></div>`;

    const markerShape = STATE.markerShape || 'circle';
    html += `<div class="appearance-section"><label class="appearance-label">标记形状</label>
      <select id="markerShapeSelect" class="form-select compact-control">
        <option value="circle" ${markerShape === 'circle' ? 'selected' : ''}>圆点</option>
        <option value="circle-open" ${markerShape === 'circle-open' ? 'selected' : ''}>空心圆</option>
        <option value="square" ${markerShape === 'square' ? 'selected' : ''}>方形</option>
        <option value="diamond" ${markerShape === 'diamond' ? 'selected' : ''}>菱形</option>
        <option value="cross" ${markerShape === 'cross' ? 'selected' : ''}>十字</option>
        <option value="x" ${markerShape === 'x' ? 'selected' : ''}>X 形</option>
        <option value="triangle-up" ${markerShape === 'triangle-up' ? 'selected' : ''}>三角形</option>
      </select></div>`;
  }

  if (flags.hasLines || flags.hasDistribution) {
    const lw = STATE.lineWidth || 2.5;
    html += `<div class="appearance-section"><label class="appearance-label">${flags.hasDistribution && !flags.hasLines ? '边框线宽' : '线条宽度'}</label>
      <div class="slider-row"><input type="range" id="lineWidthInput" min="0.5" max="8" step="0.5" value="${lw}" class="app-slider">
      <span class="slider-val" id="lineWidthVal">${lw}</span></div></div>`;
  }

  if (flags.hasMarkers || flags.hasBars || flags.hasDistribution || flags.hasFill || flags.hasPie) {
    const op = STATE.markerOpacity != null ? STATE.markerOpacity : 0.88;
    html += `<div class="appearance-section"><label class="appearance-label">透明度</label>
      <div class="slider-row"><input type="range" id="markerOpacityInput" min="0.1" max="1" step="0.05" value="${op}" class="app-slider">
      <span class="slider-val" id="markerOpacityVal">${op}</span></div></div>`;
  }

  if (!flags.hasMarkers && !flags.hasLines && !flags.hasBars && !flags.hasDistribution && !flags.hasPie && !targetCount) {
    html += '<div class="appearance-section"><div class="empty-state" style="min-height:72px;">当前图形无可调节的点、线或柱体元素。</div></div>';
  }

  container.innerHTML = html;

  $$('.style-preset-btn', container).forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.chartVisualStyle = btn.dataset.styleId;
      if (typeof renderChartVariantBar === 'function') renderChartVariantBar();
      renderAppearanceControls();
      refreshCurrentVisualization();
    });
  });

  $$('.color-swatch', container).forEach(input => {
    input.addEventListener('input', (e) => {
      if (!STATE.userColors) STATE.userColors = [];
      STATE.userColors[Number(e.target.dataset.idx)] = e.target.value;
      refreshCurrentVisualization();
    });
    input.addEventListener('change', () => refreshCurrentVisualization());
  });

  const bgPresetSelect = el('chartBgPresetSelect');
  if (bgPresetSelect) bgPresetSelect.addEventListener('change', () => {
    STATE.chartBgPreset = bgPresetSelect.value || 'white';
    if (STATE.chartBgPreset === 'transparent') {
      STATE.chartPlotBg = 'rgba(255,255,255,0)';
      STATE.chartPaperBg = 'rgba(255,255,255,0)';
    } else {
      STATE.chartPlotBg = '#ffffff';
      STATE.chartPaperBg = '#ffffff';
    }
    refreshCurrentVisualization();
  });

  const gridModeSelect = el('chartGridModeSelect');
  if (gridModeSelect) gridModeSelect.addEventListener('change', () => {
    STATE.chartGridMode = gridModeSelect.value || 'grid';
    refreshCurrentVisualization();
  });

  const resetBtn = el('resetColorsBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    STATE.userColors = null;
    renderAppearanceControls();
    refreshCurrentVisualization();
  });

  const markerShapeSelect = el('markerShapeSelect');
  if (markerShapeSelect) markerShapeSelect.addEventListener('change', () => {
    STATE.markerShape = markerShapeSelect.value || 'circle';
    refreshCurrentVisualization();
  });

  ['markerSizeInput', 'lineWidthInput', 'markerOpacityInput', 'barWidthInput'].forEach(id => {
    const slider = el(id); if (!slider) return;
    const applySliderState = () => {
      const valSpan = el(id.replace('Input', 'Val')); if (valSpan) valSpan.textContent = slider.value;
      if (id === 'markerSizeInput') STATE.markerSize = Number(slider.value);
      else if (id === 'lineWidthInput') STATE.lineWidth = Number(slider.value);
      else if (id === 'barWidthInput') {
        STATE.barWidth = Number(slider.value);
        // 对 histogram，宽度改为同步驱动 bargap，避免“宽度不生效”
        const gap = Math.max(0.02, Math.min(0.82, Number((1 - Number(slider.value)).toFixed(2))));
        STATE.barGap = gap;
      } else {
        STATE.markerOpacity = Number(slider.value);
      }
    };
    slider.addEventListener('input', () => {
      applySliderState();
      refreshCurrentVisualization();
    });
    slider.addEventListener('change', () => {
      applySliderState();
      refreshCurrentVisualization();
    });
  });
}

// ===== Run Analysis =====
async function runAnalysis() {
  const config = getTestConfig(STATE.activeChartType);
  if (!config) { toast('请先选择统计方法', 'warning'); return; }
  if (!STATE.columns || STATE.columns.length === 0) { toast('请先载入数据', 'warning'); return; }

  const btn = el('generateChartBtn');
  if (btn) { btn.disabled = true; btn.textContent = '分析中...'; }

  try {
    const body = buildAnalysisRequest(config);
    const data = await apiPost('/api/analyze', body);

    if (data.status === 'error') { toast(data.message || '分析失败', 'error'); return; }

    STATE.currentStatResult = data.result;
    STATE.currentResult = data.result;
    STATE.currentStatChartData = data.result?.chart_data || null;
    STATE.currentDiscussion = data.discussion || null;
    STATE.currentTableData = data.tables?.result || null;
    STATE.currentStatTables = data.tables || null;

    renderStatResults(data);
    renderDataDescriptionPanel();
    updateDownloadList();
    updateChartSettingsVisibility(true);
    activateStep('result');
    toast('统计分析完成！已生成数据描述、统计描述与结果可视化', 'success');
  } catch (e) {
    toast('分析失败: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '开始分析'; }
  }
}

function buildAnalysisRequest(config) {
  const params = collectSelectedVars();
  const defaults = (typeof getTestDefaultParams === 'function') ? getTestDefaultParams(STATE.activeChartType) : {};
  const hasCol = v => !!v && (!STATE.columns || STATE.columns.includes(v));
  const outcomes = asArrayValue(params.outcome_vars);
  const research = asArrayValue(params.research_vars);
  const covars = asArrayValue(params.covar_vars);
  const defaultOutcome = [defaults.y_var, defaults.var, defaults.outcome_var].find(hasCol) || '';
  const defaultGroup = [defaults.x_var, defaults.group_var].find(hasCol) || '';
  const defaultPaired = [defaults.paired_var, defaults.var2, defaults.event_var].find(hasCol) || '';
  const defaultPredictors = [
    ...(Array.isArray(defaults.value_vars) ? defaults.value_vars : []),
    ...(Array.isArray(defaults.x_vars) ? defaults.x_vars : []),
    ...(Array.isArray(defaults.predictor_vars) ? defaults.predictor_vars : []),
  ].filter(hasCol);

  const responseVar = params.var || outcomes[0] || defaultOutcome || '';
  const predictors = [...new Set([...(params.value_vars || []), ...research, ...covars, ...defaultPredictors].filter(Boolean))]
    .filter(v => v !== responseVar);

  const body = {
    test_type: STATE.activeChartType,
    var: responseVar,
    use_demo: !STATE.uploadId,
    dataset_name: STATE.datasetName || 'comprehensive_example',
    upload_id: STATE.uploadId || null,
    sheet_name: STATE.activeSheet || null,
    research_vars: research,
    covar_vars: covars,
    outcome_vars: outcomes,
  };

  if (config.requiresGroup) body.group_var = params.group_var || research[0] || defaultGroup || '';
  if (config.requiresPaired) body.paired_var = params.paired_var || outcomes[1] || defaultPaired || research[0] || '';
  if (config.supportsPostHoc) body.post_hoc = STATE.postHocMethod || null;
  if (config.requiresSubject) body.subject_var = params.subject_var || '';
  if (config.requiresTimeEvent) {
    const allSelected = [...new Set([...outcomes, ...research, ...covars].filter(Boolean))];
    const timeCandidate = [params.time_var, ...outcomes, ...research].find(v => v && hasNumericSignal(v, 2) && /time|survival|duration|follow|天|月|时间|生存/i.test(String(v))) ||
      [params.time_var, ...outcomes, ...research].find(v => v && hasNumericSignal(v, 2)) || '';
    const eventCandidate = [params.event_var, ...allSelected].find(v => v && v !== timeCandidate && binaryEventInfo(v).valid) || '';
    body.time_var = timeCandidate;
    body.event_var = eventCandidate;
  }
  if (config.requiresCovariate) {
    body.covar = [params.covar, ...covars, defaults.covar].find(v => v && hasNumericSignal(v, 3)) || params.covar || covars[0] || defaults.covar || '';
  }
  if (config.requiresMultiVar) {
    body.value_vars = predictors;
    body.x_vars = predictors;
    body.predictor_vars = predictors;
  }

  return body;
}

// ===== Export Buttons =====
function setupExportButtons() {
  document.addEventListener('click', function(e) {
    const exportBtn = e.target.closest('#analysisExportBar .export-btn');
    if (exportBtn) {
      e.preventDefault();
      const fmt = exportBtn.dataset.fmt;
      if (fmt === 'excel') exportTableExcel();
      else if (fmt === 'csv') exportTableCSV();
      else if (fmt === 'html') exportTableHTML();
      else if (fmt === 'clipboard') copyTableToClipboard();
      return;
    }
    const resultExportBtn = e.target.closest('#resultUnifiedExportBar .result-export-btn');
    if (resultExportBtn) {
      e.preventDefault();
      const fmt = resultExportBtn.dataset.resultExport;
      if (typeof exportUnifiedResult === 'function') exportUnifiedResult(fmt);
      return;
    }

    const downloadToggle = e.target.closest('#chartDownloadBtn');
    if (downloadToggle) { e.preventDefault(); toggleChartDownloadMenu(); return; }
    const chartExportBtn = e.target.closest('#chartDownloadMenu .download-option');
    if (chartExportBtn) {
      e.preventDefault();
      const fmt = chartExportBtn.dataset.fmt;
      closeChartDownloadMenu();
      if (['png', 'svg', 'tiff', 'pdf'].includes(fmt)) downloadChartImage(fmt);
      return;
    }
    if (!e.target.closest('#chartExportBar')) closeChartDownloadMenu();
  });

  // Run button
  const runBtn = el('generateChartBtn');
  if (runBtn) runBtn.addEventListener('click', () => runAnalysis());
}

function toggleChartDownloadMenu() {
  const menu = el('chartDownloadMenu'), btn = el('chartDownloadBtn');
  if (!menu || !btn) return;
  const wo = !menu.hidden;
  menu.hidden = wo;
  btn.setAttribute('aria-expanded', wo ? 'false' : 'true');
}
function closeChartDownloadMenu() {
  const menu = el('chartDownloadMenu'), btn = el('chartDownloadBtn');
  if (menu && btn) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
}

// ===== Chart Rendering (delegates to renderChart in charts.js) =====
function renderChart(plotlyData, plotlyLayout) {
  const container = el('chartPreviewContainer');
  if (!container || !window.Plotly) return;

  const sourceTraces = (STATE.currentPlotlyDataRaw && STATE.currentPlotlyDataRaw.length) ? STATE.currentPlotlyDataRaw : plotlyData;
  const sourceLayout = (STATE.currentPlotlyLayoutRaw && Object.keys(STATE.currentPlotlyLayoutRaw || {}).length) ? STATE.currentPlotlyLayoutRaw : plotlyLayout;
  if (!sourceTraces || !sourceTraces.length) return;

  const theme = typeof getActiveTheme === 'function' ? getActiveTheme() : (CHART_THEMES ? CHART_THEMES[STATE.chartTheme || 'cnsTheme'] : {});
  let traces = JSON.parse(JSON.stringify(sourceTraces || []));
  let layout = JSON.parse(JSON.stringify(sourceLayout || {}));

  if (theme) {
    layout.paper_bgcolor = theme.bgColor || layout.paper_bgcolor || '#ffffff';
    layout.plot_bgcolor = theme.plotBgColor || layout.plot_bgcolor || '#ffffff';
    if (theme.ink && layout.font) layout.font = { ...layout.font, color: theme.ink };
    if (theme.fontFamily && layout.font) layout.font = { ...layout.font, family: theme.fontFamily };
  }

  if (typeof polishTracesForPublication === 'function') traces = polishTracesForPublication(traces, theme);
  if (typeof applyThemeLayout === 'function') layout = applyThemeLayout(layout, theme);
  if (typeof polishLayoutForPublication === 'function') layout = polishLayoutForPublication(layout, STATE.currentChartKind, theme);

  const bg = STATE.chartPlotBg || '#ffffff';
  layout.paper_bgcolor = bg;
  layout.plot_bgcolor = bg;
  const gridMode = STATE.chartGridMode || 'grid';
  const customGridColor = STATE.chartGridColor || '#e5edf7';
  const isPolarChart = Boolean(layout.polar)
    || String(STATE.currentChartKind || '').toLowerCase().includes('polar')
    || traces.some(t => ['barpolar', 'scatterpolar'].includes(String(t.type || '')));
  if (isPolarChart && layout.polar) {
    layout.polar = {
      ...(layout.polar || {}),
      bgcolor: bg,
      radialaxis: {
        ...(layout.polar.radialaxis || {}),
        showgrid: gridMode === 'grid',
        gridcolor: gridMode === 'grid' ? customGridColor : 'rgba(0,0,0,0)',
      },
      angularaxis: {
        ...(layout.polar.angularaxis || {}),
        showgrid: gridMode === 'grid',
        gridcolor: gridMode === 'grid' ? customGridColor : 'rgba(0,0,0,0)',
      },
    };
  } else {
    ['xaxis', 'yaxis'].forEach(axisKey => {
      layout[axisKey] = layout[axisKey] || {};
    });
    Object.keys(layout).filter(k => /^xaxis\d*$|^yaxis\d*$/.test(k)).forEach(k => {
      layout[k] = {
        ...(layout[k] || {}),
        showgrid: gridMode === 'grid',
        gridcolor: customGridColor,
        zeroline: gridMode === 'grid',
        zerolinecolor: customGridColor,
      };
    });
  }

  STATE.currentPlotlyData = traces;
  STATE.currentPlotlyLayout = layout;
  STATE.currentAppearanceContext = typeof getCurrentAppearanceContext === 'function' ? getCurrentAppearanceContext(STATE.currentChartKind) : null;
  if (typeof renderChartVariantBar === 'function') renderChartVariantBar();

  const oldPlot = container.querySelector('.js-plotly-plot');
  if (oldPlot && window.Plotly) Plotly.purge(oldPlot);
  container.innerHTML = '';
  const plotMount = document.createElement('div');
  plotMount.className = 'chart-plot';
  container.appendChild(plotMount);

  const availableW = Math.max(640, container.clientWidth - 28);
  const availableH = Math.max(520, container.clientHeight - 28);
  const w = Math.min(availableW, 980);
  const h = Math.min(availableH, Math.max(520, Math.round(w * 0.68)));
  plotMount.style.width = `${w}px`;
  plotMount.style.height = `${h}px`;
  layout.width = w; layout.height = h;
  layout.autosize = false;

  Plotly.newPlot(plotMount, traces, layout, {
    responsive: true, displaylogo: false, displayModeBar: false,
  });

  const chartExportBar = el('chartExportBar');
  if (chartExportBar) chartExportBar.hidden = false;
}


function updateWorkflowButtons() {
  const hasData = STATE.columns && STATE.columns.length > 0;
  const selectedVars = collectSelectedVars();
  const hasOutcome = asArrayValue(selectedVars.outcome_vars).length > 0;
  const activeConfig = typeof getTestConfig === 'function' ? getTestConfig(STATE.activeChartType) : null;
  const activeAvail = activeConfig ? checkMethodAvailability(activeConfig, selectedVars) : { available: false };

  const variableNextBtn = el('variableNextBtn');
  const methodNextBtn = el('methodNextBtn');
  const previewNextBtn = el('previewNextBtn');
  const runBtn = el('generateChartBtn');
  if (previewNextBtn) previewNextBtn.disabled = !hasData;
  if (variableNextBtn) variableNextBtn.disabled = !(hasData && hasOutcome);
  if (methodNextBtn) methodNextBtn.disabled = !(hasData && STATE.activeChartType && activeAvail.available);
  if (runBtn) runBtn.disabled = !(hasData && STATE.activeChartType && activeAvail.available);
}

function renderDataDescriptionPanel() {
  const target = el('dataDescriptionContainer');
  if (!target) return;
  const hasData = STATE.columns && STATE.columns.length > 0;
  if (!hasData) {
    target.innerHTML = '<div class="empty-state">尚未载入数据</div>';
    return;
  }

  const cols = STATE.columns || [];
  const summary = STATE.summary || {};
  const missing = summary.missing_percent ?? STATE.missing_percent ?? '—';

  const selectedVars = collectSelectedVars();
  const research = asArrayValue(selectedVars.research_vars);
  const covars = asArrayValue(selectedVars.covar_vars);
  const outcomes = asArrayValue(selectedVars.outcome_vars);
  const activeName = getTestConfig(STATE.activeChartType)?.name || '尚未选择';

  const typeRows = Object.entries(STATE.variableTypes || {})
    .filter(([, arr]) => Array.isArray(arr) && arr.length)
    .map(([k, arr]) => `<tr><td>${escapeHtml(k)}</td><td>${arr.length}</td><td>${escapeHtml(arr.slice(0, 10).join('、'))}${arr.length > 10 ? ' …' : ''}</td></tr>`)
    .join('');

  target.innerHTML = `
    <div class="description-table-block compact-description-block">
      <h4>数据集基本信息</h4>
      <table class="three-line desc-table"><tbody>
        <tr><th>数据来源</th><td>${escapeHtml(STATE.fileName || STATE.datasetName || '当前数据集')}</td><th>样本量</th><td>${STATE.rowCount || 0}</td></tr>
        <tr><th>变量数</th><td>${STATE.colCount || cols.length || 0}</td><th>总体缺失比例</th><td>${escapeHtml(missing)}</td></tr>
        <tr><th>当前统计方案</th><td>${escapeHtml(activeName)}</td><th>当前数据视图</th><td>基本信息、变量角色与变量类型</td></tr>
      </tbody></table>
    </div>

    <div class="description-table-block compact-description-block">
      <h4>变量角色选择概览</h4>
      <table class="three-line desc-table"><tbody>
        <tr><th>研究变量</th><td>${escapeHtml(research.join('、') || '未选择')}</td></tr>
        <tr><th>协变量 / 混杂因素</th><td>${escapeHtml(covars.join('、') || '未选择')}</td></tr>
        <tr><th>结局变量</th><td>${escapeHtml(outcomes.join('、') || '未选择')}</td></tr>
      </tbody></table>
    </div>

    <div class="description-table-block compact-description-block">
      <h4>变量类型概览</h4>
      <table class="three-line desc-table"><thead><tr><th>变量类型</th><th>数量</th><th>代表变量</th></tr></thead><tbody>
        ${typeRows || '<tr><td colspan="3">暂无变量类型信息</td></tr>'}
      </tbody></table>
    </div>
  `;
}

function updateChartSettingsVisibility(forceShow = false) {
  const panel = el('chartSettingsPanel');
  if (!panel) return;
  const hasChart = !!(STATE.currentPlotlyData && STATE.currentPlotlyData.length > 0) || !!(STATE.currentPlotlyDataRaw && STATE.currentPlotlyDataRaw.length > 0) || !!STATE.currentStatChartData;
  panel.classList.toggle('is-hidden', !(forceShow || hasChart));
  const variantBar = el('chartVariantBar');
  if (variantBar) variantBar.hidden = !(forceShow || hasChart);
  if (forceShow || hasChart) {
    renderAppearanceControls();
    if (typeof renderChartVariantBar === 'function') renderChartVariantBar();
  }
}

// ===== Boot =====
function bootEmptyState() {
  updateMetricGrid();
  updatePreviewTable();
  updateDatasetMeta();
  updateDownloadList();
  updateDataMeta();
  updateWorkflowButtons();
  setWorkflowHint('请先在左侧加载示例或上传文件');
  updateChartSettingsVisibility();
  activateStep('upload');
  activateWsTab('preview');
}


let workflowHintTimer = null;
function setWorkflowHint(message, type = 'success') {
  const hint = el('workflowHint');
  if (!hint) return;
  clearTimeout(workflowHintTimer);
  if (!message) {
    hint.textContent = '';
    hint.className = 'workflow-hint is-hidden';
    return;
  }
  hint.textContent = message;
  hint.className = 'workflow-hint ' + (type || 'info');
  workflowHintTimer = setTimeout(() => {
    hint.textContent = '';
    hint.className = 'workflow-hint is-hidden';
  }, 3000);
}

// ===== Utilities =====
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
