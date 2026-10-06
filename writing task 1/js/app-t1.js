import { streamGeminiTask1 } from './api-t1.js';

let manifestData = [];
let currentItemJson = null;
let currentBase64Image = null;
let currentCategory = "ALL";

let guideTimerInterval = null;
let guideTotalOpenSeconds = 0;
let isGuideOpen = false;

const CATEGORIES = ["ALL", "Line Graph", "Bar Chart", "Pie Chart", "Table", "Mixed Charts", "Map", "Floor Plan", "Process"];
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
    const res = await fetch('data/manifest-t1.json');
    manifestData = await res.json();
    renderTabs();
    renderCards();
  } catch (err) {
    console.error("Lỗi manifest Task 1:", err);
  }
}

function renderTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = cat === currentCategory;
    return `
      <button onclick="window.switchTask1Category('${cat}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
        isActive ? 'bg-red-800 text-white shadow-sm ring-2 ring-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }">
        ${cat === 'ALL' ? 'Tất cả 133 đề' : cat}
      </button>
    `;
  }).join('');
}

window.switchTask1Category = (cat) => {
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
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">Không tìm thấy đề thi phù hợp!</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const rec = getCompletedRecord(item.title);
    const isDone = !!rec;

    return `
      <div class="bg-white rounded-xl border ${
        isDone ? 'border-emerald-400 bg-emerald-50/20 shadow-emerald-100 ring-1 ring-emerald-300' : 'border-slate-200 shadow-sm hover:border-red-400'
      } p-4 transition flex flex-col justify-between hover:shadow-md">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${item.type}
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

        <button onclick="window.startLessonTask1('${item.file}', '${item.image || ''}', '${item.type}')" class="w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
          isDone ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-800 hover:bg-red-700 text-white'
        }">
          <i class="fa-solid fa-pen text-[11px]"></i> ${isDone ? 'Xem lại & Viết lại' : 'Vào phòng thi viết &rarr;'}
        </button>
      </div>
    `;
  }).join('');
}

window.filterTask1Cards = () => renderCards();

// ==================== CHUYỂN QUA LẠI WORKSPACE ====================
window.startLessonTask1 = async (filePath, imageSrc, chartType) => {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('chartTypeBadge').innerText = chartType;

  try {
    const res = await fetch(filePath);
    currentItemJson = await res.json();
    document.getElementById('promptDisplayText').innerText = currentItemJson.prompt || "The graph below shows...";
    const finalImg = currentItemJson.image || imageSrc;
    if (finalImg) {
      showImage(finalImg);
      loadRemoteImageToBase64(finalImg);
    } else {
      removeImage();
    }
    renderGuideContent(currentItemJson.guide);
    resetGuideTimer();
  } catch (err) {
    console.warn("Lỗi tải chi tiết:", err.message);
    if (imageSrc) {
      showImage(imageSrc);
      loadRemoteImageToBase64(imageSrc);
    } else {
      removeImage();
    }
    renderGuideContent(null);
  }
};

window.backToPortalTask1 = () => {
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
  });

  document.getElementById('btnToggleGuide')?.addEventListener('click', toggleGuide);
  const fileInput = document.getElementById('chartFileInput');
  fileInput?.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
  document.getElementById('btnRemoveImage')?.addEventListener('click', removeImage);

  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let item of items) {
      if (item.type.includes('image')) {
        handleImageUpload(item.getAsFile());
        break;
      }
    }
  });

  document.getElementById('btnSubmitGrading')?.addEventListener('click', submitEssay);
}

function renderGuideContent(guideMarkdown) {
  const box = document.getElementById('guideContentBox');
  if (guideMarkdown) {
    box.innerHTML = marked.parse(guideMarkdown);
  } else {
    box.innerHTML = `<p>Đề bài này chưa có phần hướng dẫn chi tiết. Em hãy chủ động quan sát hình và viết bài nhé!</p>`;
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
    startTimer();
  } else {
    box.style.display = 'none';
    toggleText.innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
    icon.innerText = '📖';
    stopTimer();
  }
}

function startTimer() {
  if (guideTimerInterval) clearInterval(guideTimerInterval);
  guideTimerInterval = setInterval(() => {
    guideTotalOpenSeconds++;
    updateTimerBadge();
  }, 1000);
}

function stopTimer() {
  if (guideTimerInterval) {
    clearInterval(guideTimerInterval);
    guideTimerInterval = null;
  }
}

function resetGuideTimer() {
  stopTimer();
  guideTotalOpenSeconds = 0;
  isGuideOpen = false;
  document.getElementById('guideCollapsibleBox').style.display = 'none';
  document.getElementById('guideToggleText').innerText = 'MỞ HƯỚNG DẪN CHI TIẾT (TRẠM IELTS)';
  document.getElementById('guideIcon').innerText = '📖';
  updateTimerBadge();
}

function updateTimerBadge() {
  const badge = document.getElementById('guideTimerBadge');
  if (guideTotalOpenSeconds > 30) {
    badge.className = 'timer-tag assisted';
    badge.innerHTML = `⚠️ Có trợ giúp (${guideTotalOpenSeconds}s > 30s)`;
  } else {
    badge.className = 'timer-tag independent';
    badge.innerHTML = `🛡️ Tự lực (${guideTotalOpenSeconds}s / tối đa 30s)`;
  }
}

function showImage(src) {
  const img = document.getElementById('chartImage');
  const fallback = document.getElementById('imageFallback');
  const removeBtn = document.getElementById('btnRemoveImage');

  img.onerror = () => {
    if (src.endsWith('.jpg')) img.src = src.replace('.jpg', '.jpeg');
    else if (src.endsWith('.jpeg')) img.src = src.replace('.jpeg', '.jpg');
    else { img.style.display = 'none'; fallback.style.display = 'block'; }
  };
  img.onload = () => { img.style.display = 'block'; fallback.style.display = 'none'; removeBtn.style.display = 'inline-block'; };
  img.src = src;
}

function removeImage() {
  currentBase64Image = null;
  const img = document.getElementById('chartImage');
  img.src = '';
  img.style.display = 'none';
  document.getElementById('imageFallback').style.display = 'block';
  document.getElementById('btnRemoveImage').style.display = 'none';
  document.getElementById('chartFileInput').value = '';
}

function handleImageUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentBase64Image = { mimeType: file.type, data: e.target.result.split(',')[1] };
    showImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

async function loadRemoteImageToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      currentBase64Image = { mimeType: blob.type || 'image/jpeg', data: reader.result.split(',')[1] };
    };
    reader.readAsDataURL(blob);
  } catch(e) {}
}

window.openImageModal = (src) => window.open(src, '_blank');

// ==================== CHẤM BÀI & LƯU CLOUD ====================
async function submitEssay() {
  const essay = document.getElementById('studentEssayInput').value.trim();
  if (!essay) {
    alert("⚠️ Em vui lòng viết bài trước khi nộp nhé!");
    return;
  }

  stopTimer();
  const isAssisted = guideTotalOpenSeconds > 30;
  const modeStatus = isAssisted 
    ? `Có trợ giúp từ gợi ý mẫu (${guideTotalOpenSeconds} giây xem hướng dẫn)`
    : `Tự lực làm bài hoàn toàn (${guideTotalOpenSeconds} giây)`;

  const prompt = currentItemJson?.prompt || document.getElementById('promptDisplayText').innerText;
  const submitBtn = document.getElementById('btnSubmitGrading');
  const resultBox = document.getElementById('resultBox');
  const resultMarkdown = document.getElementById('resultMarkdown');
  const statusBar = document.getElementById('statusBar');

  submitBtn.disabled = true;
  resultBox.style.display = 'block';
  resultMarkdown.innerHTML = '';
  statusBar.innerHTML = `⏳ Thầy đang phân tích và sửa bài 2 tầng cho em... (Chế độ: <b>${modeStatus}</b>)`;

  const promptPayload = [{
    text: `
Bạn là Giám khảo IELTS & Giáo viên dạy viết cự phách.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Thầy" và gọi học sinh là "Em".
THÔNG TIN LÀM BÀI: ${modeStatus}.

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC 6 PHẦN SAU (DÙNG 100% MARKDOWN):
# PHẦN 1: MỔ XẺ 2 TẦNG CHI TIẾT TỪNG CÂU
---
### 📌 Câu [Số] — Điểm gốc: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI HIỂN NHIÊN (Band 6.0 - 6.5)
- **Thầy sửa trực tiếp:** [Câu sửa]
- **🔄 Từ sửa:** <del class="err">[Sai]</del> ➔ <ins class="fix">[Đúng]</ins>
- **👉 Câu sạch lỗi:** "[Viết lại câu]"

#### ✨ BƯỚC 2: NÂNG CẤP HOÀN MỸ (Band 8.0+)
- **Bơm từ C1-C2:** [Viết câu với <mark class="vocab">từ C1-C2</mark>]
- **👉 Chốt câu hoàn mỹ:** "[Câu đỉnh cao]"
---
# PHẦN 2: BẢNG TỔNG HỢP ĐIỂM TỪNG CÂU
| Câu số | Điểm gốc (/9) | Điểm sau sửa lỗi (/9) | Điểm hoàn mỹ (/9) | Lỗi cốt lõi |
|---|---|---|---|---|

# PHẦN 3: ĐÁNH GIÁ 4 TIÊU CHÍ (IELTS TASK 1 RUBRIC)
| Task Achievement | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL BAND SCORE: [Band tổng]

# PHẦN 4: LỜI DẶN DÒ CHIẾN LƯỢC CỦA THẦY
# PHẦN 5: BẢN SẠCH LỖI HIỂN NHIÊN (CLEAN VERSION)
# PHẦN 6: BẢN NÂNG CẤP HOÀN MỸ (BAND 8.0+ MASTER VERSION)

Đề bài: ${prompt}
Bài làm của học sinh:
${essay}
    `
  }];

  if (currentBase64Image) {
    promptPayload.push({
      inlineData: { mimeType: currentBase64Image.mimeType, data: currentBase64Image.data }
    });
  }

  let fullOutput = "";
  try {
    await streamGeminiTask1(promptPayload, (chunk) => {
      fullOutput += chunk;
      resultMarkdown.innerHTML = marked.parse(fullOutput);
    });

    statusBar.innerHTML = `✅ Thầy đã chấm xong! (Trạng thái: <b>${modeStatus}</b>)`;
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
        id: "attempt_wt1_" + Date.now(),
        timestamp: timeStr,
        testTitle: `Writing Task 1: ${currentItemJson?.title || 'Biểu đồ Task 1'}`,
        studentName: sName,
        studentEmail: sEmail,
        score: bandScore,
        timeSpent: `${guideTotalOpenSeconds}s`,
        details: `ĐỀ BÀI:\n${prompt}\n\nBÀI LÀM HỌC VIÊN:\n${essay}\n\nBÀI CHẤM AI:\n${fullOutput}`,
        pageUrl: "writing task 1/index-t1.html"
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
      console.warn("Lỗi lưu Writing Task 1:", errHist);
    }

  } catch (err) {
    console.error(err);
    statusBar.innerHTML = `❌ Lỗi: ${err.message}. Em bấm thử lại nhé!`;
    submitBtn.disabled = false;
  }
}
