/* ── Main Application Entry ─────────────────────────────── */
/* 4-step workflow: method → data → variables → result       */

const APP = {
  methods: [],
  methodMap: new Map(),
  activeStep: 'method',
  activeResultTab: 'chart',
  lastResult: null,
  sizeLinked: false,
  chartAspect: 760 / 600,
};

/* ── DOM helpers ────────────────────────────────────────── */
function dom(id) { return document.getElementById(id); }
function domAll(selector, parent) { return Array.from((parent || document).querySelectorAll(selector)); }
function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function formula(title, math, note) {
  return { title, math, note };
}

const BASIC_METHOD_FORMULAS = {
  t_test_independent: formula('两独立样本均值差', 't = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)', '用于比较两个独立组的连续结局均值，默认推荐 Welch 校正以降低方差不齐带来的偏差。'),
  t_test_paired: formula('配对差值检验', 't = d̄ / (s_d / √n)', '先计算每个对象前后或两方法之间的差值，再检验差值均值是否偏离 0。'),
  one_sample_t_test: formula('单样本均值检验', 't = (x̄ - μ₀) / (s / √n)', '用于判断一个连续变量的总体均值是否偏离预设参考值。'),
  normality_test: formula('Shapiro-Wilk 正态性检验', 'W = (Σ aᵢ x_(i))² / Σ(xᵢ - x̄)²', 'P 值较小时提示分布偏离正态，应结合 Q-Q 图和样本量一起判断。'),
  levene_test: formula('Levene / Brown-Forsythe 方差齐性', 'W = 组间离差均方 / 组内离差均方', '以均值或中位数为中心比较各组离散程度，Brown-Forsythe 对偏态更稳健。'),
  anova: formula('单因素方差分析', 'F = MS_between / MS_within', '比较三组及以上连续结局的均值差异；显著后应再看事后比较定位差异来源。'),
  repeated_measures_anova: formula('重复测量方差分析', 'Yᵢⱼ = μ + subjectᵢ + timeⱼ + εᵢⱼ', '用于同一受试者多个时间点或条件下的连续结局，关键是区分个体内变化和个体间差异。'),
  ancova: formula('协方差分析', 'Y = β₀ + β₁Group + β₂Covariate + ε', '在比较组间差异时同步校正连续协变量，常用于基线校正后的结局比较。'),
  mann_whitney: formula('Mann-Whitney U 检验', 'U = R₁ - n₁(n₁ + 1)/2', '比较两个独立组的秩分布，适合偏态连续资料或等级资料。'),
  kruskal_wallis: formula('Kruskal-Wallis H 检验', 'H = 12/[N(N+1)] Σ(Rᵢ²/nᵢ) - 3(N+1)', '非参数多组比较，显著后可继续做校正后的两两比较。'),
  wilcoxon_signed_rank: formula('Wilcoxon 符号秩检验', 'W = Σ signed ranks', '用于配对资料的非参数比较，关注个体内差值的方向和秩大小。'),
  friedman: formula('Friedman 检验', 'χ²_F = 12/[nk(k+1)] ΣRⱼ² - 3n(k+1)', '用于同一对象在多个时间点或条件下的非参数重复测量比较。'),
  chi_square: formula('Pearson 卡方检验', 'χ² = Σ(O - E)² / E', '用于两个分类变量的关联分析，应同步查看列联表频数和期望频数。'),
  fisher_exact: formula('Fisher 精确检验', 'p = Π row! Π col! / (n! Π cell!)', '适合 2×2 小样本或期望频数偏低的列联表。'),
  mcnemar: formula('McNemar 配对分类检验', 'χ² = (|b - c| - 1)² / (b + c)', '只使用不一致配对 b 和 c 判断两种方法或两个时间点的分类改变。'),
  pearson_correlation: formula('Pearson 相关', 'r = cov(X,Y) / (sₓsᵧ)', '度量两个连续变量的线性相关方向和强度。'),
  spearman_correlation: formula('Spearman 秩相关', 'ρ = corr(rank(X), rank(Y))', '基于秩次评价单调关系，对偏态和极端值更稳健。'),
  log_rank: formula('Log-rank 生存曲线比较', 'χ² = (O - E)² / V', '比较不同组 Kaplan-Meier 生存曲线，解释时需结合曲线形态和风险表。'),
  logistic_regression: formula('Logistic 回归概率模型', 'logit(p) = log[p/(1-p)] = Xβ', '用于二分类结局建模，系数指数化后为每 1 SD 变化对应的 OR。'),
  linear_regression: formula('多重线性回归', 'Y = β₀ + β₁X₁ + ... + βₚXₚ + ε', '用于连续结局的多因素线性建模，重点查看标准化 β、R² 和残差诊断。'),
  discriminant_analysis: formula('线性判别分析', 'δ_k(x) = xᵀΣ⁻¹μ_k - 1/2 μ_kᵀΣ⁻¹μ_k + logπ_k', '用连续预测变量构造判别得分，查看类别是否在低维空间中分离。'),
  quadratic_discriminant_analysis: formula('二次判别分析', 'δ_k(x) = -1/2log|Σ_k| - 1/2(x-μ_k)ᵀΣ_k⁻¹(x-μ_k) + logπ_k', '允许不同类别具有不同协方差结构，适合类别边界更弯曲的情形。'),
};

const BASIC_METHOD_CONCEPTS = {
  paired: ['同一对象', '差值/变化', '配对检验'],
  grouped: ['分组变量', '连续结局', '组间比较'],
  categorical: ['分类变量 A', '列联表', '关联判断'],
  correlation: ['变量 X', '散点关系', '相关系数'],
  survival: ['随访时间', '事件状态', '生存曲线'],
  regression: ['预测变量 X', '模型系数', '结局 Y'],
  discriminant: ['连续指标', '判别空间', '类别分离'],
  single: ['样本分布', '参考值/假设', '统计判断'],
};

const METHOD_INTROS = {
  t_test_independent: '用于比较两个相互独立组别在连续结局上的平均水平。界面会把研究变量作为分组因素，把结局变量作为被比较的连续指标，并优先使用 Welch 版本降低方差不齐的影响。',
  t_test_paired: '用于同一对象前后两次测量、左右配对或两种方法配对测量的均值比较。解释重点是每个对象内部差值，而不是两组独立样本。',
  one_sample_t_test: '用于判断单个连续变量的样本均值是否偏离预设参考均值。适合有明确临床阈值、历史均值或标准值的场景。',
  normality_test: '用于检查连续变量分布是否明显偏离正态。它更适合作为方法选择依据，应结合直方图、Q-Q 图、样本量和偏度峰度共同判断。',
  levene_test: '用于比较不同组别的离散程度是否相近。若提示方差不齐，后续均值比较应优先选择 Welch、稳健方法或非参数方法。',
  anova: '用于三组及以上独立组别的连续结局均值比较。总体检验回答“是否至少有一组不同”，显著后需要事后比较定位差异来源。',
  repeated_measures_anova: '用于同一受试者在多个时间点或条件下的连续结局比较。模型会区分个体内变化和个体间差异，因此必须指定受试者 ID。',
  ancova: '用于在比较组别差异的同时校正连续协变量，常见于基线校正、年龄校正或混杂因素控制后的结局比较。',
  mann_whitney: '用于两个独立组的非参数比较，适合偏态连续资料、等级资料或明显不满足 t 检验前提的资料。',
  kruskal_wallis: '用于三组及以上独立组的非参数比较。它比较秩分布差异，显著后仍需进行校正后的两两比较。',
  wilcoxon_signed_rank: '用于配对资料的非参数比较，关注配对差值的方向和秩大小，适合偏态差值或等级配对资料。',
  friedman: '用于同一对象多个时间点或条件下的非参数重复测量比较，是重复测量 ANOVA 的稳健替代。',
  chi_square: '用于两个分类变量之间的关联分析。解释时应同时查看列联表频数、比例和期望频数，而不是只看 P 值。',
  fisher_exact: '用于小样本 2x2 列联表的精确检验。当期望频数较低时，它比普通卡方检验更稳健。',
  mcnemar: '用于配对二分类资料，常见于同一对象前后阳性率变化或两种诊断方法的配对比较。检验只由不一致配对贡献。',
  pearson_correlation: '用于两个连续变量之间的线性相关分析。散点图形态、异常值和线性趋势会直接影响解释。',
  spearman_correlation: '用于两个变量的单调相关分析，基于秩次计算，对偏态分布和极端值更稳健。',
  log_rank: '用于比较不同组别的 Kaplan-Meier 生存曲线。需要同时指定随访时间、事件状态和分组变量。',
  logistic_regression: '用于二分类结局的多因素建模。研究变量会作为预测因子进入模型，结果重点看 OR、置信区间、模型区分度和校准表现。',
  linear_regression: '用于连续结局的多因素线性建模。解释重点包括标准化系数方向、效应大小、R² 和残差诊断。',
  discriminant_analysis: '用于根据连续预测指标区分类别。LDA 假定类别协方差结构相近，结果应结合判别得分图和交叉验证准确率。',
  quadratic_discriminant_analysis: '用于类别边界可能更弯曲的判别分析。QDA 允许不同类别有不同协方差结构，但更依赖样本量和正则化。',
};

const METHOD_CONCEPT_TYPES = {
  t_test_independent: 'grouped',
  levene_test: 'variance',
  anova: 'variance',
  repeated_measures_anova: 'longitudinal',
  ancova: 'adjusted',
  t_test_paired: 'paired',
  wilcoxon_signed_rank: 'paired',
  friedman: 'longitudinal',
  one_sample_t_test: 'single',
  normality_test: 'normality',
  mann_whitney: 'rank',
  kruskal_wallis: 'rank',
  chi_square: 'categorical',
  fisher_exact: 'categorical',
  mcnemar: 'paired_categorical',
  pearson_correlation: 'correlation',
  spearman_correlation: 'correlation',
  log_rank: 'survival',
  logistic_regression: 'sigmoid',
  linear_regression: 'regression',
  discriminant_analysis: 'discriminant',
  quadratic_discriminant_analysis: 'discriminant',
};

const METHOD_CONCEPT_LABELS = {
  logistic_regression: ['预测因子', 'logit 概率', '二分类结局'],
  linear_regression: ['多个预测因子', '线性组合', '连续结局'],
  discriminant_analysis: ['连续指标', '判别空间', '类别边界'],
  quadratic_discriminant_analysis: ['连续指标', '二次边界', '类别分离'],
  log_rank: ['随访时间', '删失/事件', '生存曲线'],
  normality_test: ['样本分位数', '理论分位数', '偏离判断'],
  anova: ['组间变异', '组内变异', 'F 统计量'],
  levene_test: ['组内离差', '方差齐性', '稳健判断'],
  ancova: ['分组效应', '协变量校正', '调整均值'],
  repeated_measures_anova: ['受试者 ID', '时间/条件', '个体内变化'],
  friedman: ['受试者 ID', '秩次变化', '重复测量差异'],
  chi_square: ['分类变量 A', '列联表频数', '关联判断'],
  fisher_exact: ['2x2 频数', '精确概率', '小样本判断'],
  mcnemar: ['配对前', '不一致配对', '配对后'],
};

function methodConceptType(testId) {
  if (['t_test_paired', 'wilcoxon_signed_rank', 'mcnemar'].includes(testId)) return 'paired';
  if (['chi_square', 'fisher_exact'].includes(testId)) return 'categorical';
  if (['pearson_correlation', 'spearman_correlation'].includes(testId)) return 'correlation';
  if (testId === 'log_rank') return 'survival';
  if (['logistic_regression', 'linear_regression', 'ancova'].includes(testId)) return 'regression';
  if (['discriminant_analysis', 'quadratic_discriminant_analysis'].includes(testId)) return 'discriminant';
  if (['one_sample_t_test', 'normality_test'].includes(testId)) return 'single';
  return 'grouped';
}

/* ── Toast ──────────────────────────────────────────────── */
function showToast(msg, type) {
  var container = dom('toastContainer');
  if (!container) return;
  var t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function() { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(function() { t.remove(); }, 300); }, 3500);
}

/* ── API wrappers ───────────────────────────────────────── */
async function apiPost(url, body) {
  body = body || {};
  var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { var err = await res.json().catch(function() { return { detail: res.statusText }; }); throw new Error(err.detail || 'Request failed'); }
  return res.json();
}
async function apiGet(url) {
  var res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

/* ── Step Navigation ────────────────────────────────────── */
function setupStepNavigation() {
  domAll('.nav-step').forEach(function(btn) {
    btn.addEventListener('click', function() { activateStep(btn.dataset.tab); });
  });
}

function activateStep(stepName) {
  APP.activeStep = stepName;
  domAll('.nav-step').forEach(function(b) { b.classList.remove('active'); });
  domAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  var btn = document.querySelector('.nav-step[data-tab="' + stepName + '"]');
  var panel = dom('tab-' + stepName);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

/* ── Method Grid in LEFT panel (Step 1) ─────────────────── */
function renderMethodGrid(category) {
  var grid = dom('miniMethodGrid');
  if (!grid || typeof TEST_CATALOG === 'undefined') return;
  var tests = Object.values(TEST_CATALOG).filter(function(t) { return t.category === category; });

  grid.innerHTML = tests.map(function(test) {
    var activeClass = STATE.activeChartType === test.id ? ' active' : '';
    return '<div class="method-card' + activeClass + '" data-test="' + test.id + '">' +
      '<strong>' + escapeHtml(test.name) + '</strong>' +
    '</div>';
  }).join('');

  domAll('.method-card', grid).forEach(function(card) {
    card.addEventListener('click', function() {
      var testId = card.dataset.test;
      selectMethod(testId);
    });
  });
  updateMethodDetail();
}

function selectMethod(testId) {
  STATE.activeChartType = testId;
  var config = getTestConfig(testId);
  if (config && config.exampleDataset) { STATE.datasetName = config.exampleDataset; }

  // Reset results
  STATE.currentResult = null;
  STATE.currentStatResult = null;
  STATE.currentStatChartData = null;
  STATE.currentPlotlyData = null;
  STATE.currentPlotlyLayout = null;
  STATE.currentTables = null;
  STATE.currentDiscussion = null;
  STATE.currentTableData = null;
  STATE.userTraceColorsByChart = {};
  STATE.userColors = null;
  APP.chartVariants = [];
  APP.activeChartVariant = 0;

  // Reset method params
  STATE.methodParams = {};
  getResolvedTestParams(testId).forEach(function(p) { STATE.methodParams[p.key] = p.default; });

  // Redraw left panel method grid with selection
  renderMethodGrid(STATE.activeChartCategory);
  // Redraw right side method detail
  updateMethodDetail();
  updateDataMethodCard();
  updateVariableMethodCard();
  enableNextIfReady();
}

function updateMethodDetail() {
  var detail = dom('methodDetail');
  var config = STATE.activeChartType ? getTestConfig(STATE.activeChartType) : null;
  if (detail) {
    if (config) {
      var formulaDef = BASIC_METHOD_FORMULAS[config.id] || formula('通用统计表达', 'Statistic = f(data, variables, parameters)', '系统会根据当前变量角色、数据类型和参数生成对应统计结果。');
      var intro = METHOD_INTROS[config.id] || config.description || '选择变量后，系统会根据该统计方案完成检验、图表、统计结果和结果解读。';
      detail.innerHTML =
        '<article class="method-detail-card">' +
          '<p class="method-detail-kicker">当前统计方法</p>' +
          '<h1 id="method-title">' + escapeHtml(config.name) + '</h1>' +
          '<section class="method-detail-block">' +
            '<h2>基本概念</h2>' +
            '<p>' + escapeHtml(intro) + '</p>' +
          '</section>' +
          '<section class="method-detail-block">' +
            '<h2>核心公式</h2>' +
            renderFormulaBox(formulaDef) +
          '</section>' +
          '<section class="method-detail-block">' +
            '<h2>概念图</h2>' +
            renderConceptGraphic(config) +
          '</section>' +
        '</article>';
    } else {
      detail.innerHTML = '<div class="method-detail-empty"><span>方法概览</span><h1>请选择一个统计方法</h1></div>';
    }
  }
}

function renderFormulaBox(item) {
  return '<div class="formula-box">' +
    '<strong>' + escapeHtml(item.title || '核心公式') + '</strong>' +
    '<div class="formula-scroll"><div class="formula-math">' + escapeHtml(item.math || '') + '</div></div>' +
    (item.note ? '<p>' + escapeHtml(item.note) + '</p>' : '') +
  '</div>';
}

function renderConceptGraphic(config) {
  var type = METHOD_CONCEPT_TYPES[config.id] || methodConceptType(config.id);
  var labels = METHOD_CONCEPT_LABELS[config.id] || BASIC_METHOD_CONCEPTS[type] || BASIC_METHOD_CONCEPTS[methodConceptType(config.id)] || BASIC_METHOD_CONCEPTS.grouped;
  return '<div class="concept-map concept-map-' + escapeHtml(type) + '">' +
    renderConceptSvg(type, labels) +
    '<div class="concept-caption-row">' + labels.map(function(label) { return '<span>' + escapeHtml(label) + '</span>'; }).join('') + '</div>' +
  '</div>';
}

function renderConceptSvg(type, labels) {
  var l0 = labels[0] || '数据';
  var l1 = labels[1] || '模型';
  var l2 = labels[2] || '结果';
  var defs = '<defs>' +
    '<linearGradient id="conceptLine" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#2f6df6"></stop><stop offset="100%" stop-color="#0ea5a4"></stop></linearGradient>' +
    '<linearGradient id="conceptBlue" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f2f7ff"></stop><stop offset="100%" stop-color="#bfd4ff"></stop></linearGradient>' +
    '<linearGradient id="conceptMint" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#ecfeff"></stop><stop offset="100%" stop-color="#99f6e4"></stop></linearGradient>' +
    '<marker id="arrowHead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#2563eb"></path></marker>' +
  '</defs>';
  var node = function(x, y, text, klass) {
    return '<g class="svg-node ' + (klass || '') + '"><rect x="' + (x - 38) + '" y="' + (y - 18) + '" width="76" height="36" rx="8"></rect><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle">' + escapeHtml(text) + '</text></g>';
  };
  var svgOpen = '<svg class="concept-svg" viewBox="0 0 260 168" role="img" aria-hidden="true">';
  var svgClose = '</svg>';

  if (type === 'normality') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M42 132H226"></path><path class="svg-axis" d="M42 132V30"></path>' +
      '<path class="svg-dash" d="M54 120L218 38"></path>' +
      [58,78,98,118,138,158,178,198,218].map(function(x, i) {
        var y = 122 - i * 10 + [6,-3,4,-5,2,-4,5,-2,3][i];
        return '<circle class="svg-dot" cx="' + x + '" cy="' + y + '" r="4"></circle>';
      }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'correlation') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M42 132H226"></path><path class="svg-axis" d="M42 132V30"></path>' +
      '<path class="svg-curve" d="M54 120 C92 104 118 84 154 70 S208 46 226 34"></path>' +
      [60,82,104,126,148,170,192,214].map(function(x, i) { return '<circle class="svg-dot" cx="' + x + '" cy="' + (118 - i * 10 + (i % 2 ? 8 : -4)) + '" r="4"></circle>'; }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'survival') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M34 132H230"></path><path class="svg-axis" d="M44 136V30"></path>' +
      '<path class="svg-step" d="M48 44H82V62H116V82H154V100H196V122H226"></path>' +
      '<path class="svg-step two" d="M48 38H94V52H136V74H174V92H218V114"></path>' +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l2) + '</text>' +
    svgClose;
  }
  if (type === 'sigmoid') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M38 132H230"></path><path class="svg-axis" d="M44 136V28"></path>' +
      '<path class="svg-curve" d="M50 124 C84 124 94 116 112 92 S142 42 176 42 S212 42 226 36"></path>' +
      '<line class="svg-threshold" x1="44" y1="84" x2="226" y2="84"></line>' +
      node(72, 42, l0, 'source') + node(188, 126, l2, 'target') +
    svgClose;
  }
  if (type === 'regression') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M38 132H228"></path><path class="svg-axis" d="M44 136V30"></path>' +
      '<path class="svg-curve two" d="M54 118 C86 106 112 92 146 72 S196 48 222 38"></path>' +
      [62,82,104,128,150,172,194,216].map(function(x, i) {
        return '<circle class="svg-dot" cx="' + x + '" cy="' + (116 - i * 10 + (i % 2 ? 7 : -5)) + '" r="4"></circle>';
      }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'discriminant') {
    return svgOpen + defs +
      '<ellipse class="svg-cluster" cx="86" cy="78" rx="42" ry="30"></ellipse>' +
      '<ellipse class="svg-cluster two" cx="176" cy="92" rx="42" ry="32"></ellipse>' +
      '<path class="svg-margin" d="M132 32 C124 68 128 104 116 138"></path>' +
      [58,72,88,104,116].map(function(x, i) { return '<circle class="svg-point-a" cx="' + x + '" cy="' + (72 + (i % 3) * 11) + '" r="4"></circle>'; }).join('') +
      [154,168,184,198,208].map(function(x, i) { return '<circle class="svg-point-b" cx="' + x + '" cy="' + (84 + (i % 3) * 12) + '" r="4"></circle>'; }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'adjusted') {
    return svgOpen + defs +
      node(62, 52, l0, 'source') +
      node(132, 112, l1, 'model') +
      node(202, 52, l2, 'target') +
      '<path class="svg-arrow" d="M94 60 C112 70 118 88 126 96"></path>' +
      '<path class="svg-arrow" d="M170 96 C178 86 184 70 190 62"></path>' +
      '<path class="svg-curve two" d="M52 138 C92 126 166 126 208 138"></path>' +
    svgClose;
  }
  if (type === 'variance') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M38 132H226"></path>' +
      '<path class="svg-band" d="M48 116 C70 58 104 58 126 116 Z"></path>' +
      '<path class="svg-band two" d="M134 116 C158 46 198 46 222 116 Z"></path>' +
      '<path class="svg-curve" d="M48 116 C70 58 104 58 126 116"></path>' +
      '<path class="svg-curve two" d="M134 116 C158 46 198 46 222 116"></path>' +
      '<text class="svg-label" x="88" y="148" text-anchor="middle">' + escapeHtml(l0) + '</text>' +
      '<text class="svg-label" x="178" y="148" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'rank') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M36 132H228"></path>' +
      [50,74,98,122,146,170,194,218].map(function(x, i) {
        return '<rect class="svg-bar-fill" x="' + (x - 6) + '" y="' + (122 - i * 8) + '" width="12" height="' + (10 + i * 8) + '" rx="3"></rect>';
      }).join('') +
      '<path class="svg-arrow" d="M58 44 C104 26 162 28 210 52"></path>' +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'categorical') {
    return svgOpen + defs +
      '<rect class="svg-table" x="52" y="38" width="156" height="92" rx="8"></rect>' +
      '<path class="svg-axis" d="M52 68H208M52 99H208M104 38V130M156 38V130"></path>' +
      node(70, 148, l0, 'source') + node(190, 148, l2, 'target') +
    svgClose;
  }
  if (type === 'paired') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M50 132H214"></path>' +
      [50,84,118,152,186].map(function(x, i) {
        var y1 = 110 - (i % 2) * 20;
        var y2 = 82 - (i % 3) * 12;
        return '<path class="svg-dash" d="M' + x + ' ' + y1 + 'L' + (x + 22) + ' ' + y2 + '"></path><circle class="svg-dot" cx="' + x + '" cy="' + y1 + '" r="4"></circle><circle class="svg-dot alt" cx="' + (x + 22) + '" cy="' + y2 + '" r="4"></circle>';
      }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'paired_categorical') {
    return svgOpen + defs +
      '<rect class="svg-table" x="58" y="36" width="144" height="92" rx="8"></rect>' +
      '<path class="svg-axis" d="M58 82H202M130 36V128"></path>' +
      '<path class="svg-arrow" d="M86 58 C110 42 150 42 174 58"></path>' +
      '<path class="svg-arrow" d="M174 106 C150 122 110 122 86 106"></path>' +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l1) + '</text>' +
    svgClose;
  }
  if (type === 'longitudinal') {
    return svgOpen + defs +
      '<path class="svg-axis" d="M34 132H230"></path><path class="svg-axis" d="M44 136V28"></path>' +
      '<path class="svg-curve" d="M50 116 C86 92 116 104 148 70 S202 58 224 38"></path>' +
      '<path class="svg-curve two" d="M50 126 C86 112 116 82 150 92 S202 72 224 62"></path>' +
      '<path class="svg-curve three" d="M50 96 C86 88 112 68 150 58 S202 46 224 30"></path>' +
      [50,94,138,182,224].map(function(x) { return '<circle class="svg-dot" cx="' + x + '" cy="132" r="3"></circle>'; }).join('') +
      '<text class="svg-label" x="132" y="154" text-anchor="middle">' + escapeHtml(l2) + '</text>' +
    svgClose;
  }
  return svgOpen + defs +
    node(58, 84, l0, 'source') +
    node(132, 84, l1, 'model') +
    node(206, 84, l2, 'target') +
    '<path class="svg-arrow" d="M96 84H120"></path><path class="svg-arrow" d="M170 84H194"></path>' +
    '<path class="svg-ci" d="M64 126 C98 112 164 112 198 126"></path>' +
  svgClose;
}

function updateDataMethodCard() {
  var el = dom('dataMethodName');
  if (!el) return;
  var config = STATE.activeChartType ? getTestConfig(STATE.activeChartType) : null;
  el.textContent = config ? config.name : '尚未选择方法';
}

function updateVariableMethodCard() {
  var el = dom('variableMethodName');
  if (!el) return;
  var config = STATE.activeChartType ? getTestConfig(STATE.activeChartType) : null;
  el.textContent = config ? config.name : '尚未选择方法';
}

function enableNextIfReady() {
  var btn = dom('methodNextBtn');
  if (btn) btn.disabled = !STATE.activeChartType;
}

/* ── Variables & Params (Step 3) ────────────────────────── */
function renderVariableControls() {
  var container = dom('roleControls');
  if (!container) return;
  if (!STATE.columns || STATE.columns.length === 0) {
    container.innerHTML = '<div class="empty-state small">请先在步骤2中加载或上传数据。</div>';
    return;
  }
  var config = STATE.activeChartType ? getTestConfig(STATE.activeChartType) : null;
  if (!config) {
    container.innerHTML = '<div class="empty-state small">请先在步骤1中选择统计方法。</div>';
    return;
  }

  var allCols = STATE.columns;
  var colOptions = allCols.map(function(c) { return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>'; }).join('');

  function defResearch() {
    if (typeof getTestDefaultParams === 'function') {
      var defs = getTestDefaultParams(STATE.activeChartType);
      var candidates = [];
      if (defs.x_var && allCols.indexOf(defs.x_var) >= 0) candidates.push(defs.x_var);
      if (defs.group_var && allCols.indexOf(defs.group_var) >= 0) candidates.push(defs.group_var);
      if (defs.treatment_var && allCols.indexOf(defs.treatment_var) >= 0) candidates.push(defs.treatment_var);
      if (defs.time_var && allCols.indexOf(defs.time_var) >= 0) candidates.push(defs.time_var);
      if (!candidates.length && defs.y_var && allCols.indexOf(defs.y_var) >= 0) candidates.push(defs.y_var);
      return candidates;
    }
    return [];
  }
  function defOutcomes() {
    if (typeof getTestDefaultParams === 'function') {
      var defs = getTestDefaultParams(STATE.activeChartType);
      var candidates = [];
      if (defs.y_var && allCols.indexOf(defs.y_var) >= 0) candidates.push(defs.y_var);
      if (defs['var'] && allCols.indexOf(defs['var']) >= 0) candidates.push(defs['var']);
      if (defs.outcome_var && allCols.indexOf(defs.outcome_var) >= 0) candidates.push(defs.outcome_var);
      if (defs.paired_var && allCols.indexOf(defs.paired_var) >= 0) candidates.push(defs.paired_var);
      if (defs.event_var && allCols.indexOf(defs.event_var) >= 0) candidates.push(defs.event_var);
      return candidates;
    }
    return [];
  }
  function defCovars() {
    if (typeof getTestDefaultParams === 'function') {
      var defs = getTestDefaultParams(STATE.activeChartType);
      var candidates = [];
      if (defs.subject_var && allCols.indexOf(defs.subject_var) >= 0) candidates.push(defs.subject_var);
      if (defs.covar && allCols.indexOf(defs.covar) >= 0) candidates.push(defs.covar);
      if (defs.x_vars && Array.isArray(defs.x_vars)) defs.x_vars.forEach(function(v) { if (allCols.indexOf(v) >= 0) candidates.push(v); });
      if (defs.value_vars && Array.isArray(defs.value_vars)) defs.value_vars.forEach(function(v) { if (allCols.indexOf(v) >= 0) candidates.push(v); });
      return candidates;
    }
    return [];
  }

  var researchDefaults = defResearch();
  var outcomeDefaults = defOutcomes();
  var covarDefaults = defCovars();
  var savedRecommendations = (STATE.methodRoleRecommendations && STATE.methodRoleRecommendations[STATE.activeChartType]) || null;
  if (savedRecommendations) {
    researchDefaults = savedRecommendations.research_vars || researchDefaults;
    outcomeDefaults = savedRecommendations.outcome_vars || outcomeDefaults;
    covarDefaults = savedRecommendations.covar_vars || covarDefaults;
  }

  var html = '';

  // 研究变量 (exposure / grouping / predictor)
  html += '<div class="role-box"><span>研究变量</span><small>（分组 / 处理 / 预测因子）</small>';
  html += '<select class="role-select" data-role="research_vars" multiple style="min-height:70px">' + colOptions + '</select>';
  html += '</div>';

  // 协变量 / 混杂因素
  html += '<div class="role-box"><span>协变量 / 混杂因素</span><small>（校正变量 / 受试者 ID / 附加预测）</small>';
  html += '<select class="role-select" data-role="covar_vars" multiple style="min-height:70px">' + colOptions + '</select>';
  html += '</div>';

  // 结局变量
  html += '<div class="role-box"><span>结局变量</span><small>（响应 / 配对第二指标 / 生存时间-事件对）</small>';
  html += '<select class="role-select" data-role="outcome_vars" multiple style="min-height:70px">' + colOptions + '</select>';
  html += '</div>';

  container.innerHTML = html;

  setRoleSelections({
    research_vars: researchDefaults,
    outcome_vars: outcomeDefaults,
    covar_vars: covarDefaults,
  }, container);
}

function setRoleSelections(roles, root) {
  var container = root || dom('roleControls');
  if (!container || !roles) return false;
  var didApply = false;
  domAll('.role-select', container).forEach(function(sel) {
    var role = sel.dataset.role;
    var values = [];
    if (role === 'research_vars') values = roles.research_vars || [];
    else if (role === 'outcome_vars') values = roles.outcome_vars || [];
    else if (role === 'covar_vars') values = roles.covar_vars || [];
    values = values.filter(Boolean);
    for (var i = 0; i < sel.options.length; i++) {
      var shouldSelect = values.indexOf(sel.options[i].value) >= 0;
      sel.options[i].selected = shouldSelect;
      if (shouldSelect) didApply = true;
    }
  });
  return didApply;
}

/* helper to convert 3-role selections into backend request vars */
function collectAnalysisVars() {
  var result = {};
  var allSelected = [];
  domAll('#roleControls .role-select').forEach(function(sel) {
    var role = sel.dataset.role;
    var vals = Array.from(sel.selectedOptions).map(function(o) { return o.value; }).filter(Boolean);
    if (role === 'research_vars') {
      allSelected = vals.concat(allSelected);
      result.group_var = vals[0] || null;
      result.x_var = vals[0] || null;
      result.time_var = vals.find(function(v) { return /time|survival|duration|天|月|时间|生存/i.test(v); }) || null;
      result.subject_var = vals.find(function(v) { return /id|subject|patient|受试|编号/i.test(v); }) || null;
      if (['logistic_regression', 'linear_regression', 'discriminant_analysis', 'quadratic_discriminant_analysis'].indexOf(STATE.activeChartType) >= 0) {
        result.x_vars = vals.slice();
        result.predictor_vars = vals.slice();
        result.group_var = null;
        result.x_var = null;
      }
    } else if (role === 'outcome_vars') {
      allSelected = vals.concat(allSelected);
      result.var = vals[0] || '';
      result.y_var = vals[0] || '';
      result.paired_var = vals[1] || null;
      result.event_var = vals.find(function(v) { return /event|death|status|outcome|结局|事件|死亡/i.test(v); }) || null;
    } else if (role === 'covar_vars') {
      allSelected = vals.concat(allSelected);
      result.covar = vals[0] || null;
      result.subject_var = result.subject_var || vals.find(function(v) { return /id|subject|patient|受试|编号/i.test(v); }) || null;
      if (['logistic_regression', 'linear_regression', 'discriminant_analysis', 'quadratic_discriminant_analysis'].indexOf(STATE.activeChartType) >= 0) {
        var currentPredictors = result.x_vars || [];
        result.x_vars = currentPredictors.concat(vals.filter(function(v) { return v !== result.subject_var; }));
        result.predictor_vars = result.x_vars.slice();
      } else {
        result.x_vars = vals.filter(function(v) { return v !== result.subject_var; });
      }
    }
  });
  if (result.x_vars) {
    result.x_vars = Array.from(new Set(result.x_vars.filter(Boolean)));
    result.predictor_vars = result.x_vars.slice();
  }
  return result;
}

function renderParamControls() {
  var container = dom('paramControls');
  var countLabel = dom('paramCountLabel');
  if (!container) return;

  var config = STATE.activeChartType ? getTestConfig(STATE.activeChartType) : null;
  if (!config || !STATE.activeChartType) {
    container.innerHTML = '<div class="empty-state small">选择方法后显示该方法可调参数。</div>';
    if (countLabel) countLabel.textContent = '0 项参数';
    return;
  }

  var paramDefs = getResolvedTestParams(STATE.activeChartType);

  if (!STATE.methodParams) STATE.methodParams = {};
  paramDefs.forEach(function(p) {
    if (!(p.key in STATE.methodParams)) STATE.methodParams[p.key] = p.default;
  });

  if (countLabel) countLabel.textContent = paramDefs.length + ' 项参数';

  if (paramDefs.length === 0) {
    container.innerHTML = '<div class="empty-state small">该方法没有可调节的参数。</div>';
    return;
  }

  container.innerHTML = paramDefs.map(function(p) {
    var currentVal = STATE.methodParams[p.key] != null ? STATE.methodParams[p.key] : p.default;
    var inputHtml = '';
    if (p.type === 'select') {
      inputHtml = '<select class="param-input" data-param-key="' + p.key + '" style="width:100%;min-height:32px;border:1px solid var(--line);border-radius:5px;padding:4px 6px;font-size:13px">' +
        (p.options || []).map(function(opt) {
          var sel = String(opt) === String(currentVal) ? ' selected' : '';
          return '<option value="' + escapeHtml(String(opt)) + '"' + sel + '>' + escapeHtml(String(opt)) + '</option>';
        }).join('') + '</select>';
    } else {
      var minAttr = p.min != null ? ' min="' + escapeHtml(String(p.min)) + '"' : '';
      var maxAttr = p.max != null ? ' max="' + escapeHtml(String(p.max)) + '"' : '';
      var stepAttr = p.step != null ? ' step="' + escapeHtml(String(p.step)) + '"' : ' step="any"';
      inputHtml = '<input type="number" class="param-input" data-param-key="' + p.key + '" value="' + escapeHtml(String(currentVal)) + '"' + minAttr + maxAttr + stepAttr + ' style="width:100%;min-height:32px;border:1px solid var(--line);border-radius:5px;padding:4px 6px;font-size:13px" />';
    }
    var noteHtml = p.note ? '<small>' + escapeHtml(p.note) + '</small>' : '';
    var labelEn = p.label_en ? '<em>' + escapeHtml(p.label_en) + '</em>' : '';
    return '<div class="param-label"><strong>' + escapeHtml(p.label || p.key) + '</strong>' + labelEn + inputHtml + noteHtml + '</div>';
  }).join('');

  domAll('.param-input', container).forEach(function(input) {
    input.addEventListener('change', function() {
      STATE.methodParams[input.dataset.paramKey] = input.type === 'number' && input.value !== '' ? Number(input.value) : input.value;
    });
    input.addEventListener('input', function() {
      STATE.methodParams[input.dataset.paramKey] = input.type === 'number' && input.value !== '' ? Number(input.value) : input.value;
    });
  });
}

function getResolvedTestParams(testId) {
  if (!testId) return [];
  if (STATE.methodParamsCatalog && Array.isArray(STATE.methodParamsCatalog[testId])) {
    return STATE.methodParamsCatalog[testId];
  }
  if (typeof getTestParams === 'function') return getTestParams(testId);
  return [];
}

async function loadBackendParamCatalog() {
  try {
    var payload = await apiGet('/api/test-params');
    STATE.methodParamsCatalog = payload.test_params || {};
    if (STATE.activeChartType) {
      renderParamControls();
    }
  } catch (e) {
    console.warn('参数目录加载失败，使用前端内置参数。', e);
  }
}

/* ── Analysis Execution ─────────────────────────────────── */
async function runAnalysis() {
  if (!STATE.activeChartType) { showToast('请先选择统计方法', 'warning'); return; }
  if (!STATE.columns || STATE.columns.length === 0) { showToast('请先加载数据', 'warning'); return; }

  var btn = dom('generateBtn');
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '分析中...'; }

  try {
    var vars = collectAnalysisVars();

    var body = {
      test_type: STATE.activeChartType,
      var: vars.var || vars.y_var || '',
      group_var: vars.group_var || vars.x_var || null,
      paired_var: vars.paired_var || null,
      time_var: vars.time_var || null,
      event_var: vars.event_var || null,
      subject_var: vars.subject_var || null,
      covar: vars.covar || null,
      x_vars: vars.x_vars || null,
      predictor_vars: vars.predictor_vars || null,
      post_hoc: STATE.postHocMethod || null,
      params: STATE.methodParams || {},
      use_demo: !STATE.uploadId,
      dataset_name: STATE.datasetName || 'comprehensive_example',
      upload_id: STATE.uploadId || null,
    };

    var data = await apiPost('/api/analyze', body);

    if (data.status === 'error') { showToast(data.message || '分析失败', 'error'); if (btn) { btn.disabled = false; btn.textContent = origText; } return; }

    STATE.currentResult = data.result;
    STATE.currentStatResult = data.result;
    STATE.currentStatChartData = data.result ? data.result.chart_data : null;
    STATE.currentDiscussion = data.discussion || null;
    STATE.currentTables = data.tables || null;
    STATE.currentTableData = data.tables ? data.tables.result : null;
    STATE.userTraceColorsByChart = {};
    STATE.userColors = null;

    APP.lastResult = data;
    activateStep('result');
    renderResults(data);
    showToast('分析完成！', 'success');
  } catch (e) {
    showToast('分析失败: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '开始分析'; }
  }
}

/* ── Result Rendering ───────────────────────────────────── */
function renderResults(data) {
  var summary = dom('resultSummary');
  if (summary && data.result) {
    summary.innerHTML = '<p style="font-size:15px;font-weight:800;color:#142238">' + escapeHtml(data.result.test_name || '') + ' — ' + escapeHtml(data.result.summary || '') + '</p>';
  }

  renderResultTables(data);
  renderDiscussion(data);

  if (data.result && data.result.chart_data) {
    renderStatChart(data.result, data.result);
  } else {
    var chartPlot = dom('chartActivePlot');
    if (chartPlot) chartPlot.innerHTML = '<div class="empty-state small">该分析结果无可视化图形。</div>';
  }
}

function renderStatChart(resultOrChartData, fullResult) {
  var container = dom('chartActivePlot');
  if (!container) return;
  if (!window.Plotly) {
    container.innerHTML = '<div class="empty-state small">Plotly 库未加载。</div>';
    return;
  }

  var result = resultOrChartData && resultOrChartData.test_type
    ? resultOrChartData
    : (STATE.currentStatResult || { test_type: STATE.activeChartType, test_name: '统计图形', chart_data: resultOrChartData || {} });
  var chartData = result.chart_data || resultOrChartData || {};
  if (!chartData || !chartData.chart_type) {
    container.innerHTML = '<div class="empty-state small">该分析结果无可视化图形。</div>';
    return;
  }

  var rawData = {};
  try {
    rawData = typeof buildDataFromState === 'function' ? buildDataFromState() : {};
  } catch (e) {
    rawData = {};
  }
  var params = collectAnalysisVars();
  var titleInput = dom('chartTitleInput');
  var titleText = (titleInput && titleInput.value ? titleInput.value.trim() : '') || chartData.title || result.test_name || '统计图形';
  var backendPlot = typeof buildStatPlotFromChartData === 'function' ? buildStatPlotFromChartData(chartData, titleText) : null;

  var traces = backendPlot ? (backendPlot.traces || []) : [];
  var layout = backendPlot ? (backendPlot.layout || { title: { text: titleText } }) : { title: { text: titleText } };
  var chartType = backendPlot ? (backendPlot.chartType || result.test_type) : result.test_type;

  if (!traces.length && chartData.coefs_bar) {
    var cb = chartData.coefs_bar;
    traces = [{
      type: 'bar',
      orientation: 'h',
      y: cb.names || [],
      x: cb.values || [],
      name: result.test_type === 'logistic_regression' ? 'OR / β' : 'β',
      meta: { colorIndex: 0 },
    }];
    layout = { title: { text: cb.title || titleText }, xaxis: { title: { text: '标准化系数' } }, yaxis: { title: { text: '变量' }, automargin: true } };
    chartType = 'bar';
  }

  var variants = [];
  if (typeof buildStatChartVariants === 'function') {
    variants = buildStatChartVariants(cloneForChart(traces), cloneForChart(layout), chartType, result, rawData, params);
  }
  if (!variants.length && traces.length) {
    variants = [{ label: '主图', title: titleText, chartType: chartType, traces: cloneForChart(traces), layout: cloneForChart(layout) }];
  }
  if (!variants.length) {
    container.innerHTML = '<div class="empty-state small">当前结果没有可绘制的数据。</div>';
    return;
  }

  APP.chartVariants = variants;
  APP.activeChartVariant = 0;
  STATE.statChartVariants = variants;
  STATE.activeStatChartVariantIndex = 0;
  renderChartVariantTabs();
  renderActiveStatVariant();
}

function cloneForChart(value) {
  try { return JSON.parse(JSON.stringify(value || null)); }
  catch (e) { return value; }
}

function renderChartVariantTabs() {
  var tabsContainer = dom('chartVariantTabs');
  var variants = APP.chartVariants || [];
  if (!tabsContainer) return;
  if (variants.length <= 1) {
    tabsContainer.innerHTML = '';
    return;
  }
  tabsContainer.innerHTML = variants.map(function(v, i) {
    var label = v.label || v.title || ('图形 ' + (i + 1));
    return '<button class="chart-variant-tab' + (i === (APP.activeChartVariant || 0) ? ' active' : '') + '" data-variant-idx="' + i + '" type="button">' + escapeHtml(label) + '</button>';
  }).join('');
  domAll('.chart-variant-tab', tabsContainer).forEach(function(tab) {
    tab.addEventListener('click', function() {
      APP.activeChartVariant = parseInt(tab.dataset.variantIdx, 10) || 0;
      STATE.activeStatChartVariantIndex = APP.activeChartVariant;
      domAll('.chart-variant-tab', tabsContainer).forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderActiveStatVariant();
    });
  });
}

function renderActiveStatVariant() {
  var container = dom('chartActivePlot');
  var variants = APP.chartVariants || [];
  var variant = variants[APP.activeChartVariant || 0];
  if (!container || !variant || !window.Plotly) return;

  var oldPlot = container.querySelector('.js-plotly-plot');
  if (oldPlot) Plotly.purge(oldPlot);
  container.innerHTML = '';

  var rawTraces = cloneForChart(variant.traces || []);
  var rawLayout = cloneForChart(variant.layout || {});
  var chartType = variant.chartType || STATE.currentChartKind || 'scatter';
  var theme = typeof getActiveTheme === 'function' ? getActiveTheme() : (CHART_THEMES ? CHART_THEMES[STATE.chartTheme || 'cnsTheme'] : {});
  var traceColors = getSavedAppearanceColors();
  STATE.userColors = traceColors.length ? traceColors : null;
  STATE.currentChartKind = chartType;
  STATE.currentPlotlyDataRaw = cloneForChart(rawTraces);
  STATE.currentPlotlyLayoutRaw = cloneForChart(rawLayout);

  var traces = cloneForChart(rawTraces);
  var layout = cloneForChart(rawLayout);
  if (typeof polishTracesForPublication === 'function') traces = polishTracesForPublication(traces, theme);
  traces = applyDirectAppearanceToTraces(traces);
  if (typeof applyThemeLayout === 'function') layout = applyThemeLayout(layout, theme);
  layout = applyDirectAppearanceToLayout(layout, chartType, theme);

  var size = getResultChartSize(container, chartType);
  layout.width = size.width;
  layout.height = size.height;
  layout.autosize = false;

  var plotDiv = document.createElement('div');
  plotDiv.className = 'chart-plot';
  plotDiv.style.width = size.width + 'px';
  plotDiv.style.height = size.height + 'px';
  container.appendChild(plotDiv);

  STATE.currentPlotlyData = traces;
  STATE.currentPlotlyLayout = layout;

  Plotly.newPlot(plotDiv, traces, layout, {
    responsive: false,
    displaylogo: false,
    displayModeBar: false,
    staticPlot: false,
  }).then(function() {
    renderAppearanceControls();
  }).catch(function(e) {
    container.innerHTML = '<div class="empty-state small">渲染出错: ' + escapeHtml(e.message) + '</div>';
  });
}

function getSavedAppearanceColors() {
  var idx = APP.activeChartVariant || 0;
  var byChart = STATE.userTraceColorsByChart || {};
  var colors = byChart[idx] || [];
  return Array.isArray(colors) ? colors.filter(Boolean) : [];
}

function isColorString(value) {
  return typeof value === 'string' && (value.indexOf('#') === 0 || value.indexOf('rgb') === 0 || /^[a-z]+$/i.test(value));
}

function toColorInputValue(value, fallback) {
  var color = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return '#' + color.slice(1).split('').map(function(ch) { return ch + ch; }).join('');
  }
  var rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return '#' + [rgb[1], rgb[2], rgb[3]].map(function(n) {
      var h = Math.max(0, Math.min(255, Number(n))).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }
  return fallback || '#2E6F9E';
}

function colorFromScale(colorscale, fallbackIndex) {
  if (!Array.isArray(colorscale) || !colorscale.length) return null;
  var idx = fallbackIndex === 0 ? 0 : colorscale.length - 1;
  var item = colorscale[idx];
  if (Array.isArray(item)) return item[1] || null;
  return item || null;
}

function getFallbackPaletteColor(index) {
  var theme = typeof getActiveTheme === 'function' ? getActiveTheme() : {};
  var pal = typeof getActivePalette === 'function' ? getActivePalette() : null;
  var base = pal || theme.colorway || ['#2E6F9E', '#D95F59', '#2A9D8F', '#E9A93A', '#6F5AA7'];
  return base[index % base.length];
}

function getAppearanceControlColors(context, rawTraces) {
  var saved = getSavedAppearanceColors();
  var targets = (context && context.targets) || [];
  if (saved.length) {
    return targets.map(function(_, idx) { return saved[idx] || getFallbackPaletteColor(idx); });
  }
  return targets.map(function(target, idx) {
    var trace = rawTraces[target.traceIndex] || {};
    if (target.mode === 'scale') {
      return colorFromScale(trace.colorscale || (trace.marker && trace.marker.colorscale), target.pointIndex) || getFallbackPaletteColor(idx);
    }
    if (target.mode === 'point') {
      var markerColor = trace.marker && trace.marker.color;
      if (Array.isArray(markerColor) && isColorString(markerColor[target.pointIndex])) return markerColor[target.pointIndex];
      if (isColorString(markerColor)) return markerColor;
      return getFallbackPaletteColor(idx);
    }
    var c = trace.marker && trace.marker.color;
    if (Array.isArray(c)) c = c.find(isColorString);
    return (isColorString(c) && c) || (trace.line && isColorString(trace.line.color) && trace.line.color) || getFallbackPaletteColor(idx);
  });
}

function applyDirectAppearanceToTraces(traces) {
  return (traces || []).map(function(trace) {
    var t = Object.assign({}, trace || {});
    var type = String(t.type || '').toLowerCase();
    if (type === 'scatter' || type === 'scatterpolar' || type === 'scattergeo') {
      var mode = String(t.mode || '');
      if (!t.marker) t.marker = {};
      if (!t.line) t.line = {};
      if (mode.indexOf('markers') >= 0 || !mode || type !== 'scatter') {
        if (STATE.markerSize != null) t.marker.size = Number(STATE.markerSize);
        if (STATE.markerOpacity != null) t.marker.opacity = Number(STATE.markerOpacity);
        if (STATE.markerShape) t.marker.symbol = STATE.markerShape;
      }
      if (mode.indexOf('lines') >= 0 || type === 'scatterpolar') {
        if (STATE.lineWidth != null) t.line.width = Number(STATE.lineWidth);
        if (STATE.lineDash) t.line.dash = STATE.lineDash;
      }
    }
    if (type === 'bar' || type === 'barpolar') {
      if (STATE.markerOpacity != null) t.marker = Object.assign({}, t.marker || {}, { opacity: Number(STATE.markerOpacity) });
      if (STATE.barWidth != null && type === 'bar') t.width = Number(STATE.barWidth);
    }
    if (type === 'histogram' && STATE.histogramBins != null) {
      t.nbinsx = Number(STATE.histogramBins);
    }
    if (type === 'box') {
      t.boxpoints = STATE.boxPoints || false;
      if (STATE.markerSize != null) t.marker = Object.assign({}, t.marker || {}, { size: Number(STATE.markerSize) });
    }
    if (type === 'violin') {
      t.points = STATE.violinPoints || false;
      if (STATE.markerSize != null) t.marker = Object.assign({}, t.marker || {}, { size: Number(STATE.markerSize) });
    }
    if ((type === 'pie' || type === 'sunburst') && STATE.pieHole != null) {
      t.hole = Number(STATE.pieHole);
    }
    if (type === 'sankey') {
      if (STATE.sankeyNodePad != null) t.node = Object.assign({}, t.node || {}, { pad: Number(STATE.sankeyNodePad) });
      if (STATE.sankeyNodeThickness != null) t.node = Object.assign({}, t.node || {}, { thickness: Number(STATE.sankeyNodeThickness) });
    }
    if ((type === 'heatmap' || type === 'contour') && STATE.heatmapColorscale) {
      t.colorscale = STATE.heatmapColorscale;
    }
    return t;
  });
}

function applyDirectAppearanceToLayout(layout, chartType, theme) {
  var l = Object.assign({}, layout || {});
  if (typeof polishLayoutForPublication === 'function') {
    l = polishLayoutForPublication(l, chartType, theme || {});
  }
  if (STATE.chartTitle) {
    var title = typeof l.title === 'string' ? { text: l.title } : Object.assign({}, l.title || {});
    title.text = STATE.chartTitle;
    l.title = title;
  }
  if (STATE.chartTitleFontSize) {
    var titleObj = typeof l.title === 'string' ? { text: l.title } : Object.assign({}, l.title || {});
    titleObj.font = Object.assign({}, titleObj.font || {}, { size: Number(STATE.chartTitleFontSize) });
    l.title = titleObj;
  }
  if (STATE.barGap != null) l.bargap = Number(STATE.barGap);
  if (STATE.chartGridMode === 'none') {
    Object.keys(l).forEach(function(key) {
      if (/^xaxis\d*$|^yaxis\d*$/.test(key)) l[key] = Object.assign({}, l[key] || {}, { showgrid: false });
    });
  }
  if (STATE.chartGridColor) {
    Object.keys(l).forEach(function(key) {
      if (/^xaxis\d*$|^yaxis\d*$/.test(key)) l[key] = Object.assign({}, l[key] || {}, { gridcolor: STATE.chartGridColor });
    });
  }
  return l;
}

function getResultChartSize(container, chartType) {
  var customW = Number(STATE.chartWidth);
  var customH = Number(STATE.chartHeight);
  if (customW > 0 && customH > 0) {
    return { width: Math.round(customW), height: Math.round(customH) };
  }
  return { width: 760, height: 600 };
}

function renderAppearanceControls() {
  var panel = dom('appearanceControls');
  if (!panel) return;
  var rawTraces = STATE.currentPlotlyDataRaw || [];
  if (!rawTraces.length) {
    panel.innerHTML = '<div class="empty-state small">生成图形后可调节点、线、柱、颜色和尺寸。</div>';
    return;
  }
  var context = typeof getCurrentAppearanceContext === 'function'
    ? getCurrentAppearanceContext(STATE.currentChartKind)
    : { chartKind: 'generic', styleOptions: [], targets: [] };
  STATE.currentAppearanceContext = context;
  var colors = getAppearanceControlColors(context, rawTraces);
  var hasMarkers = rawTraces.some(function(t) { return ['scatter', 'scatterpolar', 'scattergeo', 'box', 'violin'].indexOf(String(t.type || '').toLowerCase()) >= 0; });
  var hasLines = rawTraces.some(function(t) { return String(t.mode || '').indexOf('lines') >= 0 || String(t.type || '').toLowerCase() === 'scatterpolar'; });
  var hasBars = rawTraces.some(function(t) { return ['bar', 'barpolar'].indexOf(String(t.type || '').toLowerCase()) >= 0; });
  var hasHist = rawTraces.some(function(t) { return String(t.type || '').toLowerCase() === 'histogram'; });
  var hasBox = rawTraces.some(function(t) { return String(t.type || '').toLowerCase() === 'box'; });
  var hasViolin = rawTraces.some(function(t) { return String(t.type || '').toLowerCase() === 'violin'; });
  var hasPie = rawTraces.some(function(t) { return ['pie', 'sunburst'].indexOf(String(t.type || '').toLowerCase()) >= 0; });
  var hasHeatmap = rawTraces.some(function(t) { return ['heatmap', 'contour'].indexOf(String(t.type || '').toLowerCase()) >= 0; });
  var hasSankey = rawTraces.some(function(t) { return String(t.type || '').toLowerCase() === 'sankey'; });
  var size = {
    width: Number(STATE.chartWidth) || 760,
    height: Number(STATE.chartHeight) || 600,
  };
  var html = '';
  html += '<div class="size-grid">' +
    '<label class="field field-tight"><span>图片宽度</span><input id="chartWidthInput" type="number" min="360" max="2400" step="10" value="' + escapeHtml(String(Math.round(size.width))) + '"></label>' +
    '<label class="field field-tight"><span>图片高度</span><input id="chartHeightInput" type="number" min="280" max="1800" step="10" value="' + escapeHtml(String(Math.round(size.height))) + '"></label>' +
    '<label class="check-field wide"><input id="chartSizeLink" type="checkbox"' + (APP.sizeLinked ? ' checked' : '') + '><span>联动宽高比例</span></label>' +
    '</div>';
  if (context.styleOptions && context.styleOptions.length) {
    html += '<label class="field field-tight"><span>视觉样式</span><select data-chart-state="chartVisualStyle">' +
      context.styleOptions.map(function(opt) {
        return '<option value="' + escapeHtml(opt.id) + '"' + (String(STATE.chartVisualStyle || 'solid') === String(opt.id) ? ' selected' : '') + '>' + escapeHtml(opt.label) + '</option>';
      }).join('') + '</select></label>';
  }
  html += '<div class="color-controls-section"><span class="color-controls-label">颜色联动</span><div class="color-buttons-grid">' +
    ((context.targets || []).length ? context.targets.map(function(target, idx) {
      return '<label class="color-row">' +
        '<span class="color-trace-name">' + escapeHtml(target.label || ('系列 ' + (idx + 1))) + '</span>' +
        '<input class="color-picker-input" type="color" data-color-index="' + idx + '" value="' + escapeHtml(toColorInputValue(colors[idx], getFallbackPaletteColor(idx))) + '">' +
      '</label>';
    }).join('') : '<div class="empty-state small">当前图形没有可单独调色的系列。</div>') +
    '</div><button type="button" class="text-btn appearance-reset-colors" id="resetTraceColorsBtn">恢复调色盘</button>' +
    '</div>';
  html += '<div class="compact-grid">' +
    '<label class="field field-tight"><span>标题字号</span><input type="number" min="10" max="40" step="1" data-chart-state="chartTitleFontSize" value="' + escapeHtml(String(STATE.chartTitleFontSize || 18)) + '"></label>' +
    '<label class="field field-tight"><span>网格线</span><select data-chart-state="chartGridMode"><option value="grid"' + ((STATE.chartGridMode || 'grid') === 'grid' ? ' selected' : '') + '>显示</option><option value="none"' + (STATE.chartGridMode === 'none' ? ' selected' : '') + '>隐藏</option></select></label>' +
    '</div>';
  if (hasMarkers || hasLines || hasBars || hasHist || hasBox || hasViolin || hasPie || hasHeatmap || hasSankey) {
    html += '<div class="compact-grid">';
    if (hasMarkers) {
      html += '<label class="field field-tight"><span>点大小</span><input type="number" min="3" max="28" step="1" data-chart-state="markerSize" value="' + escapeHtml(String(STATE.markerSize || 8)) + '"></label>' +
        '<label class="field field-tight"><span>点透明度</span><input type="number" min="0.2" max="1" step="0.05" data-chart-state="markerOpacity" value="' + escapeHtml(String(STATE.markerOpacity != null ? STATE.markerOpacity : 0.88)) + '"></label>' +
        '<label class="field field-tight"><span>点形状</span><select data-chart-state="markerShape"><option value="circle">圆点</option><option value="square">方形</option><option value="diamond">菱形</option><option value="triangle-up">三角</option><option value="circle-open">空心圆</option></select></label>';
    }
    if (hasLines) {
      html += '<label class="field field-tight"><span>线宽</span><input type="number" min="1" max="8" step="0.2" data-chart-state="lineWidth" value="' + escapeHtml(String(STATE.lineWidth || 2.5)) + '"></label>' +
        '<label class="field field-tight"><span>线型</span><select data-chart-state="lineDash"><option value="solid">实线</option><option value="dash">虚线</option><option value="dot">点线</option><option value="dashdot">点划线</option></select></label>';
    }
    if (hasBars) {
      html += '<label class="field field-tight"><span>柱宽</span><input type="number" min="0.15" max="0.9" step="0.05" data-chart-state="barWidth" value="' + escapeHtml(String(STATE.barWidth || 0.42)) + '"></label>' +
        '<label class="field field-tight"><span>柱间距</span><input type="number" min="0" max="0.7" step="0.05" data-chart-state="barGap" value="' + escapeHtml(String(STATE.barGap != null ? STATE.barGap : 0.24)) + '"></label>';
    }
    if (hasHist) html += '<label class="field field-tight"><span>直方图分箱</span><input type="number" min="5" max="80" step="1" data-chart-state="histogramBins" value="' + escapeHtml(String(STATE.histogramBins || 24)) + '"></label>';
    if (hasBox) html += '<label class="field field-tight"><span>箱线散点</span><select data-chart-state="boxPoints"><option value="">隐藏</option><option value="outliers">异常值</option><option value="all">全部点</option></select></label>';
    if (hasViolin) html += '<label class="field field-tight"><span>小提琴散点</span><select data-chart-state="violinPoints"><option value="">隐藏</option><option value="outliers">异常值</option><option value="all">全部点</option></select></label>';
    if (hasPie) html += '<label class="field field-tight"><span>环形孔径</span><input type="number" min="0" max="0.75" step="0.05" data-chart-state="pieHole" value="' + escapeHtml(String(STATE.pieHole || 0)) + '"></label>';
    if (hasHeatmap) html += '<label class="field field-tight"><span>热图色阶</span><select data-chart-state="heatmapColorscale"><option value="">跟随主题</option><option value="Viridis">Viridis</option><option value="Blues">Blues</option><option value="RdBu">RdBu</option><option value="YlGnBu">YlGnBu</option></select></label>';
    if (hasSankey) html += '<label class="field field-tight"><span>节点间距</span><input type="number" min="4" max="40" step="1" data-chart-state="sankeyNodePad" value="' + escapeHtml(String(STATE.sankeyNodePad || 15)) + '"></label>' +
      '<label class="field field-tight"><span>节点厚度</span><input type="number" min="6" max="40" step="1" data-chart-state="sankeyNodeThickness" value="' + escapeHtml(String(STATE.sankeyNodeThickness || 18)) + '"></label>';
    html += '</div>';
  }
  panel.innerHTML = html;
  syncSelectValue(panel, 'markerShape', STATE.markerShape || 'circle');
  syncSelectValue(panel, 'lineDash', STATE.lineDash || 'solid');
  syncSelectValue(panel, 'boxPoints', STATE.boxPoints || '');
  syncSelectValue(panel, 'violinPoints', STATE.violinPoints || '');
  syncSelectValue(panel, 'heatmapColorscale', STATE.heatmapColorscale || '');
  bindSizeControls(panel);
  bindAppearanceControls(panel);
}

function syncSelectValue(parent, stateKey, value) {
  var input = parent.querySelector('[data-chart-state="' + stateKey + '"]');
  if (input) input.value = value;
}

function bindAppearanceControls(panel) {
  domAll('[data-chart-state]', panel).forEach(function(input) {
    input.addEventListener('change', updateChartStateFromInput);
    input.addEventListener('input', updateChartStateFromInput);
  });
  domAll('[data-color-index]', panel).forEach(function(input) {
    input.addEventListener('input', updateTraceColorFromInput);
    input.addEventListener('change', updateTraceColorFromInput);
  });
  var reset = dom('resetTraceColorsBtn');
  if (reset) {
    reset.addEventListener('click', function() {
      if (!STATE.userTraceColorsByChart) STATE.userTraceColorsByChart = {};
      STATE.userTraceColorsByChart[APP.activeChartVariant || 0] = [];
      STATE.userColors = null;
      renderActiveStatVariant();
    });
  }
}

function bindSizeControls(panel) {
  var widthInput = dom('chartWidthInput');
  var heightInput = dom('chartHeightInput');
  var link = dom('chartSizeLink');
  if (!widthInput || !heightInput || !link) return;
  var applySize = function(source) {
    var width = Number(widthInput.value || STATE.chartWidth || 760);
    var height = Number(heightInput.value || STATE.chartHeight || 600);
    if (APP.sizeLinked) {
      if (source === 'width') {
        height = Math.round(width / Math.max(0.1, APP.chartAspect || (760 / 600)));
        heightInput.value = String(height);
      } else if (source === 'height') {
        width = Math.round(height * Math.max(0.1, APP.chartAspect || (760 / 600)));
        widthInput.value = String(width);
      }
    }
    STATE.chartWidth = width;
    STATE.chartHeight = height;
    renderActiveStatVariant();
  };
  link.addEventListener('change', function() {
    APP.sizeLinked = link.checked;
    APP.chartAspect = Number(widthInput.value || 760) / Math.max(1, Number(heightInput.value || 600));
  });
  widthInput.addEventListener('input', function() { applySize('width'); });
  heightInput.addEventListener('input', function() { applySize('height'); });
}

function updateChartStateFromInput(event) {
  var input = event.currentTarget;
  var key = input.dataset.chartState;
  if (!key) return;
  var value = input.value;
  if (input.type === 'number') value = value === '' ? null : Number(value);
  STATE[key] = value;
  renderActiveStatVariant();
}

function updateTraceColorFromInput(event) {
  var input = event.currentTarget;
  var idx = Number(input.dataset.colorIndex);
  if (!Number.isFinite(idx)) return;
  if (!STATE.userTraceColorsByChart) STATE.userTraceColorsByChart = {};
  var variantIdx = APP.activeChartVariant || 0;
  var colors = (STATE.userTraceColorsByChart[variantIdx] || []).slice();
  colors[idx] = input.value;
  STATE.userTraceColorsByChart[variantIdx] = colors;
  renderActiveStatVariant();
}

function renderResultTables(data) {
  var container = dom('resultTablesContainer');
  if (!container) return;
  var html = '';
  if (data.tables && data.tables.result) {
    var tbl = data.tables.result;
    html += '<div class="result-table-wrap"><div class="result-table-title">统计结果</div>' + buildMedicalTable(tbl) + '</div>';
  }
  if (data.tables && data.tables.group_stats) {
    var tbl2 = data.tables.group_stats;
    html += '<div class="result-table-wrap"><div class="result-table-title">分组统计</div>' + buildMedicalTable(tbl2) + '</div>';
  }
  if (data.tables && data.tables.post_hoc) {
    var tbl3 = data.tables.post_hoc;
    html += '<div class="result-table-wrap"><div class="result-table-title">事后检验</div>' + buildMedicalTable(tbl3) + '</div>';
  }
  container.innerHTML = html || '<div class="empty-state small">无表格数据。</div>';
}

function buildMedicalTable(tbl) {
  if (!tbl || !tbl.columns || !tbl.rows) return '<p>无数据</p>';
  var cols = Array.isArray(tbl.columns) ? tbl.columns : [tbl.columns || 'Value'];
  var h = '<table class="medical-table"><thead><tr>';
  cols.forEach(function(c) { h += '<th>' + escapeHtml(String(c)) + '</th>'; });
  h += '</tr></thead><tbody>';
  var rows = Array.isArray(tbl.rows) ? tbl.rows : [];
  rows.forEach(function(row) {
    h += '<tr>';
    if (Array.isArray(row)) {
      for (var i = 0; i < cols.length; i++) h += '<td>' + escapeHtml(String(row[i] != null ? row[i] : '')) + '</td>';
    } else if (typeof row === 'object') {
      cols.forEach(function(c) { h += '<td>' + escapeHtml(String(row[c] != null ? row[c] : '')) + '</td>'; });
    } else {
      h += '<td colspan="' + cols.length + '">' + escapeHtml(String(row)) + '</td>';
    }
    h += '</tr>';
  });
  h += '</tbody></table>';
  return h;
}

function renderDiscussion(data) {
  var container = dom('discussionContainer');
  if (!container) return;
  if (!data.discussion) { container.innerHTML = '<div class="empty-state small">无结果解读。</div>'; return; }

  var discussion = data.discussion || {};
  var sections = discussion.sections || [];
  var result = data.result || {};
  var summaryText = result.summary || discussion.headline || '分析已完成。';
  var flowItems = sections.slice(0, 4).map(function(sec, idx) {
    var first = (sec.items && sec.items[0]) || sec.text || '';
    return '<div class="discussion-flow-item">' +
      '<span>' + (idx + 1) + '</span>' +
      '<strong>' + escapeHtml(sec.title || '解读要点') + '</strong>' +
      '<p>' + escapeHtml(String(first)) + '</p>' +
    '</div>';
  }).join('');
  var detailHtml = sections.map(function(sec) {
    var items = (sec.items || []).map(function(item) {
      return '<li>' + escapeHtml(String(item)) + '</li>';
    }).join('');
    return '<section class="discussion-detail-card">' +
      '<h3>' + escapeHtml(sec.title || '解读') + '</h3>' +
      (sec.text ? '<p>' + escapeHtml(String(sec.text)) + '</p>' : '') +
      (items ? '<ul>' + items + '</ul>' : '') +
    '</section>';
  }).join('');

  var html = '<div class="discussion-page">' +
    '<section class="discussion-summary">' +
      '<div><span>结果解读</span><h2>' + escapeHtml(discussion.headline || '分析结果解读') + '</h2></div>' +
      '<p>' + escapeHtml(summaryText) + '</p>' +
    '</section>' +
    '<section class="discussion-flow">' + (flowItems || '<div class="empty-state small">暂无结构化解读。</div>') + '</section>' +
    '<section class="discussion-detail-grid">' + detailHtml + '</section>' +
  '</div>';
  container.innerHTML = html;
}

/* ── Result Tabs ────────────────────────────────────────── */
function setupResultTabs() {
  domAll('.result-top-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      APP.activeResultTab = tab.dataset.resultTab;
      domAll('.result-top-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      domAll('.result-view').forEach(function(v) { v.classList.remove('active'); });
      var view = dom('result-view-' + tab.dataset.resultTab);
      if (view) view.classList.add('active');
      if (tab.dataset.resultTab === 'chart' && STATE.currentStatResult) {
        setTimeout(function() { renderStatChart(STATE.currentStatResult, STATE.currentStatResult); }, 80);
      }
    });
  });
}

/* ── Category Tabs ──────────────────────────────────────── */
function setupCategoryTabs() {
  domAll('#methodCatTabs .cat-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      domAll('#methodCatTabs .cat-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      STATE.activeChartCategory = tab.dataset.cat;
      renderMethodGrid(tab.dataset.cat);
    });
  });
}

/* ── Init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  setupStepNavigation();
  setupResultTabs();
  setupCategoryTabs();
  loadBackendParamCatalog();
  renderMethodGrid('parametric');
  renderParamControls();
  enableNextIfReady();

  dom('methodNextBtn').addEventListener('click', function() { activateStep('data'); });
  dom('dataNextBtn').addEventListener('click', function() {
    renderVariableControls();
    renderParamControls();
    activateStep('variables');
    autoRecommendCurrentRoles({ quiet: true, render: true });
  });
  dom('generateBtn').addEventListener('click', runAnalysis);

  if (typeof setupUploadHandlers === 'function') setupUploadHandlers();

  // Chart theme
  var themeSel = dom('chartThemeSelect');
  if (themeSel) {
    themeSel.addEventListener('change', function() {
      STATE.chartTheme = themeSel.value;
      rerenderCurrentChart();
    });
  }
  // Chart palette
  var paletteSel = dom('chartPaletteSelect');
  if (paletteSel) {
    paletteSel.addEventListener('change', function() {
      STATE.chartPalette = paletteSel.value;
      rerenderCurrentChart();
    });
  }
  // Chart title input
  var titleInput = dom('chartTitleInput');
  if (titleInput) {
    titleInput.addEventListener('input', function() {
      STATE.chartTitle = titleInput.value;
      rerenderCurrentChart();
    });
  }

  // Auto-recommend button
  var autoBtn = dom('autoRoleBtn');
  if (autoBtn) {
    autoBtn.addEventListener('click', function() {
      autoRecommendCurrentRoles({ quiet: false, render: true });
    });
  }

  // Export buttons
  domAll('.export-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var fmt = btn.dataset.fmt;
      if (fmt === 'csv' && APP.lastResult) {
        downloadCSV(APP.lastResult);
        return;
      }
      exportChartImage(fmt);
    });
  });
});

function rerenderCurrentChart() {
  if (APP.chartVariants && APP.chartVariants.length) {
    renderActiveStatVariant();
  } else if (STATE.currentStatResult) {
    renderStatChart(STATE.currentStatResult, STATE.currentStatResult);
  }
}

async function autoRecommendCurrentRoles(options) {
  options = options || {};
  var autoBtn = dom('autoRoleBtn');
  if (!STATE.activeChartType) {
    if (!options.quiet) showToast('请先选择统计方法', 'warning');
    return null;
  }
  if (!STATE.columns || STATE.columns.length === 0) {
    if (!options.quiet) showToast('请先加载数据', 'warning');
    return null;
  }
  if (autoBtn && !options.quiet) { autoBtn.disabled = true; autoBtn.textContent = '推荐中...'; }
  try {
    var payload = {
      method_id: STATE.activeChartType,
      dataset_name: STATE.datasetName || null,
      upload_id: STATE.uploadId || null,
      sheet_name: STATE.activeSheet || null,
      use_demo: !STATE.uploadId,
    };
    var data = await apiPost('/api/recommend-roles', payload);
    if (data.available && data.roles) {
      if (!STATE.methodRoleRecommendations) STATE.methodRoleRecommendations = {};
      STATE.methodRoleRecommendations[STATE.activeChartType] = data.roles;
      if (data.params && typeof data.params === 'object') {
        STATE.methodParams = Object.assign({}, STATE.methodParams || {}, data.params);
      }
      if (options.render) {
        applyRecommendedRoles(data.roles, data.params);
      }
      if (!options.quiet) showToast('已自动推荐变量和参数', 'success');
    } else {
      if (!options.quiet) showToast(data.reason || '无法自动推荐', 'warning');
      var msg = dom('roleValidationMessage');
      if (msg && options.render) {
        msg.textContent = data.reason || '没有找到满足当前统计方法的变量组合。';
        msg.className = 'validation-message error';
      }
    }
    return data;
  } catch(e) {
    if (!options.quiet) showToast('自动推荐失败: ' + e.message, 'error');
    return { available: false, reason: e.message };
  } finally {
    if (autoBtn) { autoBtn.disabled = false; autoBtn.textContent = '自动推荐'; }
  }
}

function applyRecommendedRoles(roles, params) {
  var container = dom('roleControls');
  if (!STATE.methodRoleRecommendations) STATE.methodRoleRecommendations = {};
  if (STATE.activeChartType) STATE.methodRoleRecommendations[STATE.activeChartType] = roles || {};
  if (!container || !container.querySelector('.role-select')) {
    renderVariableControls();
    container = dom('roleControls');
  }
  var applied = setRoleSelections(roles || {}, container);
  // Also apply recommended params
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(function(k) { STATE.methodParams[k] = params[k]; });
    renderParamControls();
  }
  var msg = dom('roleValidationMessage');
  if (msg) {
    msg.textContent = applied
      ? '已自动填充推荐变量和参数。可直接点击"开始分析"，也可手动微调。'
      : '已收到推荐结果，但当前数据列中没有可匹配的变量，请检查数据表头。';
    msg.className = applied ? 'validation-message ok' : 'validation-message error';
  }
}

function downloadCSV(data) {
  if (!data || !data.tables || !data.tables.result) { showToast('无数据可导出', 'warning'); return; }
  var tbl = data.tables.result;
  var cols = tbl.columns || [];
  var rows = tbl.rows || [];
  var csv = cols.join(',') + '\n';
  rows.forEach(function(row) {
    if (Array.isArray(row)) csv += row.join(',') + '\n';
    else csv += cols.map(function(c) { return '"' + String(row[c] != null ? row[c] : '') + '"'; }).join(',') + '\n';
  });
  var blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'});
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'analysis_result.csv'; a.click();
}

function exportChartImage(fmt) {
  if (!APP.activeChartVariant && APP.chartVariants && APP.chartVariants.length) APP.activeChartVariant = 0;
  var v = APP.chartVariants && APP.chartVariants[APP.activeChartVariant || 0];
  if (!v) { showToast('没有可导出的图表', 'warning'); return; }
  var container = dom('chartActivePlot');
  if (!container || !container.querySelector('.js-plotly-plot') || !window.Plotly) { showToast('图表未渲染', 'warning'); return; }
  var plot = container.querySelector('.js-plotly-plot');
  var width = Number(STATE.chartWidth) || (STATE.currentPlotlyLayout && STATE.currentPlotlyLayout.width) || 960;
  var height = Number(STATE.chartHeight) || (STATE.currentPlotlyLayout && STATE.currentPlotlyLayout.height) || 540;
  if (fmt === 'svg') {
    Plotly.downloadImage(plot, {format: 'svg', width: width, height: height, filename: 'chart'});
  } else if (fmt === 'pdf') {
    exportChartAsPdf(plot, width, height);
  } else {
    Plotly.downloadImage(plot, {format: 'png', width: width, height: height, filename: 'chart'});
  }
}

async function exportChartAsPdf(plot, cssWidth, cssHeight) {
  try {
    // Plotly.js doesn't support PDF → rasterize to canvas, encode as PDF
    var dataUrl = await Plotly.toImage(plot, {
      format: 'png',
      width: cssWidth,
      height: cssHeight,
      scale: 2,
    });
    var img = await loadImageFromDataUrl(dataUrl);
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (typeof encodeCanvasAsPdf === 'function') {
      var pdfBytes = encodeCanvasAsPdf(canvas, cssWidth, cssHeight);
      var blob = new Blob([pdfBytes], { type: 'application/pdf' });
      downloadBlob(blob, 'chart.pdf');
      showToast('PDF 已下载', 'success');
    } else {
      // Fallback: open print dialog for user to "Save as PDF"
      var w = window.open('', '_blank');
      if (!w) { showToast('请允许弹出窗口以导出PDF', 'warning'); return; }
      w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Chart</title>' +
        '<style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}' +
        'img{max-width:100%}</style></head><body>' +
        '<img src="' + dataUrl + '" onload="window.print()"></body></html>');
      w.document.close();
    }
  } catch (e) {
    showToast('PDF 导出失败: ' + e.message, 'error');
  }
}

// Expose
window.activateStep = activateStep;
window.renderMethodGrid = renderMethodGrid;
window.selectMethod = selectMethod;
window.renderVariableControls = renderVariableControls;
window.renderParamControls = renderParamControls;
window.runAnalysis = runAnalysis;
window.autoRecommendCurrentRoles = autoRecommendCurrentRoles;
window.renderAppearanceControls = renderAppearanceControls;
window.renderActiveStatVariant = renderActiveStatVariant;
