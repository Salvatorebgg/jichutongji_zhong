/* ── Charts Module ──────────────────────────────────────── */

function activateChartWorkspace(chartId) {
  if (STATE.activeChartType && STATE.activeChartType !== chartId) {
    saveActiveChartWorkspace();
  }
  STATE.activeChartType = chartId;
  loadChartWorkspace(chartId);
  STATE.currentPlotlyData = null;
  STATE.currentPlotlyLayout = null;
  STATE.currentPlotlyDataRaw = null;
  STATE.currentPlotlyLayoutRaw = null;
  STATE.currentChartKind = null;
  STATE.currentChartSourceData = null;
  const config = getChartConfig(chartId);
  if (!STATE.uploadId && !STATE.datasetName && config && config.exampleDataset) {
    STATE.datasetName = config.exampleDataset;
  }
  qsa('.mini-chart-card').forEach(c => c.classList.remove('selected'));
  const card = qs(`.mini-chart-card[data-chart="${chartId}"]`);
  if (card) card.classList.add('selected');
  const label = el('selectedChartLabel');
  if (label) label.textContent = config ? config.name : chartId;
  const previewTitle = el('chartPreviewTitle');
  if (previewTitle) previewTitle.textContent = config ? config.name : '图形预览';
  if (typeof updateFlowLine === 'function') updateFlowLine(1);
  resetChartPreview(config);
  if (typeof renderDataPanel === 'function') renderDataPanel();
  buildChartVarControls();
  if (typeof updateMetricGrid === 'function') updateMetricGrid();
  if (typeof updatePreviewTable === 'function') updatePreviewTable();
  if (typeof updateDownloadList === 'function') updateDownloadList();
}

function resetChartPreview(config) {
  const container = el('chartPreviewContainer');
  if (!container) return;
  disconnectChartResizeObserver();
  const plot = container.querySelector('.js-plotly-plot');
  if (plot && window.Plotly) Plotly.purge(plot);
  container.innerHTML = `<div class="empty-state">${config ? `已选择「${config.name}」，载入数据后点击生成` : '请在左侧选择图表类型'}</div>`;
  const exportBar = el('chartExportBar');
  if (exportBar) exportBar.style.display = 'none';
  const generateBtn = el('generateChartBtn');
  if (generateBtn && typeof setLoading === 'function') setLoading(generateBtn, false);
}

/* ── Chart Generation ──────────────────────────────────── */
async function generateChart() {
  const chartType = STATE.activeChartType;
  if (!chartType) { toast('请先选择图表类型', 'warning'); return; }

  const btn = el('generateChartBtn');
  if (!btn) return;
  setLoading(btn, true);

  if (['china_map', 'china_bubble_map'].includes(chartType) && !STATE.chinaGeoJSON) {
    if (typeof loadChinaGeoJSON === 'function') {
      try { await loadChinaGeoJSON(); } catch (e) {}
    }
    if (typeof loadChinaCentroids === 'function') {
      try { loadChinaCentroids(); } catch (e) {}
    }
  }
  if (['world_map', 'world_bubble_map', 'europe_map'].includes(chartType) && !STATE.worldGeoJSON && typeof loadWorldGeoJSON === 'function') {
    try { await loadWorldGeoJSON(); } catch (e) {}
  }

  const config = getChartConfig(chartType);
  if (!config) { toast('图表配置未找到', 'error'); setLoading(btn, false); return; }
  if (!STATE.uploadId && !STATE.datasetName && (!STATE.columns || STATE.columns.length === 0)) {
    toast('请先加载示例数据或上传数据文件', 'warning');
    setLoading(btn, false);
    return;
  }

  const params = collectChartParams();
  const slots = getChartVarSlots ? getChartVarSlots(chartType) : [];
  for (const slot of slots) {
    if (!slot.optional) {
      const val = params[slot.name];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        toast(`请选择"${slot.label}"`, 'warning');
        setLoading(btn, false);
        return;
      }
    }
  }

  let data = {};
  try {
    data = await loadChartDataset(config);
  } catch (e) {
    console.warn('Full dataset load failed, using preview:', e);
    data = buildDataFromState();
  }

  if (Object.keys(data).length === 0) {
    toast('无法加载数据', 'error');
    setLoading(btn, false);
    return;
  }

  STATE.currentChartSourceData = data;
  if (typeof renderAppearanceControls === 'function') renderAppearanceControls();

  params.title = (el('chartTitleInput') ? el('chartTitleInput').value : '') || '';

  const theme = getActiveTheme();
  let traces, layout;

  try {
    traces = config.buildTraces(data, params, theme);
    layout = config.buildLayout(params, theme);
  } catch (e) {
    console.error('Chart build error:', e);
    toast('图表构建失败: ' + e.message, 'error');
    setLoading(btn, false);
    return;
  }

  if (!traces || traces.length === 0) {
    toast('未能生成图表数据，请检查变量选择', 'warning');
    setLoading(btn, false);
    return;
  }

  const defaultMargin = { l: 72, r: 48, t: 72, b: 72 };
  STATE.currentChartKind = chartType;
  STATE.currentPlotlyDataRaw = JSON.parse(JSON.stringify(traces || []));
  STATE.currentPlotlyLayoutRaw = JSON.parse(JSON.stringify(layout || {}));
  traces = polishTracesForPublication(JSON.parse(JSON.stringify(traces || [])), theme);
  layout = applyThemeLayout(JSON.parse(JSON.stringify(layout || {})), theme);
  layout.margin = { ...defaultMargin, ...(layout.margin || {}) };
  layout = polishLayoutForPublication(layout, chartType, theme);
  layout.autosize = true;
  if (layout.showlegend === undefined) {
    layout.showlegend = traces.some(t => t && t.showlegend !== false && t.name);
  }
  if (STATE.barGap != null && traces.some(t => t.type === 'bar' || t.type === 'histogram')) {
    layout.bargap = STATE.barGap;
  }

  if (typeof activateWorkspaceTab === 'function') activateWorkspaceTab('chart');

  const container = el('chartPreviewContainer');
  if (!container) { setLoading(btn, false); return; }

  const oldPlot = container.matches('.js-plotly-plot') ? container : container.querySelector('.js-plotly-plot');
  disconnectChartResizeObserver();
  if (oldPlot) Plotly.purge(oldPlot);
  container.classList.remove('js-plotly-plot');
  container.innerHTML = '';
  const plotMount = document.createElement('div');
  plotMount.className = 'chart-plot';
  container.appendChild(plotMount);
  const frameSize = fitChartPlotToFrame(plotMount, chartType);
  layout.width = frameSize.width;
  layout.height = frameSize.height;
  layout.autosize = false;

  STATE.currentPlotlyData = traces;
  STATE.currentPlotlyLayout = layout;
  STATE.currentChartSourceData = data;
  saveCurrentChartParams(params);

  try {
    await Plotly.newPlot(plotMount, traces, layout, {
      responsive: true,
      displaylogo: false,
      displayModeBar: false,
      staticPlot: false,
      scrollZoom: false,
      doubleClick: false,
      showAxisDragHandles: false,
      modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'lasso2d', 'select2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'sendDataToCloud'],
      toImageButtonOptions: {
        format: 'png', height: 1440, width: 2160, scale: 2,
        filename: (chartType || 'chart') + '_' + Date.now(),
      },
    });
    syncCurrentPlotlyLayoutFromDom(plotMount);
    installChartResizeObserver(plotMount, chartType);
    if (chartType !== 'treemap' && window.Plotly && typeof Plotly.Plots?.resize === 'function') {
      const resizePromise = Plotly.Plots.resize(plotMount);
      if (resizePromise && typeof resizePromise.then === 'function') {
        await resizePromise;
      }
      syncCurrentPlotlyLayoutFromDom(plotMount);
    }
  } catch (e) {
    console.error('Plotly render error:', e);
    toast('\u56fe\u8868\u6e32\u67d3\u5931\u8d25', 'error');
    setLoading(btn, false);
    return;
  }

  const exportBar = el('chartExportBar');
  if (exportBar) exportBar.style.display = 'flex';
  if (typeof updateFlowLine === 'function') updateFlowLine(4);
  if (typeof setStatus === 'function') setStatus('图表已生成');
  toast(config.name + ' 已生成', 'success');
  if (typeof setButtonComplete === 'function') setButtonComplete(btn, '\u5904\u7406\u5b8c\u6210');
  else setLoading(btn, false);
}

// ── Polish traces for publication ────────────────────
function remapArrayColors(colorArray, palette) {
  const uniqueMap = {};
  let idx = 0;
  return colorArray.map(c => {
    if (!uniqueMap[c]) {
      uniqueMap[c] = palette[idx % palette.length];
      idx++;
    }
    return uniqueMap[c];
  });
}

function buildIndexedPaletteColors(count, palette) {
  const n = Math.max(0, Number(count) || 0);
  return Array.from({ length: n }, (_, idx) => palette[idx % palette.length]);
}

function buildCustomColorScale(colors) {
  const clean = (colors || []).filter(Boolean);
  if (clean.length < 2) return null;
  if (clean.length === 2) return [[0, clean[0]], [1, clean[1]]];
  return clean.map((c, i) => [i / (clean.length - 1), c]);
}

function isNumericColorArray(values) {
  return Array.isArray(values) && values.length > 0 && values.every(v => Number.isFinite(Number(v)));
}

function isDecorativeTrace(trace) {
  if (!trace) return true;
  const role = trace.meta?.visualRole || trace._visualRole || '';
  return ['backgroundTrajectory', 'referenceLine', 'riskCalibrationBars', 'lollipopStem', 'lollipopStemLine'].includes(role);
}

function detectChartKindFromTraces(traces, chartTypeHint) {
  const hint = String(chartTypeHint || STATE.currentChartKind || '').toLowerCase();
  if (hint.includes('polar') || hint.includes('radar')) return 'polar';
  if (hint.includes('bar') || hint.includes('hist')) return 'bar';
  if (hint.includes('line') || hint.includes('survival') || hint.includes('repeated')) return 'line';
  if (hint.includes('scatter') || hint.includes('correlation')) return 'scatter';
  if (hint.includes('box') || hint.includes('violin')) return 'distribution';
  if (hint.includes('pie') || hint.includes('donut') || hint.includes('funnel') || hint.includes('treemap')) return 'categorical';
  const first = (traces || []).find(t => t && !isDecorativeTrace(t));
  if (!first) return 'generic';
  if (first.type === 'barpolar' || first.type === 'scatterpolar') return 'polar';
  if (first.type === 'bar' || first.type === 'histogram') return 'bar';
  if (first.type === 'box' || first.type === 'violin') return 'distribution';
  if (first.type === 'scatter') {
    const mode = String(first.mode || '');
    if (mode.includes('lines')) return 'line';
    return 'scatter';
  }
  return 'generic';
}

function getVisualStyleOptions(chartKind) {
  const presets = {
    bar: [
      { id: 'solid', label: '实心' },
      { id: 'outline', label: '空心描边' },
      { id: 'hollow', label: '纯空心' },
      { id: 'striped', label: '斜线' },
      { id: 'crosshatch', label: '交叉线' },
    ],
    line: [
      { id: 'solid', label: '实线圆点' },
      { id: 'dashed', label: '虚线方点' },
      { id: 'minimal', label: '极简细线' },
      { id: 'bold', label: '强调粗线' },
      { id: 'smooth', label: '平滑曲线' },
    ],
    scatter: [
      { id: 'solid', label: '实心圆点' },
      { id: 'hollow', label: '空心圆点' },
      { id: 'square', label: '方形点' },
      { id: 'diamond', label: '菱形点' },
      { id: 'minimal', label: '极简点' },
    ],
    distribution: [
      { id: 'solid', label: '经典填充' },
      { id: 'outline', label: '描边样式' },
      { id: 'minimal', label: '极简样式' },
    ],
    categorical: [
      { id: 'solid', label: '经典配色' },
      { id: 'outline', label: '浅色描边' },
      { id: 'minimal', label: '极简配色' },
    ],
    polar: [
      { id: 'solid', label: '实心' },
      { id: 'outline', label: '空心描边' },
      { id: 'hollow', label: '纯空心' },
      { id: 'striped', label: '斜线' },
      { id: 'crosshatch', label: '交叉线' },
    ],
    generic: [
      { id: 'solid', label: '标准' },
      { id: 'minimal', label: '极简' },
      { id: 'bold', label: '强调' },
    ],
  };
  return presets[chartKind] || presets.generic;
}

function guessPointLabels(trace) {
  if (!trace) return [];
  if (Array.isArray(trace.x) && trace.x.length > 1) return trace.x.map(v => String(v));
  if (Array.isArray(trace.labels) && trace.labels.length > 1) return trace.labels.map(v => String(v));
  if (Array.isArray(trace.y) && trace.y.length > 1 && trace.type === 'bar') return trace.y.map((_, i) => `项目 ${i + 1}`);
  if (Array.isArray(trace.theta) && trace.theta.length > 1) return trace.theta.map(v => String(v));
  return [];
}

function getCurrentAppearanceContext(chartTypeHint) {
  const traces = STATE.currentPlotlyDataRaw || STATE.currentPlotlyData || [];
  const chartKind = detectChartKindFromTraces(traces, chartTypeHint);
  const styleOptions = getVisualStyleOptions(chartKind);
  const cleanTraces = (traces || []).filter(t => {
    if (!t || isDecorativeTrace(t)) return false;
    const vr = t.meta?.visualRole || t._visualRole || '';
    if (['centroidMarker', 'centroidGuide', 'referenceSupport'].includes(vr)) return false;
    return true;
  });
  const targets = [];

  if (cleanTraces.length === 1) {
    const t = cleanTraces[0];
    if (['heatmap', 'choropleth'].includes(t.type)) {
      ['低值颜色', '高值颜色'].forEach((label, idx) => {
        targets.push({
          key: `scale-${idx}`,
          label,
          traceIndex: traces.indexOf(t),
          pointIndex: idx,
          mode: 'scale',
        });
      });
    } else {
      const labels = guessPointLabels(t);
      const isPerPoint = ['bar', 'pie', 'funnel', 'treemap', 'barpolar'].includes(t.type) && labels.length > 1;
      if (isPerPoint) {
        labels.forEach((label, idx) => {
          targets.push({
            key: `p-${idx}`,
            label: label || `项目 ${idx + 1}`,
            traceIndex: traces.indexOf(t),
            pointIndex: idx,
            mode: 'point',
          });
        });
      }
    }
  }

  if (!targets.length) {
    cleanTraces.forEach((t, idx) => {
      const label = String(t.name || t.meta?.seriesLabel || `${t.type || '系列'} ${idx + 1}`);
      targets.push({
        key: `s-${idx}`,
        label,
        traceIndex: traces.indexOf(t),
        pointIndex: null,
        mode: 'series',
      });
    });
  }

  const maxColors = cleanTraces.length ? Math.max(1, targets.length) : 0;
  return { chartKind, styleOptions, targets, maxColors };
}

function renderChartVariantBar() {
  const bar = el('chartVariantBar');
  if (!bar) return;
  const variants = Array.isArray(STATE.statChartVariants) ? STATE.statChartVariants : [];
  const hasVariants = variants.length > 1;
  if (!hasVariants) {
    bar.hidden = true;
    bar.innerHTML = '';
    return;
  }
  const activeIndex = Number.isFinite(Number(STATE.activeStatChartVariantIndex)) ? Number(STATE.activeStatChartVariantIndex) : 0;
  bar.hidden = false;
  bar.innerHTML = `
    <div class="variant-bar-title">图形切换</div>
    <div class="variant-chip-row">
      ${variants.map((v, idx) => `<button type="button" class="variant-chip ${idx === activeIndex ? 'active' : ''}" data-variant-index="${idx}">${escapeHtml(v.label || `图 ${idx + 1}`)}</button>`).join('')}
    </div>
  `;
  qsa('.variant-chip', bar).forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.variantIndex);
      const v = variants[idx];
      if (!v) return;
      STATE.activeStatChartVariantIndex = idx;
      STATE.currentChartKind = v.chartType || STATE.currentChartKind;
      STATE.currentPlotlyDataRaw = JSON.parse(JSON.stringify(v.traces || []));
      STATE.currentPlotlyLayoutRaw = JSON.parse(JSON.stringify(v.layout || {}));
      if (el('chartPreviewTitle')) el('chartPreviewTitle').textContent = v.title || v.label || '统计图形';
      if (typeof renderAppearanceControls === 'function') renderAppearanceControls();
      if (typeof renderChart === 'function') renderChart(STATE.currentPlotlyDataRaw, STATE.currentPlotlyLayoutRaw);
    });
  });
}

function polishTracesForPublication(traces, theme) {
  const totalTraces = (traces || []).length;
  const styleVariant = STATE.chartVisualStyle || 'solid';
  const appearanceContext = getCurrentAppearanceContext(STATE.currentChartKind);
  const perPointTargetCount = appearanceContext?.targets?.filter(t => t.mode === 'point').length || 0;
  const userPalette = STATE.userColors && STATE.userColors.length > 0 ? STATE.userColors : null;
  const customPalette = typeof getActivePalette === 'function' ? getActivePalette() : null;
  const basePalette = userPalette || customPalette || theme.colorway || ['#2E6F9E', '#D95F59', '#2A9D8F', '#E9A93A'];
  // Use expandPalette to guarantee enough colors for all categories
  const palette = typeof expandPalette === 'function' ? expandPalette(basePalette, 24) : basePalette;
  const customColorScale = buildCustomColorScale(userPalette);
  const ink = theme.ink || '#111827';
  const markerLine = theme.markerLine || '#ffffff';
  const userMarkerSize = STATE.markerSize || 9;
  const userLineWidth = STATE.lineWidth || 3.2;
  const userMarkerShape = STATE.markerShape || 'circle';
  const userMarkerOpacity = STATE.markerOpacity != null ? STATE.markerOpacity : (theme.opacity ?? 0.88);
  const fontFamily = theme.fontFamily || "'Arial', 'Noto Sans SC', sans-serif";

  return (traces || []).map((trace, i) => {
    const t = { ...trace };
    const colorIndex = Number.isFinite(Number(t.meta?.colorIndex)) ? Number(t.meta.colorIndex) : i;
    const color = (t.meta?.fixedColor && !userPalette) ? t.meta.fixedColor : palette[colorIndex % palette.length];
    const mode = String(t.mode || '');
    const hasArrayColor = Array.isArray(t.marker?.color);
    const usesContinuousMarkerScale = hasArrayColor && isNumericColorArray(t.marker.color) && Boolean(t.marker?.colorscale || t.marker?.colorbar || t.marker?.showscale);
    const visualRole = t.meta?.visualRole || t._visualRole;
    const errorColorIndex = Number.isFinite(Number(t.meta?.errorColorIndex)) ? Number(t.meta.errorColorIndex) : null;
    const errorColor = errorColorIndex != null ? palette[errorColorIndex % palette.length] : color;

    // ── Scatter / Scattergeo ──
    if (t.type === 'scatter' || t.type === 'scattergeo') {
      const isLine = mode.includes('lines');
      const isMarker = mode.includes('markers') || !mode;
      const hasText = mode.includes('text');
      if (visualRole === 'backgroundTrajectory') {
        t.line = {
          ...(t.line || {}),
          color,
          width: t.line?.width ?? 0.85,
          shape: 'linear',
          smoothing: 0,
        };
        t.opacity = t.opacity ?? 0.32;
        t.hoverinfo = t.hoverinfo || 'skip';
        return t;
      }
      const lineShape = styleVariant === 'smooth' ? 'spline' : (visualRole === 'lollipopStemLine' ? 'linear' : (t.line?.shape || (isLine ? 'spline' : undefined)));
      const lineDash = styleVariant === 'dashed' ? 'dash' : (styleVariant === 'minimal' ? 'dot' : (t.line?.dash || 'solid'));
      const lineWidth = styleVariant === 'minimal' ? Math.max(1.2, userLineWidth - 1.1) : (styleVariant === 'bold' ? Math.max(3.2, userLineWidth + 1.4) : userLineWidth);
      t.line = {
        ...(t.line || {}),
        color,
        dash: visualRole === 'lollipopStemLine' ? 'solid' : lineDash,
        width: visualRole === 'lollipopStemLine' ? Math.max(1.8, Math.min(userLineWidth, 2.8)) : (isLine ? lineWidth : 1.8),
        shape: lineShape,
        smoothing: styleVariant === 'smooth' ? 0.65 : (visualRole === 'lollipopStemLine' ? 0 : (t.line?.smoothing ?? (isLine ? 0.4 : undefined))),
      };
      if (t.error_y) {
        t.error_y = {
          ...(t.error_y || {}),
          color: errorColor,
          thickness: t.error_y.thickness ?? 1.6,
          width: t.error_y.width ?? 5,
        };
      }
      if (t.fill && t.fill !== 'none' && t.fill !== 'toself') {
        t.fillcolor = withAlpha(color, t.fillcolor ? 0.18 : 0.20);
      }
      if (t.fill === 'toself') {
        t.fillcolor = t.fillcolor || withAlpha(color, 0.28);
      }
      if (isMarker) {
        let markerColor = hasArrayColor && !usesContinuousMarkerScale ? remapArrayColors(t.marker.color, palette) : (hasArrayColor ? t.marker.color : color);
        const markerSize = Array.isArray(t.marker?.size)
          ? t.marker.size
          : (visualRole === 'lollipopHead' ? Math.max(15, userMarkerSize + 7) : (styleVariant === 'minimal' ? Math.max(5, userMarkerSize - 1.5) : userMarkerSize));
        const scatterSymbolMap = { solid: 'circle', hollow: 'circle-open', square: 'square', diamond: 'diamond', minimal: 'circle-open-dot', dashed: 'square', bold: 'circle', smooth: 'circle' };
        const markerSymbol = userMarkerShape && userMarkerShape !== 'circle' ? userMarkerShape : (scatterSymbolMap[styleVariant] || t.marker?.symbol || userMarkerShape);
        const markerLineColor = ['hollow','minimal','square','diamond'].includes(styleVariant) ? color : markerLine;
        const markerOpacity = styleVariant === 'minimal' ? Math.min(0.82, userMarkerOpacity) : userMarkerOpacity;
      if (visualRole === 'centroidGuide') {
        t.line = { ...(t.line || {}), color, width: Math.max(1.2, Math.min(userLineWidth, 2.2)), dash: 'dot' };
        t.opacity = 0.78;
        t.hoverinfo = t.hoverinfo || 'skip';
      }
        // 对 open 类标记，Plotly 使用 marker.color 绘制轮廓；不要把颜色改成透明，否则 LDA 等散点图会“消失”。
        if (styleVariant === 'hollow' || styleVariant === 'minimal') {
          markerColor = hasArrayColor && !usesContinuousMarkerScale ? remapArrayColors(t.marker.color, palette) : (hasArrayColor ? t.marker.color : color);
        }
        t.marker = {
          ...(t.marker || {}),
          color: markerColor,
          size: markerSize,
          symbol: markerSymbol,
          opacity: markerOpacity,
          line: { color: markerLineColor, width: visualRole === 'lollipopHead' ? 1.6 : (styleVariant === 'minimal' ? 1.9 : 1.25) },
        };
        if (usesContinuousMarkerScale && customColorScale) {
          t.marker.colorscale = customColorScale;
        }
      }
      if (hasText) {
        t.textfont = { ...(t.textfont || {}), family: fontFamily, size: visualRole === 'lollipopHead' ? 12 : 11, color: ink };
      }
    }

    // ── Scatterpolar (radar) ──
    if (t.type === 'scatterpolar') {
      t.line = { ...(t.line || {}), color, width: userLineWidth };
      t.marker = { ...(t.marker || {}), color, size: userMarkerSize, symbol: userMarkerShape, line: { color: '#ffffff', width: 1.2 } };
    }

    // ── Bar ──
    if (t.type === 'bar') {
      if (visualRole === 'lollipopStem') {
        if (Array.isArray(t.marker?.color)) {
          const uniqueMap = {};
          let stemIdx = 0;
          const stemColors = t.marker.color.map(c => {
            if (!uniqueMap[c]) {
              uniqueMap[c] = withAlpha(palette[stemIdx % palette.length], 0.22);
              stemIdx++;
            }
            return uniqueMap[c];
          });
          t.marker = {
            ...(t.marker || {}),
            color: stemColors,
            line: { color: stemColors.map((_, idx) => withAlpha(palette[idx % palette.length], 0.38)), width: 1 },
          };
        }
        t.marker = {
          ...(t.marker || {}),
          opacity: t.marker?.opacity ?? 1,
          line: t.marker?.line || { color: '#ffffff', width: 0.6 },
        };
        t.textposition = 'none';
        t.hoverinfo = 'skip';
        t.cliponaxis = false;
        return t;
      }
      if (visualRole === 'riskCalibrationBars') {
        const alpha = Math.max(0.16, Math.min(userMarkerOpacity, 0.34));
        t.marker = {
          ...(t.marker || {}),
          color: withAlpha(color, alpha),
          line: { color: withAlpha(color, alpha + 0.18), width: 1 },
        };
        t.showlegend = false;
        t.cliponaxis = false;
        return t;
      }
      const pointLabels = guessPointLabels(t);
      const usePerPointColors = (totalTraces === 1 && pointLabels.length > 1) || perPointTargetCount > 1;
      let barColor = hasArrayColor ? remapArrayColors(t.marker.color, palette) : color;
      if (usePerPointColors && !hasArrayColor) {
        barColor = Array.from({ length: pointLabels.length }, (_, idx) => palette[idx % palette.length]);
      }
      let lineColor = Array.isArray(barColor) ? barColor : color;
      let fillColor = barColor;
      let pattern = undefined;
      if (styleVariant === 'outline') {
        fillColor = Array.isArray(barColor) ? barColor.map(c => withAlpha(c, 0.20)) : withAlpha(color, 0.20);
        lineColor = Array.isArray(barColor) ? barColor : color;
      } else if (styleVariant === 'hollow') {
        fillColor = Array.isArray(barColor) ? barColor.map(() => 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.03)';
        lineColor = Array.isArray(barColor) ? barColor : color;
      } else if (styleVariant === 'striped') {
        pattern = { shape: '/', solidity: 0.28, fillmode: 'overlay', fgcolor: Array.isArray(barColor) ? undefined : color, bgcolor: 'rgba(255,255,255,0.88)' };
      } else if (styleVariant === 'crosshatch') {
        pattern = { shape: 'x', solidity: 0.24, fillmode: 'overlay', fgcolor: Array.isArray(barColor) ? undefined : color, bgcolor: 'rgba(255,255,255,0.88)' };
      }
      t.marker = {
        ...(t.marker || {}),
        color: fillColor,
        opacity: userMarkerOpacity,
        line: { color: lineColor, width: styleVariant === 'solid' ? 1.2 : 2 },
        ...(pattern ? { pattern } : {}),
      };
      const barWidth = Number(STATE.barWidth || 0.42);
      if (!Number.isNaN(barWidth)) t.width = barWidth;
      t.textposition = t.textposition || (Array.isArray(t.text) ? 'outside' : 'none');
      t.textfont = { ...(t.textfont || {}), family: fontFamily, size: 12.5, color: ink };
      t.cliponaxis = false;
    }

    // ── Barpolar ──
    if (t.type === 'barpolar') {
      const pointLabels = guessPointLabels(t);
      const barCount = Math.max((Array.isArray(t.theta) ? t.theta.length : 0), (Array.isArray(t.r) ? t.r.length : 0), pointLabels.length, 1);
      const usePerPointColors = (totalTraces === 1 && pointLabels.length > 1) || perPointTargetCount > 1;
      let barpolarColor;
      if (usePerPointColors) {
        barpolarColor = buildIndexedPaletteColors(barCount, palette);
      } else if (Array.isArray(t.marker?.color)) {
        barpolarColor = remapArrayColors(t.marker.color, palette);
      } else {
        barpolarColor = color;
      }
      const lineColors = Array.isArray(barpolarColor)
        ? barpolarColor.map(c => withAlpha(c, 0.96))
        : '#ffffff';
      let fillColor = barpolarColor;
      let outlineColor = lineColors;
      let outlineWidth = Math.max(1.0, Math.min(userLineWidth, 4.5));
      let pattern = undefined;
      if (styleVariant === 'outline') {
        fillColor = Array.isArray(barpolarColor)
          ? barpolarColor.map(c => withAlpha(c, 0.22))
          : withAlpha(barpolarColor, 0.22);
        outlineColor = Array.isArray(barpolarColor) ? barpolarColor : barpolarColor;
        outlineWidth = Math.max(1.8, Math.min(userLineWidth, 5));
      } else if (styleVariant === 'hollow') {
        fillColor = Array.isArray(barpolarColor)
          ? barpolarColor.map(() => 'rgba(255,255,255,0.02)')
          : 'rgba(255,255,255,0.02)';
        outlineColor = Array.isArray(barpolarColor) ? barpolarColor : barpolarColor;
        outlineWidth = Math.max(2.0, Math.min(userLineWidth, 5));
      } else if (styleVariant === 'striped') {
        fillColor = Array.isArray(barpolarColor)
          ? barpolarColor.map(c => withAlpha(c, 0.72))
          : withAlpha(barpolarColor, 0.72);
        pattern = { shape: '/', solidity: 0.26, fillmode: 'overlay', fgcolor: Array.isArray(barpolarColor) ? undefined : barpolarColor, bgcolor: 'rgba(255,255,255,0.76)' };
        outlineColor = Array.isArray(barpolarColor) ? barpolarColor : barpolarColor;
        outlineWidth = Math.max(1.2, Math.min(userLineWidth, 4.5));
      } else if (styleVariant === 'crosshatch') {
        fillColor = Array.isArray(barpolarColor)
          ? barpolarColor.map(c => withAlpha(c, 0.58))
          : withAlpha(barpolarColor, 0.58);
        pattern = { shape: 'x', solidity: 0.22, fillmode: 'overlay', fgcolor: Array.isArray(barpolarColor) ? undefined : barpolarColor, bgcolor: 'rgba(255,255,255,0.76)' };
        outlineColor = Array.isArray(barpolarColor) ? barpolarColor : barpolarColor;
        outlineWidth = Math.max(1.2, Math.min(userLineWidth, 4.5));
      }
      t.marker = {
        ...(t.marker || {}),
        color: fillColor,
        opacity: userMarkerOpacity,
        line: { color: outlineColor, width: outlineWidth },
        ...(pattern ? { pattern } : {}),
      };
      if (Number.isFinite(Number(STATE.barWidth))) {
        const widthFrac = Math.max(0.18, Math.min(0.98, Number(STATE.barWidth)));
        t.width = Array.from({ length: barCount }, () => Number((widthFrac * (360 / Math.max(barCount, 1))).toFixed(3)));
      }
    }

    // ── Histogram ──
    if (t.type === 'histogram') {
      let histColor = color;
      let histLine = { color: '#ffffff', width: 0.8 };
      let pattern = undefined;
      if (styleVariant === 'outline') {
        histColor = withAlpha(color, 0.20);
        histLine = { color, width: 2.0 };
      } else if (styleVariant === 'hollow') {
        histColor = 'rgba(255,255,255,0.03)';
        histLine = { color, width: 2.0 };
      } else if (styleVariant === 'striped') {
        pattern = { shape: '/', solidity: 0.30, fillmode: 'overlay', fgcolor: color, bgcolor: 'rgba(255,255,255,0.88)' };
      } else if (styleVariant === 'crosshatch') {
        pattern = { shape: 'x', solidity: 0.24, fillmode: 'overlay', fgcolor: color, bgcolor: 'rgba(255,255,255,0.88)' };
      }
      t.marker = { ...(t.marker || {}), color: histColor, opacity: userMarkerOpacity, line: histLine, ...(pattern ? { pattern } : {}) };
      t.opacity = userMarkerOpacity;
      t.nbinsx = t.nbinsx || 28;
    }

    // ── Box ──
    if (t.type === 'box') {
      t.line = { ...(t.line || {}), color, width: Math.max(1.2, Math.min(styleVariant === 'bold' ? userLineWidth + 1 : userLineWidth, 5)) };
      t.fillcolor = styleVariant === 'outline' ? withAlpha(color, 0.10) : (styleVariant === 'minimal' ? 'rgba(255,255,255,0.02)' : withAlpha(color, 0.25));
      t.marker = { ...(t.marker || {}), color, size: styleVariant === 'minimal' ? 3.5 : 4.5, opacity: styleVariant === 'minimal' ? 0.35 : 0.55, line: { color: color, width: styleVariant === 'minimal' ? 1.0 : 0.5 } };
      t.boxmean = t.boxmean ?? 'sd';
      t.boxpoints = t.boxpoints ?? false;
      t.whiskerwidth = 0.7;
    }

    // ── Violin ──
    if (t.type === 'violin') {
      t.line = { ...(t.line || {}), color, width: Math.max(1.2, Math.min(styleVariant === 'bold' ? userLineWidth + 1 : userLineWidth, 5)) };
      t.fillcolor = styleVariant === 'outline' ? withAlpha(color, 0.12) : (styleVariant === 'minimal' ? withAlpha(color, 0.08) : withAlpha(color, 0.30));
      t.marker = { ...(t.marker || {}), color, opacity: styleVariant === 'minimal' ? 0.22 : 0.45, size: 3.5, line: { color: color, width: styleVariant === 'minimal' ? 0.9 : 0.3 } };
      t.meanline = { visible: true, color: ink, width: 1.2, ...(t.meanline || {}) };
      t.spanmode = t.spanmode || 'soft';
    }

    // ── Pie / Donut ──
    if (t.type === 'pie') {
      const sliceCount = Math.max((t.labels || []).length, (t.values || []).length, 1);
      t.marker = { ...(t.marker || {}), colors: buildIndexedPaletteColors(sliceCount, palette), line: { color: '#ffffff', width: 2.5 } };
      t.textfont = { ...(t.textfont || {}), family: fontFamily, size: 12 };
    }

    // ── Funnel ──
    if (t.type === 'funnel') {
      t.textfont = { ...(t.textfont || {}), family: fontFamily, size: 13 };
      const funnelCount = Math.max((t.y || []).length, (t.x || []).length, 1);
      t.marker = { ...(t.marker || {}), color: buildIndexedPaletteColors(funnelCount, palette), line: { color: '#ffffff', width: 2 } };
    }

    // ── Treemap ──
    if (t.type === 'treemap') {
      const treemapCount = Math.max((t.labels || []).length, (t.values || []).length, 1);
      t.marker = {
        ...(t.marker || {}),
        colors: Array.from({ length: treemapCount }, (_, idx) => palette[idx % palette.length]),
        line: { color: '#ffffff', width: 1.5, ...(t.marker?.line || {}) },
      };
      t.textfont = { ...(t.textfont || {}), family: fontFamily };
    }

    // ── Heatmap ──
    if (t.type === 'heatmap') {
      const isBinary = t.zmax === 1 && t.zmin === 0 && Array.isArray(t.colorscale) && t.colorscale.length === 4;
      if (customColorScale) {
        t.colorscale = customColorScale;
      } else if (!isBinary) {
        const isDivergent = t.zmin !== undefined && t.zmin < 0;
        const alreadyRich = Array.isArray(t.colorscale) && t.colorscale.length >= 8;
        if (!alreadyRich) {
          const themeScale = isDivergent
            ? (theme.divergentScale || [[0, '#B64C4C'], [0.5, '#F8FAFC'], [1, '#246B80']])
            : (theme.sequentialScale || [[0, '#F8FBFD'], [0.3, '#D6E8F3'], [0.6, '#78AAC8'], [1, '#1F5B89']]);
          t.colorscale = themeScale;
        }
      }
      t.hoverongaps = false;
      t.colorbar = {
        thickness: 18, len: 0.82, outlinewidth: 0,
        tickfont: { family: fontFamily, size: 10, color: ink },
        ...(t.colorbar || {}),
      };
    }

    // ── Choropleth ──
    if (t.type === 'choropleth') {
      t.colorscale = customColorScale || t.colorscale || theme.sequentialScale;
      t.marker = { line: { color: '#ffffff', width: 0.4 }, ...(t.marker || {}) };
      t.colorbar = { thickness: 12, outlinewidth: 0, tickfont: { family: fontFamily, size: 10, color: ink }, ...(t.colorbar || {}) };
    }

    // ── Sankey ──
    if (t.type === 'sankey') {
      if (t.node) {
        const nodeCount = Math.max((t.node.label || []).length, 1);
        t.node = { ...t.node, color: Array.from({ length: nodeCount }, (_, idx) => palette[idx % palette.length]), line: { color: '#ffffff', width: 1.5 } };
      }
      if (t.link && Array.isArray(t.link.source)) {
        t.link = {
          ...t.link,
          color: t.link.source.map((s, idx) => withAlpha(palette[Number(s) % palette.length] || palette[idx % palette.length], 0.34)),
        };
      }
    }

    // ── Parallel coordinates ──
    if (t.type === 'parcoords') {
      t.line = { ...(t.line || {}), colorscale: customColorScale || t.line?.colorscale };
      if (Array.isArray(t.dimensions)) {
        t.dimensions = t.dimensions.map(dim => ({
          ...dim,
          labelfont: { family: fontFamily, size: 11, color: ink, ...(dim.labelfont || {}) },
          tickfont: { family: fontFamily, size: 9, color: ink, ...(dim.tickfont || {}) },
        }));
      }
    }

    return t;
  });
}

function polishLayoutForPublication(layout, chartType, theme) {
  const l = { ...layout };
  const chartTypeKey = String(chartType || '').toLowerCase();
  const ink = theme.ink || '#111827';
  const family = theme.fontFamily || "'Arial', 'Noto Sans SC', sans-serif";
  const axisColor = theme.axisLineColor || '#26313D';
  const userPalette = STATE.userColors && STATE.userColors.length > 0 ? STATE.userColors : null;
  const customPalette = typeof getActivePalette === 'function' ? getActivePalette() : null;
  const basePalette = userPalette || customPalette || theme.colorway || ['#2E6F9E', '#D95F59', '#2A9D8F', '#E9A93A'];
  const palette = typeof expandPalette === 'function' ? expandPalette(basePalette, 24) : basePalette;
  const isSetPlot = ['venn', 'upset'].includes(chartType);
  const isSpatial = ['china_map', 'china_bubble_map', 'world_map', 'world_bubble_map', 'usa_map', 'europe_map', 'uk_map'].includes(chartType);
  const isHeatmap = ['heatmap', 'correlation_heatmap', 'missingness_heatmap'].includes(chartType);
  const isPolar = Boolean(l.polar) || chartTypeKey.includes('polar') || chartTypeKey === 'radar';
  const isPieLike = ['donut', 'pie', 'funnel', 'treemap', 'sankey', 'polar_bar', 'barpolar'].includes(chartTypeKey);

  l.paper_bgcolor = theme.bgColor || '#ffffff';
  l.plot_bgcolor = theme.plotBgColor || '#ffffff';

  const bgPreset = STATE.chartBgPreset || 'white';
  if (bgPreset === 'transparent') {
    l.paper_bgcolor = 'rgba(255,255,255,0)';
    l.plot_bgcolor = 'rgba(255,255,255,0)';
  } else {
    l.paper_bgcolor = '#ffffff';
    l.plot_bgcolor = '#ffffff';
  }

  l.dragmode = false;
  l.separators = '.';
  l.bargap = l.bargap ?? 0.24;
  l.bargroupgap = l.bargroupgap ?? 0.16;
  l.hoverlabel = {
    bgcolor: '#ffffff',
    bordercolor: theme.axisLineColor || '#D7DEE8',
    font: { family, color: ink, size: 12 },
    ...(l.hoverlabel || {}),
  };
  l.legend = {
    orientation: 'h',
    x: 0, y: -0.12,
    xanchor: 'left', yanchor: 'top',
    bgcolor: 'rgba(255,255,255,0)',
    borderwidth: 0,
    tracegroupgap: 10,
    itemwidth: 28,
    font: { family, size: Math.max(12, theme.legendFontSize || 12), color: ink },
    ...(l.legend || {}),
  };
  l.title = normalizePublicationTitle(l.title, theme, chartType);

  if (!isSetPlot && !isSpatial && !isPieLike) {
    if (!l.xaxis) l.xaxis = {};
    if (!l.yaxis) l.yaxis = {};
  }

  const axisKeys = Object.keys(l).filter(k => /^xaxis\d*$|^yaxis\d*$/.test(k));
  axisKeys.forEach((key) => {
    const prev = l[key] || {};
    if (prev.visible === false) return;
    const isY = key.startsWith('yaxis');
    l[key] = {
      showline: false,
      linewidth: 0,
      mirror: false,
      ticks: 'outside',
      ticklen: 5,
      tickwidth: 1,
      tickcolor: axisColor,
      zeroline: false,
      showgrid: ((STATE.chartGridMode || 'grid') === 'grid') ? isY : false,
      gridcolor: STATE.chartGridColor || theme.gridColor || 'rgba(31,41,55,0.07)',
      gridwidth: 0.6,
      automargin: true,
      tickfont: { family, size: Math.max(13, theme.tickFontSize || 13), color: ink },
      title: {
        font: { family, size: Math.max(16, theme.axisFontSize || 16), color: ink },
        standoff: 16,
        ...(typeof prev.title === 'string' ? { text: prev.title } : (prev.title || {})),
      },
      ...(prev || {}),
      showline: false,
      linewidth: 0,
    };
  });

  // Polar layout theming
  if (l.polar) {
    const polarBg = (STATE.chartBgPreset || 'white') === 'transparent' ? 'rgba(255,255,255,0)' : '#ffffff';
    const showPolarGrid = (STATE.chartGridMode || 'grid') === 'grid';
    l.polar = {
      ...l.polar,
      bgcolor: polarBg,
      radialaxis: {
        ...(l.polar.radialaxis || {}),
        showgrid: showPolarGrid,
        showline: true,
        linewidth: 1.2,
        gridcolor: showPolarGrid ? (STATE.chartGridColor || theme.gridColor || 'rgba(31,41,55,0.10)') : 'rgba(0,0,0,0)',
        linecolor: axisColor,
        ticks: 'outside',
        ticklen: 4,
        tickwidth: 1,
        tickcolor: axisColor,
        tickfont: { family, size: 9, color: ink },
      },
      angularaxis: {
        ...(l.polar.angularaxis || {}),
        showgrid: showPolarGrid,
        showline: true,
        linewidth: 1.0,
        gridcolor: showPolarGrid ? (STATE.chartGridColor || theme.gridColor || 'rgba(31,41,55,0.08)') : 'rgba(0,0,0,0)',
        linecolor: axisColor,
        direction: l.polar?.angularaxis?.direction || 'clockwise',
        ticks: '',
        tickfont: { family, size: 11, color: ink },
      },
    };

    const polarDomain = l.polar.domain || {};
    const xDomain = Array.isArray(polarDomain.x) ? polarDomain.x : [0.08, 0.92];
    const yDomain = Array.isArray(polarDomain.y) ? polarDomain.y : [0.08, 0.92];
    const polarCx = (Number(xDomain[0]) + Number(xDomain[1])) / 2;
    const polarCy = (Number(yDomain[0]) + Number(yDomain[1])) / 2;
    const polarRadius = Math.max(0.12, Math.min(
      Math.abs(Number(xDomain[1]) - Number(xDomain[0])),
      Math.abs(Number(yDomain[1]) - Number(yDomain[0])),
    ) / 2);
    const existingPolarAnnots = (Array.isArray(l.annotations) ? l.annotations : [])
      .filter(a => !a || a.meta?.visualRole !== 'polarAxisArrow');
    l.annotations = [
      {
        x: polarCx + polarRadius * 0.88,
        y: polarCy,
        xref: 'paper', yref: 'paper',
        ax: polarCx + polarRadius * 0.74,
        ay: polarCy,
        axref: 'paper', ayref: 'paper',
        showarrow: true,
        arrowhead: 3,
        arrowsize: 1.05,
        arrowwidth: 1.2,
        arrowcolor: axisColor,
        text: '',
        meta: { visualRole: 'polarAxisArrow' },
      },
      {
        x: polarCx + polarRadius * 0.44,
        y: polarCy + polarRadius * 0.78,
        xref: 'paper', yref: 'paper',
        ax: polarCx + polarRadius * 0.57,
        ay: polarCy + polarRadius * 0.70,
        axref: 'paper', ayref: 'paper',
        showarrow: true,
        arrowhead: 3,
        arrowsize: 1.05,
        arrowwidth: 1.2,
        arrowcolor: axisColor,
        text: '',
        meta: { visualRole: 'polarAxisArrow' },
      },
      ...existingPolarAnnots,
    ];
  }

  if (l.geo) {
    l.geo = {
      bgcolor: 'rgba(0,0,0,0)',
      lakecolor: '#ffffff',
      landcolor: '#F5F2EF',
      countrycolor: '#ffffff',
      coastlinecolor: '#B0BEC5',
      coastlinewidth: 0.5,
      showframe: false,
      domain: { x: [0, 1], y: [0, 1] },
      ...(l.geo || {}),
    };
  }

  if (['heatmap', 'correlation_heatmap', 'missingness_heatmap'].includes(chartType)) {
    l.margin = { l: 160, r: 90, t: 85, b: 120, ...(l.margin || {}) };
  }
  if (chartType === 'upset') l.margin = { l: 80, r: 70, t: 85, b: 70, ...(l.margin || {}) };
  if (chartType === 'venn') l.margin = { l: 20, r: 20, t: 80, b: 30, ...(l.margin || {}) };
  if (chartType === 'sankey') l.margin = { l: 20, r: 20, t: 80, b: 30, ...(l.margin || {}) };
  if (chartType === 'treemap') l.margin = { l: 10, r: 10, t: 78, b: 10, ...(l.margin || {}) };
  if (chartType === 'ridgeline') l.margin = { l: 72, r: 48, t: 78, b: 60, ...(l.margin || {}) };
  if (isSpatial) {
    l.margin = { l: 10, r: 10, t: 60, b: 10, ...(l.margin || {}) };
    l.legend = { ...(l.legend || {}), y: -0.05 };
    l.geo = { ...(l.geo || {}), domain: { x: [0.01, 0.99], y: [0.01, 0.96] } };
  }

  if (chartType === 'venn' && Array.isArray(l.shapes)) {
    let circleIdx = 0;
    l.shapes = l.shapes.map((shape) => {
      if (shape.type !== 'circle') return shape;
      const c = palette[circleIdx % palette.length];
      circleIdx += 1;
      return {
        ...shape,
        fillcolor: withAlpha(c, 0.20),
        line: { ...(shape.line || {}), color: c, width: shape.line?.width || 2.2 },
      };
    });
  }

  // Draw coordinate axes as clean L-shaped lines with arrow tips
  // Skip for special chart types that don't use standard axes
  if (!isSetPlot && !isSpatial && !isHeatmap && !isPieLike && !isPolar) {
    const existingAnnots = Array.isArray(l.annotations) ? l.annotations : [];
    const existingShapes = Array.isArray(l.shapes) ? l.shapes : [];
    l.shapes = [
      ...existingShapes,
      {
        type: 'line',
        xref: 'x domain', yref: 'y domain',
        x0: 0, y0: 0, x1: 1, y1: 0,
        line: { color: axisColor, width: 1.5 },
        layer: 'above',
      },
      {
        type: 'line',
        xref: 'x domain', yref: 'y domain',
        x0: 0, y0: 0, x1: 0, y1: 1,
        line: { color: axisColor, width: 1.5 },
        layer: 'above',
      },
    ];
    l.annotations = [
      {
        x: 1.02, y: 0,
        xref: 'x domain', yref: 'y domain',
        ax: 0.97, ay: 0,
        axref: 'x domain', ayref: 'y domain',
        showarrow: true,
        arrowhead: 3,
        arrowsize: 1.2,
        arrowwidth: 1.5,
        arrowcolor: axisColor,
        text: '',
      },
      {
        x: 0, y: 1.03,
        xref: 'x domain', yref: 'y domain',
        ax: 0, ay: 0.97,
        axref: 'x domain', ayref: 'y domain',
        showarrow: true,
        arrowhead: 3,
        arrowsize: 1.2,
        arrowwidth: 1.5,
        arrowcolor: axisColor,
        text: '',
      },
      ...existingAnnots,
    ];
  }

  return l;
}

function normalizePublicationTitle(title, theme, chartType) {
  const titleObj = typeof title === 'string' ? { text: title } : (title || { text: '' });
  return {
    ...titleObj,
    x: titleObj.x ?? 0.02,
    y: titleObj.y ?? 0.97,
    xanchor: titleObj.xanchor || 'left',
    yanchor: titleObj.yanchor || 'top',
    font: {
      family: theme.fontFamily,
      color: theme.titleColor || theme.ink || '#111827',
      size: titleObj.font?.size || Math.max(20, theme.titleFontSize || 20),
      ...(titleObj.font || {}),
    },
  };
}

function withAlpha(hex, alpha) {
  if (!hex || !String(hex).startsWith('#')) return hex;
  const clean = String(hex).slice(1);
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ── ResizeObserver ───────────────────────────────────
function disconnectChartResizeObserver() {
  if (STATE.currentChartResizeObserver) {
    STATE.currentChartResizeObserver.disconnect();
    STATE.currentChartResizeObserver = null;
  }
}

function getChartFrameSize(plotMount, chartType) {
  const preview = el('chartPreviewContainer') || plotMount.parentElement;
  const previewStyle = preview ? getComputedStyle(preview) : null;
  const padX = previewStyle ? parseFloat(previewStyle.paddingLeft || 0) + parseFloat(previewStyle.paddingRight || 0) : 0;
  const padY = previewStyle ? parseFloat(previewStyle.paddingTop || 0) + parseFloat(previewStyle.paddingBottom || 0) : 0;
  const width = Math.max(560, Math.floor((preview?.clientWidth || 900) - padX));
  const spatial = ['china_map', 'china_bubble_map', 'world_map', 'world_bubble_map', 'usa_map', 'europe_map', 'uk_map'].includes(chartType);
  const setPlot = ['venn', 'upset'].includes(chartType);
  const isPieLike = ['donut', 'pie', 'funnel', 'treemap', 'sankey', 'radar', 'polar_bar', 'barpolar'].includes(chartType);
  const isHeatmap = ['heatmap', 'correlation_heatmap', 'missingness_heatmap'].includes(chartType);
  const minHeight = spatial ? 520 : (setPlot ? 520 : (isPieLike ? 520 : (isHeatmap ? 560 : 480)));
  const availableHeight = Math.floor((preview?.clientHeight || 0) - padY);
  const viewportHeight = Math.floor(window.innerHeight * 0.56);
  const height = Math.max(minHeight, availableHeight, viewportHeight);
  return { width, height };
}

function fitChartPlotToFrame(plotMount, chartType) {
  const size = getChartFrameSize(plotMount, chartType);
  const scale = 1.0;
  const preview = plotMount.parentElement;
  const previewStyle = preview ? getComputedStyle(preview) : null;
  const padX = previewStyle ? parseFloat(previewStyle.paddingLeft || 0) + parseFloat(previewStyle.paddingRight || 0) : 0;
  const padY = previewStyle ? parseFloat(previewStyle.paddingTop || 0) + parseFloat(previewStyle.paddingBottom || 0) : 0;
  const maxW = Math.max(320, Math.floor((preview?.clientWidth || 900) - padX));
  const maxH = Math.max(320, Math.floor((preview?.clientHeight || 600) - padY));
  const w = Math.min(maxW, Math.max(320, Math.floor(size.width * scale)));
  const h = Math.min(maxH, Math.max(320, Math.floor(size.height * scale)));
  plotMount.style.width = `${w}px`;
  plotMount.style.height = `${h}px`;
  plotMount.style.minHeight = `${h}px`;
  return { width: w, height: h };
}

function syncCurrentPlotlyLayoutFromDom(plotMount) {
  if (!plotMount || !plotMount._fullLayout || !STATE.currentPlotlyLayout) return;
  const width = Math.floor(plotMount._fullLayout.width || plotMount.clientWidth || STATE.currentPlotlyLayout.width || 0);
  const height = Math.floor(plotMount._fullLayout.height || plotMount.clientHeight || STATE.currentPlotlyLayout.height || 0);
  if (width > 0 && height > 0) {
    STATE.currentPlotlyLayout = {
      ...STATE.currentPlotlyLayout,
      width,
      height,
      autosize: false,
    };
  }
}

function installChartResizeObserver(plotMount, chartType) {
  if (!window.ResizeObserver) return;
  let resizeFrame = null;
  const observer = new ResizeObserver(() => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const size = fitChartPlotToFrame(plotMount, chartType);
      if (window.Plotly && plotMount.isConnected) {
        const relayoutPromise = Plotly.relayout(plotMount, { width: size.width, height: size.height, autosize: false });
        if (relayoutPromise && typeof relayoutPromise.then === 'function') {
          relayoutPromise.then(() => syncCurrentPlotlyLayoutFromDom(plotMount));
        } else {
          syncCurrentPlotlyLayoutFromDom(plotMount);
        }
        if (STATE.currentPlotlyLayout) {
          STATE.currentPlotlyLayout = { ...STATE.currentPlotlyLayout, width: size.width, height: size.height, autosize: false };
        }
      }
    });
  });
  observer.observe(plotMount.parentElement || plotMount);
  STATE.currentChartResizeObserver = observer;
}

// ── Data loading ─────────────────────────────────────
async function loadChartDataset(config) {
  const body = STATE.uploadId ? {
    upload_id: STATE.uploadId,
    sheet_name: STATE.activeSheet || undefined,
    use_demo: false,
  } : {
    use_demo: true,
    dataset_name: STATE.datasetName || config.exampleDataset || 'baseline_table_example',
  };
  const result = await apiPost('/api/dataset/data', body);
  if (!STATE.uploadId && result.name) STATE.datasetName = result.name;
  saveActiveChartWorkspace();
  return result.data || {};
}

function collectChartParams() {
  const params = {};
  qsa('.chart-var-select').forEach(sel => {
    const name = sel.id.replace('chartVar_', '');
    if (sel.multiple) {
      const selected = Array.from(sel.selectedOptions).map(o => o.value).filter(Boolean);
      if (selected.length > 0) params[name] = selected;
    } else {
      if (sel.value) params[name] = sel.value;
    }
  });
  if (params.value_vars && !Array.isArray(params.value_vars)) params.value_vars = [params.value_vars];
  return params;
}

function buildDataFromState() {
  const data = {};
  const rows = STATE.previewRows || [];
  const cols = STATE.columns || [];
  if (rows.length === 0 || cols.length === 0) return data;
  cols.forEach(c => { data[c] = []; });
  rows.forEach(r => { cols.forEach(c => { data[c].push(r[c] !== undefined && r[c] !== null ? r[c] : ''); }); });
  return data;
}

// ── CSV parsing ──────────────────────────────────────
function parseCSV(text) {
  if (!text || text.trim().length === 0) return {};
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === '\n' && !inQuotes) { lines.push(current); current = ''; }
    else if (ch === '\r' && !inQuotes) {}
    else current += ch;
  }
  if (current) lines.push(current);
  if (lines.length < 2) return {};
  const headers = parseCSVLine(lines[0]);
  const data = {};
  headers.forEach(h => { data[h] = []; });
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    headers.forEach((h, j) => { data[h].push(j < vals.length ? vals[j] : ''); });
  }
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

// Restored preview sizing: keep the rendered figure centered with publication
// whitespace instead of stretching every Plotly canvas to the full preview box.
function getChartFrameSize(plotMount, chartType) {
  const preview = el('chartPreviewContainer') || plotMount.parentElement;
  const previewStyle = preview ? getComputedStyle(preview) : null;
  const padX = previewStyle ? parseFloat(previewStyle.paddingLeft || 0) + parseFloat(previewStyle.paddingRight || 0) : 0;
  const padY = previewStyle ? parseFloat(previewStyle.paddingTop || 0) + parseFloat(previewStyle.paddingBottom || 0) : 0;
  const maxW = Math.max(520, Math.floor((preview?.clientWidth || 960) - padX));
  const maxH = Math.max(440, Math.floor((preview?.clientHeight || 680) - padY));
  const spatial = ['china_map', 'china_bubble_map', 'world_map', 'world_bubble_map', 'usa_map', 'europe_map', 'uk_map'].includes(chartType);
  const setPlot = ['venn', 'upset'].includes(chartType);
  const pieLike = ['donut', 'pie', 'funnel', 'treemap', 'sankey', 'radar', 'polar_bar', 'barpolar'].includes(chartType);
  const heatmap = ['heatmap', 'correlation_heatmap', 'missingness_heatmap'].includes(chartType);
  const aspect = chartType === 'sankey' ? 1.90
    : (heatmap ? 1.85
      : (spatial ? 1.55
        : (pieLike ? 1.18
          : (setPlot ? 1.45 : 1.62))));
  const usableW = Math.max(360, Math.floor(maxW * 0.90));
  const usableH = Math.max(360, Math.floor(maxH * 0.88));
  let width = Math.floor(usableH * aspect);
  let height = usableH;
  if (width > usableW) {
    width = usableW;
    height = Math.floor(width / aspect);
  }
  const minH = spatial ? 500 : (heatmap ? 500 : (pieLike ? 440 : 480));
  if (height < Math.min(minH, usableH)) {
    height = Math.min(minH, usableH);
    width = Math.min(usableW, Math.floor(height * aspect));
  }
  return { width, height };
}

function fitChartPlotToFrame(plotMount, chartType) {
  const size = getChartFrameSize(plotMount, chartType);
  plotMount.style.setProperty('width', `${size.width}px`, 'important');
  plotMount.style.setProperty('height', `${size.height}px`, 'important');
  plotMount.style.setProperty('min-height', `${size.height}px`, 'important');
  plotMount.style.setProperty('max-width', '100%', 'important');
  plotMount.style.setProperty('max-height', '100%', 'important');
  return size;
}
