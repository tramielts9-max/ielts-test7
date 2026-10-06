import { streamGeminiTask2 } from './api-t2.js';

let manifestData = [];
let currentItemJson = null;
let currentCategory = "ALL";

let guideTimerInterval = null;
let guideTotalOpenSeconds = 0;
let isGuideOpen = false;

let stopwatchInterval = null;
let stopwatchSeconds = 0;
let isStopwatchRunning = false;

const CATEGORIES = ["ALL", "Opinion (Agree/Disagree)", "Discuss Both Views", "Advantage & Disadvantage", "Cause & Effect / Solution", "Two-part Questions"];
const CLOUD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec";

marked.setOptions({ breaks: true, gfm: true });

document.addEventListener('DOMContentLoaded', () => {
  setupWorkspaceListeners();
  loadManifestAndInitPortal();
});

function getCompletedRecord(title) {
  try {
    const list = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
    return list.find(item => item.testTitle && item.testTitle.includes(title));
  } catch (e) {
    return null;
  }
}

// ==================== MÀN HÌNH 1: PORTAL LOGIC ====================
async function loadManifestAndInitPortal() {
  try {
    const res = await fetch('data/manifest-t2.json');
    manifestData = await res.json();
    renderTabs();
    renderCards();
  } catch (err) {
    console.error("Lỗi manifest Task 2:", err);
  }
}

function renderTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;
  const labels = {
    "ALL": "Tất cả 116 đề",
    "Opinion (Agree/Disagree)": "1. Opinion",
    "Discuss Both Views": "2. Discussion",
    "Advantage & Disadvantage": "3. Adv & Disadv",
    "Cause & Effect / Solution": "4. Cause & Solution",
    "Two-part Questions": "5. Two-part"
  };

  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = cat === currentCategory;
    return `
      <button onclick="window.switchTask2Category('${cat}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
        isActive ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }">
        ${labels[cat] || cat}
      </button>
    `;
  }).join('');
}

window.switchTask2Category = (cat) => {
  currentCategory = cat;
  renderTabs();
  renderCards();
};

function renderCards() {
  const container = document.getElementById('portalCardsGrid');
  const search = (document.getElementById('portalSearchInput')?.value || '').toLowerCase().trim();
  if (!container) return;

  let completedCount = 0;
  manifestData.forEach(item => {
    if (getCompletedRecord(item.title)) completedCount++;
  });
  document.getElementById('portalProgressBadge').innerText = `${completedCount}/${manifestData.length} Đã viết`;

  const filtered = manifestData.filter(item => {
    const matchCat = (currentCategory === "ALL") || item.type === currentCategory;
    const matchSearch = item.title.toLowerCase().includes(search) || item.id.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">Không tìm thấy bài luận phù hợp!</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const rec = getCompletedRecord(item.title);
    const isDone = !!rec;

    return `
      <div class="bg-white rounded-xl border ${
        isDone ? 'border-emerald-400 bg-emerald-50/20 shadow-emerald-100 ring-1 ring-emerald-300' : 'border-slate-200 shadow-sm hover:border-indigo-400'
      } p-4 transition flex flex-col justify-between hover:shadow-md">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
              ${item.type.split(' ')[0]}
            </span>
            ${isDone 
              ? `<span class="text-xs font-bold text-emerald-600 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> ${rec.score || 'Đã viết'}</span>` 
              : `<span class="text-xs font-semibold text-slate-400"><i class="fa-regular fa-clock"></i> Chưa làm</span>`
            }
          </div>
          <h4 class="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug" title="${item.title}">
            ${item.title}
          </h4>
        </div>

        <button onclick="window.startLessonTask2('${item.file}', '${item.type}')" class="w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
          isDone ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-indigo-900 hover:bg-indigo-800 text-white'
        }">
          <i class="fa-solid fa-pen-fancy text-[11px]"></i> ${isDone ? 'Xem lại & Viết lại' : 'Vào phòng luyện viết &rarr;'}
        </button>
      </div>
    `;
  }).join('');
}

window.filterTask2Cards = () => renderCards();

// ==================== CHUYỂN QUA LẠI WORKSPACE ====================
window.startLessonTask2 = async (filePath, essayType) => {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('essayTypeBadge').innerText = essayType;

  try {
    const res = await fetch(filePath);
    currentItemJson = await res.json();
    document.getElementById('promptDisplayText').innerText = currentItemJson.prompt || "Writing Prompt...";
    renderGuideContent(currentItemJson.guide);
    resetGuideTimer();
    resetStopwatch();
  } catch (err) {
    console.warn("Lỗi tải chi tiết:", err.message);
    renderGuideContent(null);
  }
};

window.backToPortalTask2 = () => {
  pauseStopwatch();
  document.getElementById('workspaceScreen').classList.add('hidden');
  document.getElementById('portalScreen').classList.remove('hidden');
  renderCards();
};

// ==================== WORKSPACE LOGIC ====================
function setupWorkspaceListeners() {
  const essayInput = document.getElementById('studentEssayInput');
  essayInput?.addEventListener('input', () => {
    const text = essayInput.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('wordCounter').innerText = `${count} từ`;
    if (count > 0 && !isStopwatchRunning && stopwatchSeconds === 0) {
      startStopwatch();
    }
  });

  document.getElementById('btnToggleGuide')?.addEventListener('click', toggleGuide);
  document.getElementById('btnSubmitGrading')?.addEventListener('click', submitEssay);
  document.getElementById('btnJumpToResult')?.addEventListener('click', () => {
    document.getElementById('resultBox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('btnStartStopwatch')?.addEventListener('click', startStopwatch);
  document.getElementById('btnPauseStopwatch')?.addEventListener('click', pauseStopwatch);
  document.getElementById('btnResetStopwatch')?.addEventListener('click', resetStopwatch);
}

function formatTime(totalSecs) {
  const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const secs = String(totalSecs % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function startStopwatch() {
  if (isStopwatchRunning) return;
  isStopwatchRunning = true;
  document.getElementById('btnStartStopwatch').style.display = 'none';
  document.getElementById('btnPauseStopwatch').style.display = 'inline-block';
  stopwatchInterval = setInterval(() => {
    stopwatchSeconds++;
    document.getElementById('stopwatchDisplay').innerText = formatTime(stopwatchSeconds);
  }, 1000);
}

function pauseStopwatch() {
  if (!isStopwatchRunning) return;
  isStopwatchRunning = false;
  clearInterval(stopwatchInterval);
  document.getElementById('btnStartStopwatch').style.display = 'inline-block';
  document.getElementById('btnPauseStopwatch').style.display = 'none';
}

function resetStopwatch() {
  pauseStopwatch();
  stopwatchSeconds = 0;
  document.getElementById('stopwatchDisplay').innerText = '00:00:00';
}

function renderGuideContent(guideMarkdown) {
  const box = document.getElementById('guideContentBox');
  if (guideMarkdown) {
    box.innerHTML = marked.parse(guideMarkdown);
  } else {
    box.innerHTML = `<p>Đề bài này chưa có phần hướng dẫn chi tiết. Em hãy chủ động lập dàn ý và viết bài nhé!</p>`;
  }
}

function toggleGuide() {
  const box = document.getElementById('guideCollapsibleBox');
  const toggleText = document.getElementById('guideToggleText');
  const icon = document.getElementById('guideIcon');
  isGuideOpen = !isGuideOpen;

  if (isGuideOpen) {
    box.style.display = 'block';
    toggleText.innerText = 'THU GỌN HƯỚNG DẪN VIẾT';
    icon.innerText = '🔼';
    startGuideTimer();
  } else {
    box.style.display = 'none';
    toggleText.innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
    icon.innerText = '📖';
    stopGuideTimer();
  }
}

function startGuideTimer() {
  if (guideTimerInterval) clearInterval(guideTimerInterval);
  guideTimerInterval = setInterval(() => {
    guideTotalOpenSeconds++;
    updateGuideTimerBadge();
  }, 1000);
}

function stopGuideTimer() {
  if (guideTimerInterval) {
    clearInterval(guideTimerInterval);
    guideTimerInterval = null;
  }
}

function resetGuideTimer() {
  stopGuideTimer();
  guideTotalOpenSeconds = 0;
  isGuideOpen = false;
  document.getElementById('guideCollapsibleBox').style.display = 'none';
  document.getElementById('guideToggleText').innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
  document.getElementById('guideIcon').innerText = '📖';
  updateGuideTimerBadge();
}

function updateGuideTimerBadge() {
  const badge = document.getElementById('guideTimerBadge');
  if (guideTotalOpenSeconds > 30) {
    badge.className = 'timer-tag assisted';
    badge.innerHTML = `⚠️ Có trợ giúp (${guideTotalOpenSeconds}s > 30s)`;
  } else {
    badge.className = 'timer-tag independent';
    badge.innerHTML = `🛡️ Tự lực (${guideTotalOpenSeconds}s / tối đa 30s)`;
  }
}

// ==================== CHẤM BÀI & LƯU CLOUD ====================
async function submitEssay() {
  const essay = document.getElementById('studentEssayInput').value.trim();
  if (!essay) {
    alert("⚠️ Em vui lòng viết bài Task 2 trước khi nộp nhé!");
    return;
  }

  stopGuideTimer();
  pauseStopwatch();

  const isAssisted = guideTotalOpenSeconds > 30;
  const modeStatus = isAssisted 
    ? `Có trợ giúp từ gợi ý mẫu (${guideTotalOpenSeconds}s xem tài liệu)`
    : `Tự lực làm bài (${guideTotalOpenSeconds}s)`;
  const timeSpentFormatted = formatTime(stopwatchSeconds);

  const prompt = currentItemJson?.prompt || document.getElementById('promptDisplayText').innerText;
  const submitBtn = document.getElementById('btnSubmitGrading');
  const resultBox = document.getElementById('resultBox');
  const resultMarkdown = document.getElementById('resultMarkdown');
  const statusBar = document.getElementById('statusBar');
  const signalBar = document.getElementById('scrollSignalBar');

  submitBtn.disabled = true;
  resultBox.style.display = 'block';
  signalBar.style.display = 'block';
  resultMarkdown.innerHTML = '';
  statusBar.innerHTML = `⏳ Thầy đang phân tích và sửa bài Task 2 cho em... (Thời gian viết: <b>${timeSpentFormatted}</b> | Chế độ: <b>${modeStatus}</b>)`;

  resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const promptPayload = [{
    text: `
Bạn là Giám khảo IELTS & Chuyên gia luyện thi Writing Task 2 kỳ cựu.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Thầy" và gọi học sinh là "Em".
THÔNG TIN BÀI THI:
- Thời gian viết: ${timeSpentFormatted}.
- Trạng thái: ${modeStatus}.

HÃY XUẤT TOÀN BỘ BÀI CHẤM THEO ĐÚNG CẤU TRÚC 6 PHẦN SAU (DÙNG 100% MARKDOWN):
# PHẦN 1: MỔ XẺ 2 TẦNG CHI TIẾT TỪNG CÂU
---
### 📌 Câu [Số] — Điểm gốc: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI HIỂN NHIÊN (Band 6.0 - 6.5)
- **Thầy sửa trực tiếp:** [Câu sửa]
- **🔄 Từ sửa:** <del class="err">[Sai]</del> ➔ <ins class="fix">[Đúng]</ins>
- **👉 Câu sạch lỗi:** "[Viết lại câu]"

#### ✨ BƯỚC 2: NÂNG CẤP HOÀN MỸ (Band 8.0+)
- **Bơm từ vựng C1-C2:** [Viết câu với <mark class="vocab">từ C1-C2</mark>]
- **👉 Chốt câu hoàn mỹ:** "[Câu đỉnh cao]"
---
# PHẦN 2: BẢNG TỔNG HỢP ĐIỂM TỪNG CÂU
| Câu số | Điểm gốc (/9) | Điểm sau sửa lỗi (/9) | Điểm hoàn mỹ (/9) | Lỗi cốt lõi |
|---|---|---|---|---|

# PHẦN 3: ĐÁNH GIÁ 4 TIÊU CHÍ (IELTS TASK 2 RUBRIC)
| Task Response | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL BAND SCORE: [Band tổng]

# PHẦN 4: LỜI DẶN DÒ CHIẾN LƯỢC CỦA THẦY
# PHẦN 5: BẢN SẠCH LỖI HIỂN NHIÊN (CLEAN VERSION)
# PHẦN 6: BẢN NÂNG CẤP HOÀN MỸ (BAND 8.0+ MASTER ESSAY)

Đề bài: ${prompt}
Bài làm của học sinh:
${essay}
    `
  }];

  let fullOutput = "";
  try {
    const usedModel = await streamGeminiTask2(promptPayload, (chunk) => {
      fullOutput += chunk;
      resultMarkdown.innerHTML = marked.parse(fullOutput);
    });

    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [<b>${usedModel}</b>]! (Thời gian viết: <b>${timeSpentFormatted}</b> | Chế độ: <b>${modeStatus}</b>)`;
    submitBtn.disabled = false;

    // --- LƯU VÀO LOCAL VÀ BẮN LÊN GOOGLE DRIVE ---
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} - ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      const sName = localStorage.getItem('ielts_student_name') || 'Học viên';
      const sEmail = localStorage.getItem('ielts_student_email') || '';
      
      const bandMatch = fullOutput.match(/OVERALL BAND SCORE:\s*([0-9.]+)/i) || fullOutput.match(/Band\s*([0-9.]+)/i);
      const bandScore = bandMatch ? `Band ${bandMatch[1]}` : "Đã hoàn thành";

      const attemptSnapshot = {
        id: "attempt_wt2_" + Date.now(),
        timestamp: timeStr,
        testTitle: `Writing Task 2: ${currentItemJson?.title || 'Bài luận Task 2'}`,
        studentName: sName,
        studentEmail: sEmail,
        score: bandScore,
        timeSpent: timeSpentFormatted,
        details: `ĐỀ BÀI:\n${prompt}\n\nBÀI VIẾT:\n${essay}\n\nNHẬN XÉT AI:\n${fullOutput}`,
        pageUrl: "writing task 2/index-t2.html"
      };

      const localHist = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
      localHist.unshift(attemptSnapshot);
      localStorage.setItem('ielts_local_history', JSON.stringify(localHist));

      fetch(CLOUD_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "save_attempt", attempt: attemptSnapshot })
      }).catch(() => {});
    } catch(errHist) {
      console.warn("Lỗi lưu Writing Task 2:", errHist);
    }

  } catch (err) {
    console.error(err);
    statusBar.innerHTML = `❌ Lỗi kết nối AI: ${err.message}. Em bấm kiểm tra lại nhé!`;
    submitBtn.disabled = false;
  }
}
