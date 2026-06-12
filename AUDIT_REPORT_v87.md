# Clinical Statistics UI – 全局巡检修复报告 v87

## 本轮修复目标

本轮不再采用“用户点一点、局部补一点”的方式，而是对当前项目做了整体逻辑巡检，重点覆盖：

1. 图形切换状态是否会被参数调节重置；
2. 是否存在重复、低质量、通用派生图；
3. 图形参数栏是否存在内部滚轮；
4. 颜色映射是否真正对应当前图中元素；
5. 默认示例数据集是否一致；
6. 22 种统计方法后端接口是否全部可运行；
7. 关键前端脚本是否存在语法错误。

## 已修复问题

### 1. 参数调节导致图形跳回第一张

修复位置：

- `app/static/js/app.js`
- `app/static/js/analysis.js`

修复方式：

- `refreshCurrentVisualization()` 不再优先重新执行 `renderStatChart()`；
- 改为优先重绘当前激活的 `currentPlotlyDataRaw/currentPlotlyLayoutRaw`；
- `rerenderCurrentStatChart()` 增加 `activeStatChartVariantIndex` 保留机制。

### 2. 重复棒棒糖图

修复位置：

- `app/static/js/analysis.js`

修复方式：

- 删除通用的 `bar -> lollipop` 自动派生逻辑；
- 只保留各统计方法专门设计的高级图；
- 避免“同名棒棒糖图重复出现”“最后一个棒棒糖图缺少基线或颜色不可调”等问题。

### 3. 图形参数栏内部滚轮

修复位置：

- `app/static/styles.css`

修复方式：

- 对 `#ws-chart .chart-settings-panel` 和 `#chartSettingsPanel.chart-settings-panel` 增加最终覆盖规则；
- 强制 `max-height: none`、`overflow: visible`；
- 参数栏随页面自然向下展开，不再出现内部滚轮。

### 4. 颜色映射无法覆盖固定颜色

修复位置：

- `app/static/js/charts.js`

修复方式：

- 原逻辑中 `fixedColor` 优先级过高，导致部分图形元素即使出现颜色按钮也无法改变颜色；
- 现在只有在用户未自定义颜色时才使用 `fixedColor`；
- 用户选择颜色后，颜色按钮可以覆盖对应图形元素。

### 5. 热图/列联热图颜色按钮无效

修复位置：

- `app/static/js/charts.js`

修复方式：

- 热图和 choropleth 不再只显示一个“系列颜色”按钮；
- 改为显示“低值颜色 / 高值颜色”两个颜色控制；
- 与 `customColorScale` 逻辑对应，避免无效按钮。

### 6. 默认数据集不一致

修复位置：

- `app/static/js/app.js`
- `app/static/js/analysis.js`
- `app/main.py`

修复方式：

- 统一默认数据集为 `comprehensive_example`；
- 防止未显式传入 dataset_name 时出现 404。

## 新增/更新测试

### 1. `tests/smoke.py`

覆盖：

- 示例数据生成；
- 变量类型识别；
- 22 种统计方法 `/api/analyze` 接口完整运行。

测试结果：

```text
[PASS] sample generation (22 makers)
[PASS] variable classification
[PASS] analysis endpoints (22/22)
All smoke tests passed.
```

### 2. `tests/visual_logic_audit.py`

覆盖：

- 参数调节不重置图形切换；
- 通用重复棒棒糖图已移除；
- 参数栏无内部滚轮；
- 热图颜色控制不是无效单色按钮；
- fixedColor 可被用户颜色覆盖；
- 默认数据集一致。

测试结果：

```text
[OK] 6 visual logic checks passed.
```

## 最终检查结果

```text
app/static/js/app.js: PASS
app/static/js/analysis.js: PASS
app/static/js/charts.js: PASS
app/static/js/chartThemes.js: PASS
app/static/js/download.js: PASS
app/static/js/utils.js: PASS
tests/smoke.py: PASS
tests/visual_logic_audit.py: PASS
overall: True
```

## 说明

本轮已经把目前可自动验证的核心逻辑纳入测试脚本。后续如果继续新增图形类型或参数控件，应同步扩展 `tests/visual_logic_audit.py`，避免再次出现“图形元素与右侧控件不对应”“调参跳回第一张图”“无效颜色按钮”等问题。
