import * as pdfjsLib from "./vendor/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.mjs";

const state = {
  documents: new Map(),
  pages: [],
  selected: new Set(),
  dragIndex: null,
  busy: false,
};

const els = {
  addFiles: document.querySelector("#add-files"),
  pptAdd: document.querySelector("#ppt-add"),
  pptSave: document.querySelector("#ppt-save"),
  wordAdd: document.querySelector("#word-add"),
  wordSave: document.querySelector("#word-save"),
  pptNup: document.querySelector("#ppt-nup"),
  fileList: document.querySelector("#file-list"),
  docCount: document.querySelector("#doc-count"),
  pageGrid: document.querySelector("#page-grid"),
  empty: document.querySelector("#empty-state"),
  rotateLeft: document.querySelector("#rotate-left"),
  rotateRight: document.querySelector("#rotate-right"),
  deletePages: document.querySelector("#delete-pages"),
  selectAll: document.querySelector("#select-all"),
  clearSelect: document.querySelector("#clear-select"),
  splitRanges: document.querySelector("#split-ranges"),
  splitBtn: document.querySelector("#split-btn"),
  exportBtn: document.querySelector("#export-btn"),
  busyOverlay: document.querySelector("#busy-overlay"),
  busyTitle: document.querySelector("#busy-title"),
  busyDetail: document.querySelector("#busy-detail"),
  toast: document.querySelector("#toast"),
};

els.addFiles.addEventListener("click", addFiles);
els.pptAdd.addEventListener("click", () => convertOffice("ppt", "add"));
els.pptSave.addEventListener("click", () => convertOffice("ppt", "save"));
els.wordAdd.addEventListener("click", () => convertOffice("word", "add"));
els.wordSave.addEventListener("click", () => convertOffice("word", "save"));
els.rotateLeft.addEventListener("click", () => rotateSelected(-90));
els.rotateRight.addEventListener("click", () => rotateSelected(90));
els.deletePages.addEventListener("click", deleteSelected);
els.selectAll.addEventListener("click", selectAll);
els.clearSelect.addEventListener("click", clearSelection);
els.exportBtn.addEventListener("click", exportPdf);
els.splitBtn.addEventListener("click", splitPdf);

refreshControls();

async function addFiles() {
  setBusy(true, "正在添加 PDF", "请选择文件并等待页面加载。");
  try {
    const data = await api("/api/open-files", {});
    if (data.cancelled) return;
    addDocumentsToWorkspace(data.documents);
    toast(`已添加 ${data.documents.length} 个 PDF`);
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

async function convertOffice(kind, mode) {
  const isPpt = kind === "ppt";
  const action = mode === "add" ? "并加入编辑区" : "并保存";
  const label = isPpt ? "PPT" : "Word";
  const nup = isPpt ? Number.parseInt(els.pptNup.value, 10) : 1;
  const nupText = isPpt && nup > 1 ? `，${nup}合1` : "";
  setBusy(true, `正在转换 ${label}`, `正在生成 PDF${nupText}${action}。`);
  try {
    const data = await api(`/api/convert-${kind}-${mode}`, { nup });
    if (data.cancelled) return;
    if (mode === "add") {
      addDocumentsToWorkspace(data.documents);
      const engines = summarizeEngines(data.converted);
      toast(`已转换并加入 ${data.documents.length} 个文件${engines}`);
    } else {
      const engines = summarizeEngines(data.results);
      toast(`已转换 ${data.results.length} 个 PDF${engines}`);
    }
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

function addDocumentsToWorkspace(documents) {
  for (const doc of documents) {
    state.documents.set(doc.id, { ...doc, pdf: null });
    for (let i = 0; i < doc.pages; i += 1) {
      state.pages.push({
        key: crypto.randomUUID(),
        fileId: doc.id,
        pageIndex: i,
        rotation: 0,
      });
    }
  }
  renderFiles();
  renderPages();
}

async function renderPages() {
  els.empty.style.display = state.pages.length ? "none" : "grid";
  els.pageGrid.innerHTML = "";
  state.pages.forEach((page, index) => {
    const doc = state.documents.get(page.fileId);
    const card = document.createElement("article");
    card.className = `page-card${state.selected.has(page.key) ? " selected" : ""}`;
    card.draggable = true;
    card.dataset.key = page.key;
    card.dataset.index = String(index);
    card.innerHTML = `
      <div class="thumb-wrap"><canvas width="120" height="168"></canvas></div>
      <div class="page-info">
        <div class="page-title">第 ${index + 1} 页</div>
        <div class="page-source">${escapeHtml(doc?.name || "")} · 原第 ${page.pageIndex + 1} 页</div>
      </div>
    `;
    card.addEventListener("click", (event) => togglePage(page.key, event));
    card.addEventListener("dragstart", onDragStart);
    card.addEventListener("dragover", onDragOver);
    card.addEventListener("drop", onDrop);
    card.addEventListener("dragend", onDragEnd);
    els.pageGrid.appendChild(card);
    renderThumb(page, card.querySelector("canvas")).catch((err) => {
      card.querySelector(".thumb-wrap").textContent = "预览失败";
      console.error(err);
    });
  });
  refreshControls();
}

function renderFiles() {
  els.fileList.innerHTML = "";
  const docs = [...state.documents.values()];
  els.docCount.textContent = docs.length ? `${docs.length} 个文件，${state.pages.length} 页` : "未添加文件";
  for (const doc of docs) {
    const card = document.createElement("div");
    card.className = "file-card";
    card.innerHTML = `
      <div class="file-name">${escapeHtml(doc.name)}</div>
      <div class="file-meta">${doc.pages} 页${doc.encrypted ? " · 已加密" : ""}</div>
    `;
    els.fileList.appendChild(card);
  }
}

async function renderThumb(page, canvas) {
  const doc = state.documents.get(page.fileId);
  if (!doc.pdf) {
    doc.pdf = await pdfjsLib.getDocument({ url: `/api/file/${doc.id}` }).promise;
  }
  const pdfPage = await doc.pdf.getPage(page.pageIndex + 1);
  const viewport = pdfPage.getViewport({ scale: 0.24, rotation: page.rotation });
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.ceil(viewport.width * ratio);
  canvas.height = Math.ceil(viewport.height * ratio);
  canvas.style.width = `${Math.ceil(viewport.width)}px`;
  canvas.style.height = `${Math.ceil(viewport.height)}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
}

function togglePage(key, event) {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
    state.selected.clear();
  }
  if (state.selected.has(key)) {
    state.selected.delete(key);
  } else {
    state.selected.add(key);
  }
  renderPages();
}

function rotateSelected(degrees) {
  for (const page of state.pages) {
    if (state.selected.has(page.key)) {
      page.rotation = (page.rotation + degrees + 360) % 360;
    }
  }
  renderPages();
}

function deleteSelected() {
  if (!state.selected.size) return;
  if (!confirm(`删除选中的 ${state.selected.size} 页？`)) return;
  state.pages = state.pages.filter((page) => !state.selected.has(page.key));
  state.selected.clear();
  renderFiles();
  renderPages();
}

function selectAll() {
  state.selected = new Set(state.pages.map((page) => page.key));
  renderPages();
}

function clearSelection() {
  state.selected.clear();
  renderPages();
}

async function exportPdf() {
  if (!state.pages.length) return;
  setBusy(true, "正在导出 PDF", "请选择保存位置并等待写入完成。");
  try {
    const data = await api("/api/export", {
      pages: state.pages.map(({ fileId, pageIndex, rotation }) => ({ fileId, pageIndex, rotation })),
      defaultName: "合并输出.pdf",
    });
    if (data.cancelled) return;
    toast(`已导出 ${data.result.pages} 页：${data.result.path}`);
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

async function splitPdf() {
  const ranges = parseRanges(els.splitRanges.value);
  if (!ranges.length) {
    toast("请输入拆分范围，例如 1-3,8,10-12", true);
    return;
  }
  if (!state.pages.length) return;
  const firstFile = state.pages[0].fileId;
  if (!state.pages.every((page) => page.fileId === firstFile)) {
    toast("拆分范围模式适用于单个 PDF；多个文件请先导出合并结果。", true);
    return;
  }
  setBusy(true, "正在拆分 PDF", "请选择输出文件夹并等待拆分完成。");
  try {
    const data = await api("/api/split", {
      ranges: ranges.map((range) => ({ fileId: firstFile, ...range })),
    });
    if (data.cancelled) return;
    toast(`已拆分 ${data.results.length} 个文件`);
  } catch (err) {
    toast(err.message, true);
  } finally {
    setBusy(false);
  }
}

function parseRanges(text) {
  return text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [start, end] = chunk.split("-").map((value) => Number.parseInt(value, 10));
      return { start, end: Number.isFinite(end) ? end : start };
    })
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end));
}

function onDragStart(event) {
  const card = event.currentTarget;
  state.dragIndex = Number.parseInt(card.dataset.index, 10);
  card.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function onDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function onDrop(event) {
  event.preventDefault();
  const targetIndex = Number.parseInt(event.currentTarget.dataset.index, 10);
  if (!Number.isFinite(state.dragIndex) || state.dragIndex === targetIndex) return;
  const [moved] = state.pages.splice(state.dragIndex, 1);
  state.pages.splice(targetIndex, 0, moved);
  state.dragIndex = null;
  renderPages();
}

function onDragEnd(event) {
  event.currentTarget.classList.remove("dragging");
  state.dragIndex = null;
}

async function api(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "操作失败");
  }
  return data;
}

function refreshControls() {
  const hasPages = state.pages.length > 0;
  const hasSelection = state.selected.size > 0;
  for (const button of [
    els.rotateLeft,
    els.rotateRight,
    els.deletePages,
    els.selectAll,
    els.clearSelect,
    els.exportBtn,
    els.splitBtn,
  ]) {
    button.disabled = state.busy || !hasPages;
  }
  els.rotateLeft.disabled = state.busy || !hasSelection;
  els.rotateRight.disabled = state.busy || !hasSelection;
  els.deletePages.disabled = state.busy || !hasSelection;
  els.clearSelect.disabled = state.busy || !hasSelection;
}

function setBusy(busy, title = "正在处理", detail = "请稍候...") {
  state.busy = busy;
  for (const control of [els.addFiles, els.pptAdd, els.pptSave, els.wordAdd, els.wordSave, els.pptNup]) {
    control.disabled = busy;
  }
  els.busyTitle.textContent = title;
  els.busyDetail.textContent = detail;
  els.busyOverlay.hidden = !busy;
  refreshControls();
}

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.background = isError ? "var(--danger)" : "#111827";
  els.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.hidden = true;
  }, isError ? 6500 : 4200);
}

function summarizeEngines(results) {
  if (!results?.length) return "";
  const engines = [...new Set(results.map((item) => item.engine).filter(Boolean))];
  return engines.length ? `（${engines.join(" / ")}）` : "";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}
