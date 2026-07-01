/* ── File Upload Module ────────────────────────────────── */

var _uploadAbortController = null;

async function handleFile(file, options) {
  options = options || {};
  var uploadBtn = dom('uploadDataBtn');
  if (_uploadAbortController) _uploadAbortController.abort();
  _uploadAbortController = new AbortController();
  var timeoutId = setTimeout(function() { _uploadAbortController.abort(); }, 120000);

  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = '读取中...'; }

  var formData = new FormData();
  formData.append('file', file);

  try {
    if (options.fromChart) showToast('正在读取 ' + file.name + '...', 'info');
    var res = await fetch('/api/upload', { method: 'POST', body: formData, signal: _uploadAbortController.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      var err = await res.json().catch(function() { return { detail: 'Upload failed' }; });
      throw new Error(err.detail || 'HTTP ' + res.status);
    }
    var data = await res.json();
    updateStateFromData(data);
    STATE.datasetName = null;

    if (data.sheet_names && data.sheet_names.length > 1) {
      renderSheetSelector(data.sheet_names);
    }
    updatePreviewTableFromState();
    if (typeof autoRecommendCurrentRoles === 'function') {
      autoRecommendCurrentRoles({ quiet: true, render: typeof APP !== 'undefined' && APP.activeStep === 'variables' });
    }
    showToast('文件 "' + data.filename + '" 已加载', 'success');
  } catch (err) {
    clearTimeout(timeoutId);
    var msg = err.name === 'AbortError' ? '上传超时' : '上传失败: ' + err.message;
    showToast(msg, 'error');
  } finally {
    if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = '选择文件'; }
    _uploadAbortController = null;
  }
}

function updateStateFromData(data) {
  STATE.uploadId = data.upload_id;
  STATE.fileName = data.filename;
  STATE.fileType = data.file_type;
  STATE.sheetNames = data.sheet_names || [];
  STATE.activeSheet = data.sheet_name || null;
  STATE.columns = data.columns;
  STATE.dtypes = data.dtypes || {};
  STATE.variableTypes = data.variable_types || {};
  STATE.rowCount = data.row_count;
  STATE.colCount = data.col_count;
  STATE.previewRows = data.preview || [];
  STATE.summary = data.summary || {};
}

function renderSheetSelector(sheets) {
  var sheetRow = dom('sheetRow');
  if (!sheetRow) return;
  sheetRow.hidden = false;
  var sheetSelect = dom('sheetSelect');
  if (!sheetSelect) return;
  sheetSelect.innerHTML = sheets.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
  sheetSelect.value = STATE.activeSheet || sheets[0];
  var newSelect = sheetSelect.cloneNode(true);
  sheetSelect.parentNode.replaceChild(newSelect, sheetSelect);
  newSelect.addEventListener('change', async function() {
    var sheet = newSelect.value;
    try {
      var data2 = await apiPost('/api/read-sheet', { upload_id: STATE.uploadId, sheet_name: sheet });
      updateStateFromData(Object.assign({}, data2, { sheet_name: sheet, filename: STATE.fileName, file_type: STATE.fileType, sheet_names: STATE.sheetNames }));
      updatePreviewTableFromState();
      showToast('已切换到工作表: ' + sheet, 'success');
    } catch (e) {
      showToast('切换失败: ' + e.message, 'error');
    }
  });
}

async function loadExampleDataset(name, options) {
  options = options || {};
  var btn = dom('loadExampleBtn');
  if (btn && !options.silent) { btn.disabled = true; btn.textContent = '加载中...'; }

  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

  try {
    var res = await fetch('/api/examples/' + name, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      var err = await res.json().catch(function() { return { detail: 'HTTP ' + res.status }; });
      throw new Error(err.detail || '请求失败');
    }
    var data = await res.json();
    updateStateFromData(Object.assign({}, data, { upload_id: null, filename: data.filename, file_type: '.csv' }));
    STATE.datasetName = name;
    updatePreviewTableFromState();
    if (typeof autoRecommendCurrentRoles === 'function') {
      autoRecommendCurrentRoles({ quiet: true, render: typeof APP !== 'undefined' && APP.activeStep === 'variables' });
    }
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    showToast('加载失败: ' + e.message, 'error');
    throw e;
  } finally {
    if (btn && !options.silent) { btn.disabled = false; btn.textContent = '加载示例数据'; }
  }
}

/* ── Upload handlers for 4-step workflow ─────────────────── */
function setupUploadHandlers() {
  var fileInput = dom('wsFileInput');
  var uploadBtn = dom('uploadDataBtn');
  var loadExampleBtn = dom('loadExampleBtn');
  var cancelBtn = dom('cancelUploadBtn');
  var fileNameInput = dom('uploadedFileNameInput');
  var dataNextBtn = dom('dataNextBtn');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', function() { fileInput.click(); });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async function() {
      var file = fileInput.files[0];
      if (!file) return;
      if (fileNameInput) fileNameInput.value = file.name;
      if (cancelBtn) cancelBtn.disabled = false;
      await handleFile(file);
      if (dataNextBtn) dataNextBtn.disabled = false;
    });
  }

  if (loadExampleBtn) {
    loadExampleBtn.addEventListener('click', async function() {
      var name = STATE.activeChartType
        ? ((getTestConfig(STATE.activeChartType) || {}).exampleDataset || 'comprehensive_example')
        : 'comprehensive_example';
      try {
        await loadExampleDataset(name);
        if (dataNextBtn) dataNextBtn.disabled = false;
        showToast('示例数据加载成功！', 'success');
      } catch (e) {
        showToast('示例加载失败: ' + e.message, 'error');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      STATE.uploadId = null;
      STATE.fileName = null;
      if (fileNameInput) fileNameInput.value = '';
      cancelBtn.disabled = true;
      if (dataNextBtn) dataNextBtn.disabled = true;
      resetDatasetState();
      updatePreviewTableFromState();
      showToast('已取消上传', 'info');
    });
  }

  var downloadExampleBtn = dom('downloadExampleBtn');
  if (downloadExampleBtn) {
    downloadExampleBtn.addEventListener('click', function() {
      var name = STATE.datasetName || 'comprehensive_example';
      window.open('/api/examples/' + name + '/download', '_blank');
    });
  }
}

function updatePreviewTableFromState() {
  var metaEl = dom('wsDataMeta');
  var previewTable = dom('previewTable');
  var dataStatusBar = dom('dataStatusBar');

  if (metaEl) {
    if (STATE.columns && STATE.columns.length > 0) {
      metaEl.textContent = (STATE.rowCount || 0) + ' 行 × ' + (STATE.colCount || 0) + ' 列 · ' + (STATE.fileName || STATE.datasetName || '已加载');
    } else {
      metaEl.textContent = '请先选择统计方法，再上传数据或加载示例数据。';
    }
  }

  if (dataStatusBar && STATE.rowCount > 0) {
    var mp = STATE.summary && STATE.summary.missing_percent != null ? parseFloat(STATE.summary.missing_percent).toFixed(1) + '%' : '';
    dataStatusBar.textContent = (STATE.rowCount || 0) + ' 行 × ' + (STATE.colCount || 0) + ' 列 · 缺失: ' + mp;
  }

  if (previewTable && STATE.previewRows && STATE.previewRows.length > 0 && STATE.columns) {
    var cols = STATE.columns.slice(0, 12);
    var html = '<table class="data-table"><thead><tr>';
    cols.forEach(function(c) { html += '<th>' + escapeHtml(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    STATE.previewRows.slice(0, 50).forEach(function(row) {
      html += '<tr>';
      cols.forEach(function(c) { html += '<td>' + escapeHtml(String(row[c] != null ? row[c] : '')) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    previewTable.innerHTML = html;
  } else if (previewTable) {
    previewTable.innerHTML = '<div class="empty-state small">等待数据载入</div>';
  }
}
