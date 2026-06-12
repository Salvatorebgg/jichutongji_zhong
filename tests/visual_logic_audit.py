"""
Visual logic audit for the clinical statistics UI.
Run from project root:
    python tests/visual_logic_audit.py
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "app/static/js/app.js").read_text(encoding="utf-8")
ANALYSIS_JS = (ROOT / "app/static/js/analysis.js").read_text(encoding="utf-8")
CHARTS_JS = (ROOT / "app/static/js/charts.js").read_text(encoding="utf-8")
DOWNLOAD_JS = (ROOT / "app/static/js/download.js").read_text(encoding="utf-8")
CSS = (ROOT / "app/static/styles.css").read_text(encoding="utf-8")

def assert_true(cond, msg):
    if not cond:
        raise AssertionError(msg)

def test_variant_parameter_refresh_does_not_reset_tab():
    block_start = APP_JS.find("function refreshCurrentVisualization")
    block = APP_JS[block_start:block_start+1200]
    assert_true(block_start >= 0, "refreshCurrentVisualization missing")
    assert_true("currentPlotlyDataRaw" in block, "refresh should render current raw plot")
    assert_true(block.find("currentPlotlyDataRaw") < block.find("rerenderCurrentStatChart"),
                "refresh must use current active variant before rerendering statistical chart")

def test_generic_lollipop_removed():
    assert_true("Generic bar-to-lollipop derivative removed" in ANALYSIS_JS,
                "generic bar-derived lollipop should be removed")
    assert_true("pushVariant('棒棒糖图', lollipop" not in ANALYSIS_JS,
                "generic duplicate lollipop pushVariant still present")

def test_no_internal_chart_settings_scroll_override():
    assert_true("V86 logic audit" in CSS, "no-scroll override marker missing")
    tail = CSS[CSS.rfind("V86 logic audit"):]
    assert_true("overflow-y: visible !important" in tail and "max-height: none !important" in tail,
                "chart settings panel must expand instead of internal scroll")

def test_heatmap_color_controls_are_not_single_useless_swatch():
    ctx_block = CHARTS_JS[CHARTS_JS.find("function getCurrentAppearanceContext"):CHARTS_JS.find("function renderChartVariantBar")]
    assert_true("['heatmap', 'choropleth'].includes(t.type)" in ctx_block,
                "heatmap/choropleth should expose low/high color scale controls")
    assert_true("低值颜色" in ctx_block and "高值颜色" in ctx_block,
                "heatmap color scale labels missing")

def test_fixed_colors_can_be_overridden_when_user_changes_color():
    assert_true("(t.meta?.fixedColor && !userPalette)" in CHARTS_JS,
                "fixedColor traces must be user-overridable when color controls are used")

def test_barpolar_supports_per_point_color_mapping():
    block_start = CHARTS_JS.find("// ── Barpolar ──")
    block = CHARTS_JS[block_start:block_start+2800]
    assert_true(block_start >= 0, "barpolar block missing")
    assert_true("usePerPointColors" in block and "buildIndexedPaletteColors(barCount, palette)" in block,
                "barpolar charts should create per-point color arrays for color mapping controls")
    assert_true("styleVariant === 'outline'" in block and "styleVariant === 'hollow'" in block,
                "barpolar style buttons should alter fill/outline behavior")
    assert_true("styleVariant === 'striped'" in block and "styleVariant === 'crosshatch'" in block,
                "barpolar striped/crosshatch style buttons should be wired")
    assert_true("Math.min(userLineWidth" in block,
                "barpolar outline width should respond to the line-width control")



def test_qda_centroid_variant_distinguishes_from_main_and_simplifies_color_targets():
    assert_true("类别中心定位图" in ANALYSIS_JS,
                "QDA/LDA centroid variant should be explicitly differentiated from the main plot")
    assert_true("visualRole: 'centroidMarker'" in ANALYSIS_JS and "visualRole: 'centroidGuide'" in ANALYSIS_JS,
                "centroid variant should include dedicated centroid marker/guide roles")
    assert_true("['centroidMarker', 'centroidGuide', 'referenceSupport'].includes(vr)" in CHARTS_JS,
                "appearance panel should hide centroid helper traces from independent color buttons")



def test_polar_layout_supports_arrows_bg_grid_and_indexed_colors():
    assert_true("function buildIndexedPaletteColors(count, palette)" in CHARTS_JS,
                "indexed palette helper should exist for point-wise color mapping")
    detect_block = CHARTS_JS[CHARTS_JS.find("function detectChartKindFromTraces"):CHARTS_JS.find("function getVisualStyleOptions")]
    assert_true("hint.includes('polar')" in detect_block and detect_block.find("hint.includes('polar')") < detect_block.find("hint.includes('bar')"),
                "barpolar/polar hints must be classified before generic bar charts")
    assert_true("first.type === 'barpolar' || first.type === 'scatterpolar'" in detect_block,
                "polar traces should be classified as polar")
    assert_true("usePerPointColors = (totalTraces === 1 && pointLabels.length > 1) || perPointTargetCount > 1" in CHARTS_JS,
                "barpolar should switch to point-wise color mapping when point color buttons are shown")
    assert_true("const polarBg = (STATE.chartBgPreset || 'white') === 'transparent' ? 'rgba(255,255,255,0)' : '#ffffff';" in CHARTS_JS,
                "polar layout should respect background preset")
    assert_true("const showPolarGrid = (STATE.chartGridMode || 'grid') === 'grid';" in CHARTS_JS,
                "polar layout should respect grid visibility mode")
    assert_true("const polarDomain = l.polar.domain || {};" in CHARTS_JS and "const polarRadius = Math.max" in CHARTS_JS,
                "polar axis arrows should be positioned from the actual polar domain")
    assert_true("polarCx + polarRadius * 0.88" in CHARTS_JS and "polarCy + polarRadius * 0.78" in CHARTS_JS,
                "polar charts should use short radial/angular direction arrows near the rim")
    assert_true("meta: { visualRole: 'polarAxisArrow' }" in CHARTS_JS,
                "polar axis arrows should be tagged to avoid duplicate annotations")
    assert_true("const isPolar = Boolean(l.polar)" in CHARTS_JS and "chartTypeKey.includes('polar')" in CHARTS_JS,
                "layout polishing should treat barpolar layouts as polar")

def test_linear_polar_variant_uses_polar_kind_and_skips_cartesian_axes():
    assert_true("chartType: 'polar_bar'" in ANALYSIS_JS,
                "linear/logistic polar contribution variants should use the polar_bar chart kind")
    render_block = APP_JS[APP_JS.find("function renderChart(plotlyData, plotlyLayout)"):APP_JS.find("const oldPlot = container.querySelector")]
    assert_true("const isPolarChart = Boolean(layout.polar)" in render_block,
                "renderChart should detect polar charts before applying x/y grid overrides")
    assert_true("if (isPolarChart && layout.polar)" in render_block and "else {" in render_block,
                "renderChart should skip cartesian x/y axis overrides for polar charts")
    assert_true("if (type === 'barpolar') flags.hasLines = true;" in APP_JS,
                "barpolar should expose line-width controls for polar bar outlines")

def test_default_dataset_name():
    assert_true("general_clinical_example" not in APP_JS, "app.js still references old missing dataset")
    assert_true("general_clinical_example" not in ANALYSIS_JS, "analysis.js still references old missing dataset")
    assert_true("comprehensive_example" in (ROOT / "app/main.py").read_text(encoding="utf-8"),
                "backend default dataset should be comprehensive_example")

def test_ancova_has_real_chart_and_report_image_export():
    assert_true("ancova_adjusted" in ANALYSIS_JS, "ANCOVA chart_data type must be rendered by frontend")
    assert_true("ancovaAdjustedLine" in ANALYSIS_JS and "ancovaAdjustedMean" in ANALYSIS_JS,
                "ANCOVA frontend plot should include adjusted lines and adjusted mean markers")
    assert_true("getCurrentResultChartImageDataUrlForReport" in DOWNLOAD_JS,
                "unified report export should embed the current chart image")
    assert_true("Plotly.newPlot(" in DOWNLOAD_JS and "report-figure" in DOWNLOAD_JS,
                "report export should render a saved chart when the chart tab is not visible")

def test_method_availability_uses_data_level_rules():
    assert_true("function getUsableModelFeatures" in APP_JS and "modelCompleteInfo" in APP_JS,
                "method availability must inspect actual usable model features and complete rows")
    assert_true("binaryEventInfo" in APP_JS and "survivalGroupCounts" in APP_JS,
                "survival availability must validate 0/1 events and per-group complete observations")
    assert_true("groupedNumericCounts" in APP_JS and "pairedNumericCount" in APP_JS,
                "grouped and paired tests must validate numeric complete observations")
    assert_true("Fisher精确检验仅开放2×2列联表" in APP_JS,
                "Fisher availability should not enable non-2x2 approximate tables")
    assert_true("features.encodedCount < 1" in APP_JS and "features.numericCount < 1" in APP_JS,
                "regression/discriminant availability should use model-specific predictor rules")

if __name__ == "__main__":
    tests = [
        test_variant_parameter_refresh_does_not_reset_tab,
        test_generic_lollipop_removed,
        test_no_internal_chart_settings_scroll_override,
        test_heatmap_color_controls_are_not_single_useless_swatch,
        test_fixed_colors_can_be_overridden_when_user_changes_color,
        test_barpolar_supports_per_point_color_mapping,
        test_qda_centroid_variant_distinguishes_from_main_and_simplifies_color_targets,
        test_polar_layout_supports_arrows_bg_grid_and_indexed_colors,
        test_linear_polar_variant_uses_polar_kind_and_skips_cartesian_axes,
        test_default_dataset_name,
        test_ancova_has_real_chart_and_report_image_export,
        test_method_availability_uses_data_level_rules,
    ]
    for t in tests:
        t()
        print(f"[PASS] {t.__name__}")
    print(f"[OK] {len(tests)} visual logic checks passed.")
