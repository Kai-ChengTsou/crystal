const buttons = document.querySelectorAll(".category-card button");
const personalCard = document.querySelector(".personal-card");
const actionButtons = document.querySelectorAll(".primary-action, .secondary-action");
const menuButton = document.querySelector(".menu-button");
const photoInput = document.querySelector(".photo-input");
const uploadZone = document.querySelector(".upload-zone");
const uploadWarning = document.querySelector(".upload-warning");
const uploadNext = document.querySelector(".upload-next");
const choiceGroups = document.querySelectorAll("[data-choice-mode]");
const yearSelect = document.querySelector("[data-year-start]");
const dateSelects = document.querySelectorAll(".date-grid select");
const nextButtons = document.querySelectorAll("[data-next]");
const finishButton = document.querySelector("[data-finish-flow]");
const loadingPage = document.querySelector("[data-loading-page]");
const resetButtons = document.querySelectorAll("[data-reset-flow]");
const STORAGE_KEY = "lunetteAnalysisData";
const RESULT_KEY = "lunetteAnalysisResult";
const CRYSTAL_CATALOG = [
  ["白水晶", "淨化與放大能量"],
  ["粉晶", "愛與關係修復"],
  ["紫水晶", "安定思緒與靈感"],
  ["黑曜石", "防護與穩定磁場"],
  ["茶晶", "落地、專注與財務感"],
  ["黃水晶", "自信、行動與豐盛"],
  ["月光石", "直覺、柔和與內在平衡"],
  ["海藍寶", "溝通、舒壓與平靜"],
  ["綠幽靈", "事業成長與新機會"],
  ["虎眼石", "勇氣、判斷與執行力"],
  ["拉長石", "轉化、保護與靈感"],
  ["草莓晶", "魅力、溫暖與人緣"],
  ["碧璽", "能量防護與平衡"],
  ["石榴石", "活力、熱情與支持"],
  ["葡萄石", "療癒、安心與清理"],
  ["青金石", "表達、洞察與清明"],
  ["天河石", "舒緩焦慮與勇敢表達"],
  ["瑪瑙", "穩定、耐心與安全感"],
];

const messages = [
  "白水晶：適合清理雜訊，讓思緒回到穩定清明。",
  "粉晶：適合柔化心緒，提升關係中的安全感。",
  "茶晶：適合專注事業，穩住行動力與財務能量。",
  "海藍寶：適合安撫壓力，讓溝通更溫柔順流。",
];

if (personalCard) {
  personalCard.addEventListener("click", (event) => {
    const interactive = event.target.closest("button");
    if (interactive && interactive.dataset.link !== "personal.html") return;
    window.location.href = "personal.html";
  });

  personalCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = "personal.html";
    }
  });
}

buttons.forEach((button, index) => {
  button.addEventListener("click", () => {
    if (button.dataset.link) {
      window.location.href = button.dataset.link;
      return;
    }
    showToast(messages[index]);
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const message = messages[Math.floor(Math.random() * messages.length)];
    showToast(`你的今日推薦是 ${message}`);
  });
});

if (menuButton) {
  menuButton.addEventListener("click", () => {
    showToast("選單可以連接到商店、測驗、會員與收藏頁。");
  });
}

if (photoInput && uploadZone) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    sessionStorage.setItem("lunettePhotoReady", "true");
    updateStoredData({
      photo: {
        ready: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });
    uploadZone.classList.add("has-file");
    uploadZone.querySelector("strong").textContent = "已選擇照片";
    uploadZone.querySelector("em").textContent = file.name;
    if (uploadWarning) uploadWarning.classList.remove("is-visible");
  });
}

if (uploadNext) {
  uploadNext.addEventListener("click", () => {
    const hasFile = photoInput && photoInput.files && photoInput.files.length > 0;
    if (!hasFile) {
      if (uploadWarning) uploadWarning.classList.add("is-visible");
      showToast("請先上傳一張清晰正面照");
      return;
    }
    sessionStorage.setItem("lunettePhotoReady", "true");
    collectAndStoreCurrentPage();
    window.location.href = "basic.html";
  });
}

nextButtons.forEach((button) => {
  button.addEventListener("click", () => {
    collectAndStoreCurrentPage();
    window.location.href = button.dataset.next;
  });
});

if (finishButton) {
  finishButton.addEventListener("click", () => {
    collectAndStoreCurrentPage();
    const data = getStoredData();
    console.log("Lunette analysis data:", data);
    console.log("Lunette analysis data JSON:", JSON.stringify(data, null, 2));
    window.location.href = "loading.html";
  });
}

if (resetButtons.length) {
  resetButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(RESULT_KEY);
      sessionStorage.removeItem("lunettePhotoReady");
      window.location.href = "index.html";
    });
  });
}

if (loadingPage) runLoadingPage();

function getAnalyzeEndpoint() {
  if (window.location.protocol === "file:") {
    return "http://127.0.0.1:4180/api/analyze";
  }

  return "/api/analyze";
}

function getBraceletEndpoint() {
  if (window.location.protocol === "file:") {
    return "http://127.0.0.1:4180/api/generate-bracelet";
  }

  return "/api/generate-bracelet";
}

function showGeneratedBracelet(image) {
  if (!image) return;

  let preview = document.querySelector(".generated-bracelet-preview");

  if (!preview) {
    preview = document.createElement("figure");
    preview.className = "generated-bracelet-preview";
    preview.innerHTML = "<img alt='AI generated crystal bracelet' /><figcaption>AI 生成水晶手鍊</figcaption>";
    finishButton?.insertAdjacentElement("beforebegin", preview);
  }

  preview.querySelector("img").src = image;
}

choiceGroups.forEach((group) => {
  const mode = group.dataset.choiceMode;
  const maxSelected = Number(group.dataset.maxSelected || 0);
  const groupButtons = group.querySelectorAll("button");

  groupButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (mode === "single") {
        groupButtons.forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        collectAndStoreCurrentPage();
        return;
      }

      if (button.classList.contains("is-selected")) {
        button.classList.remove("is-selected");
        collectAndStoreCurrentPage();
        return;
      }

      const selectedCount = group.querySelectorAll(".is-selected").length;
      if (maxSelected && selectedCount >= maxSelected) {
        showToast(`最多選擇 ${maxSelected} 項`);
        return;
      }

      button.classList.add("is-selected");
      collectAndStoreCurrentPage();
    });
  });
});

if (yearSelect) {
  const startYear = Number(yearSelect.dataset.yearStart || 1920);
  const defaultYear = yearSelect.dataset.defaultYear || "1995";
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = currentYear; year >= startYear; year -= 1) {
    years.push(`<option${String(year) === defaultYear ? " selected" : ""}>${year} 年</option>`);
  }

  yearSelect.innerHTML = years.join("");
}

dateSelects.forEach((select) => {
  const label = select.closest("label");
  const picker = document.createElement("div");
  const trigger = document.createElement("button");
  const menu = document.createElement("div");

  picker.className = "date-picker";
  trigger.className = "date-picker-trigger";
  trigger.type = "button";
  trigger.textContent = select.options[select.selectedIndex]?.textContent || select.options[0]?.textContent || "";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  menu.className = "date-picker-menu";
  menu.setAttribute("role", "listbox");

  Array.from(select.options).forEach((option, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "date-picker-option";
    item.textContent = option.textContent;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", option.selected ? "true" : "false");

    item.addEventListener("click", () => {
      select.selectedIndex = index;
      trigger.textContent = option.textContent;
      menu.querySelectorAll(".date-picker-option").forEach((button) => {
        button.setAttribute("aria-selected", "false");
      });
      item.setAttribute("aria-selected", "true");
      select.dispatchEvent(new Event("change", { bubbles: true }));
      collectAndStoreCurrentPage();
      closeDatePickers();
    });

    menu.appendChild(item);
  });

  trigger.addEventListener("click", () => {
    const isOpen = picker.classList.contains("is-open");
    closeDatePickers();
    picker.classList.toggle("is-open", !isOpen);
    trigger.setAttribute("aria-expanded", String(!isOpen));
  });

  picker.append(trigger, menu);
  select.classList.add("native-date-select");
  label.appendChild(picker);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".date-picker")) closeDatePickers();
});

collectAndStoreCurrentPage();
renderResultPage();
renderReportPage();

function closeDatePickers() {
  document.querySelectorAll(".date-picker.is-open").forEach((picker) => {
    picker.classList.remove("is-open");
    picker.querySelector(".date-picker-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function getStoredData() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function updateStoredData(partial) {
  const current = getStoredData();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
}

function collectAndStoreCurrentPage() {
  if (document.querySelector(".info-card")) {
    updateStoredData({ basicInfo: collectBasicInfo() });
  }

  if (document.querySelector(".state-grid")) {
    updateStoredData({ recentState: collectSelectedCard(".state-grid", "state") });
  }

  if (document.querySelector(".style-grid")) {
    updateStoredData({ stylePreference: collectSelectedCard(".style-grid", "style") });
  }
}

function collectBasicInfo() {
  const selectedGender = document.querySelector(".choice-row .is-selected");
  const selectedLifestyle = [...document.querySelectorAll(".pill-grid .is-selected")];
  const selectedFocus = [...document.querySelectorAll(".focus-grid .is-selected")];

  return {
    birthDate: {
      year: getSelectValue("birth-year"),
      month: getSelectValue("birth-month"),
      day: getSelectValue("birth-day"),
    },
    gender: getChoiceText(selectedGender),
    lifestyle: selectedLifestyle.map(getChoiceText),
    focusAreas: selectedFocus.map(getChoiceText),
  };
}

function collectSelectedCard(gridSelector, type) {
  const selected = document.querySelector(`${gridSelector} .is-selected`);
  if (!selected) return null;

  const title = selected.querySelector("strong")?.textContent.trim() || "";
  const description = selected.querySelector("em")?.textContent.trim() || "";
  const image = selected.querySelector("img")?.getAttribute("src") || extractCssImage(selected.style.getPropertyValue("--state-image"));
  const selectedImage = extractCssImage(selected.style.getPropertyValue("--state-selected-image"));

  return {
    type,
    title,
    description,
    image,
    selectedImage: selectedImage || null,
  };
}

function getSelectValue(name) {
  return document.querySelector(`select[name="${name}"]`)?.value.trim() || "";
}

function getChoiceText(button) {
  return button?.querySelector("strong")?.textContent.trim() || button?.textContent.trim() || "";
}

function extractCssImage(value) {
  return value.replace(/^url\(["']?/, "").replace(/["']?\)$/, "").trim();
}

function renderResultPage() {
  const braceletImage = document.querySelector("[data-bracelet-image]");
  if (!braceletImage) return;

  const result = getStoredResult();
  const analysisText = result.analysis?.analysis || "";
  const image = result.bracelet?.image;

  if (image) {
    braceletImage.src = image;
  } else {
    braceletImage.src = "assets/style-minimal.jpg";
  }

  const summary = document.querySelector("[data-result-summary]");
  if (summary) summary.textContent = getAnalysisSummary(analysisText);

  const keywords = document.querySelector("[data-result-keywords]");
  if (keywords) keywords.textContent = buildKeywordLine(result.data);

  const crystals = document.querySelector("[data-bracelet-crystals]");
  if (crystals) {
    const crystalNames = result.bracelet?.crystals?.length
      ? result.bracelet.crystals
      : getCrystalNames(analysisText, result.data);
    crystals.innerHTML = crystalNames
      .map((name) => `<span><b>${escapeHtml(name)}</b><em>材質：${escapeHtml(getCrystalNote(name))}</em></span>`)
      .join("");
  }

  const wearNote = document.querySelector("[data-wear-note]");
  if (wearNote) wearNote.textContent = "♡ 建議佩戴方式：左手佩戴，有助於吸收正能量，滋養內在";
}

async function runLoadingPage() {
  const data = getStoredData();
  const percent = document.querySelector("[data-loading-percent]");
  const ring = document.querySelector("[data-loading-ring]");
  const status = document.querySelector("[data-loading-status]");
  const steps = document.querySelectorAll("[data-loading-step]");
  let progress = 12;

  updateLoadingProgress(progress, percent, ring);

  const timer = setInterval(() => {
    const next = progress < 46 ? progress + 3 : progress < 78 ? progress + 2 : progress + 1;
    progress = Math.min(next, 88);
    updateLoadingProgress(progress, percent, ring);
    updateLoadingSteps(progress, steps);
  }, 460);

  try {
    console.log("Lunette analysis data:", data);
    console.log("Lunette analysis data JSON:", JSON.stringify(data, null, 2));
    if (status) status.textContent = "AI 正在解析氣質、情緒、風格與命定能量匹配度...";

    const response = await fetch(getAnalyzeEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "分析失敗");

    console.log("Lunette GPT analysis:", result);
    progress = Math.max(progress, 62);
    updateLoadingProgress(progress, percent, ring);
    updateLoadingSteps(progress, steps);
    if (status) status.textContent = "AI 正在依照你的資料生成專屬水晶手鍊...";

    const braceletResponse = await fetch(getBraceletEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, analysis: result.analysis }),
    });
    const braceletResult = await braceletResponse.json();
    if (!braceletResponse.ok) throw new Error(braceletResult.error || "手鍊圖片生成失敗");

    console.log("Lunette bracelet image:", braceletResult);
    sessionStorage.setItem(RESULT_KEY, JSON.stringify({ data, analysis: result, bracelet: braceletResult }));
    clearInterval(timer);
    updateLoadingProgress(100, percent, ring);
    updateLoadingSteps(100, steps);
    if (status) status.textContent = "分析完成，正在打開你的命定水晶結果...";
    setTimeout(() => {
      window.location.href = "result.html";
    }, 650);
  } catch (error) {
    clearInterval(timer);
    console.error("Lunette GPT analysis error:", error);
    if (status) status.textContent = error.message || "分析失敗，請返回重新嘗試";
    loadingPage.classList.add("has-error");
    showToast(error.message || "分析失敗，請稍後再試");
  }
}

function updateLoadingProgress(value, percent, ring) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  if (percent) percent.textContent = `${safeValue}%`;
  if (ring) ring.style.setProperty("--progress", `${safeValue * 3.6}deg`);
}

function updateLoadingSteps(progress, steps) {
  steps.forEach((step, index) => {
    const done = progress >= [34, 70, 100][index];
    const active = !done && progress >= [0, 34, 70][index];
    step.classList.toggle("is-done", done);
    step.classList.toggle("is-active", active);
  });
}

function renderReportPage() {
  const reportBody = document.querySelector("[data-full-report]");
  if (!reportBody) return;

  const result = getStoredResult();
  const data = result.data || {};
  const analysisText = result.analysis?.analysis || "目前還沒有完整分析內容，請先完成一次 AI 分析。";
  const summary = document.querySelector("[data-report-summary]");
  const selections = document.querySelector("[data-report-selections]");

  if (summary) summary.textContent = buildKeywordLine(data);
  if (selections) selections.innerHTML = buildSelectionSummary(data);
  reportBody.innerHTML = formatReportText(analysisText);
}

function buildSelectionSummary(data = {}) {
  const items = [
    ["生日", [data.basicInfo?.birthDate?.year, data.basicInfo?.birthDate?.month, data.basicInfo?.birthDate?.day].filter(Boolean).join(" ")],
    ["性別", data.basicInfo?.gender],
    ["生活狀態", data.basicInfo?.lifestyle?.join("、")],
    ["在意面向", data.basicInfo?.focusAreas?.join("、")],
    ["最近狀態", data.recentState?.title],
    ["風格偏好", data.stylePreference?.title],
  ].filter(([, value]) => value);

  return items.map(([label, value]) => `<span><b>${escapeHtml(label)}</b><em>${escapeHtml(value)}</em></span>`).join("");
}

function formatReportText(text) {
  return text
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}</p>`)
    .join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStoredResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY)) || {};
  } catch {
    return {};
  }
}

function getAnalysisSummary(text) {
  return (
    text
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim())
      .find((line) => line && !line.includes("推薦水晶")) ||
    "你的專屬水晶分析已完成，請查看命定手鍊與能量建議。"
  );
}

function buildKeywordLine(data = {}) {
  const focus = data.basicInfo?.focusAreas?.slice(0, 2) || [];
  const state = data.recentState?.title || "穩定情緒";
  const style = data.stylePreference?.title || "專屬風格";
  return [...focus, state, style].slice(0, 3).join(" × ");
}

function getCrystalNames(text = "", data = {}) {
  const knownNames = CRYSTAL_CATALOG.map(([name]) => name);
  const directMatches = knownNames.filter((name) => text.includes(name));
  const boldMatches = [...text.matchAll(/\*\*([^*]+)\*\*/g)]
    .map((match) => match[1].replace(/[：:｜|].*$/, "").trim())
    .filter((value) => knownNames.includes(value));
  const matches = [...new Set([...directMatches, ...boldMatches])];

  if (matches.length) return matches.slice(0, 4);

  return getFallbackCrystalNames(data);
}

function getCrystalNote(name) {
  const item = CRYSTAL_CATALOG.find(([crystalName]) => name.includes(crystalName) || crystalName.includes(name));
  return item?.[1] || "依個人能量搭配";
}

function getFallbackCrystalNames(data = {}) {
  const profile = [
    data.basicInfo?.focusAreas?.join(" "),
    data.recentState?.title,
    data.recentState?.description,
    data.stylePreference?.title,
  ]
    .filter(Boolean)
    .join(" ");

  const selected = [];
  const add = (...names) => {
    names.forEach((name) => {
      if (!selected.includes(name)) selected.push(name);
    });
  };

  if (/愛|關係|人緣|情感|桃花/.test(profile)) add("粉晶", "草莓晶");
  if (/焦慮|壓力|睡眠|平靜|療癒|情緒/.test(profile)) add("紫水晶", "海藍寶", "葡萄石");
  if (/事業|工作|財|金錢|成長/.test(profile)) add("綠幽靈", "黃水晶", "虎眼石");
  if (/保護|防護|低潮|迷惘|穩定/.test(profile)) add("黑曜石", "茶晶");
  if (/改變|轉換|直覺|靈感/.test(profile)) add("拉長石", "月光石");
  if (/溝通|表達/.test(profile)) add("青金石", "天河石");
  add("白水晶", "紫水晶", "黑曜石");

  return selected.slice(0, 3);
}

function showToast(text) {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
