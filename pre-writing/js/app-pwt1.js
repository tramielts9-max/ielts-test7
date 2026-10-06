import { streamGeminiPWT1 } from './api-pwt1.js';

let manifestData = [];
let currentExercise = null;
let currentCategory = "ALL";

const CATEGORIES = ["ALL", "Line", "Bar", "Pie", "Table", "Mixed", "Map", "Floor Plan", "Process"];
const CLOUD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec";

window.addEventListener('DOMContentLoaded', async () => {
  await loadManifestAndInitPortal();
  document.getElementById('bandTargetSelect')?.addEventListener('change', updateExerciseView);
  document.getElementById('studentEnglishInput')?.addEventListener('input', updateWordCount);
  document.getElementById('btnGrading')?.addEventListener('click', runEvaluation);
});

// ==================== LẤY LỊCH SỬ LÀM BÀI ====================
function getCompletedRecord(fileOrTitle) {
  try {
    const list = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
    return list.find(item => item.testTitle && item.testTitle.includes(fileOrTitle));
  } catch (e) {
    return null;
  }
}

// ==================== MÀN HÌNH PORTAL CARD ====================
async function loadManifestAndInitPortal() {
  try {
    const res = await fetch('data/pwt1-manifest.json');
    manifestData = await res.json();
    renderTabs();
    renderCards();
  } catch (err) {
    console.error("Lỗi đọc pwt1-manifest.json:", err);
  }
}

function renderTabs() {
  const container = document.getElementById('categoryTabsContainer');
  if (!container) return;
  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = cat === currentCategory;
    return `
      <button onclick="window.switchPWT1Category('${cat}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
        isActive ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }">
        ${cat === 'ALL' ? 'Tất cả dạng bài' : cat}
      </button>
    `;
  }).join('');
}

window.switchPWT1Category = (cat) => {
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
  document.getElementById('portalProgressBadge').innerText = `${completedCount}/${manifestData.length} Đã xong`;

  const filtered = manifestData.filter(item => {
    const matchCat = (currentCategory === "ALL") || item.title.toLowerCase().includes(currentCategory.toLowerCase());
    const matchSearch = item.title.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 font-medium">Không tìm thấy bài tập nào!</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const rec = getCompletedRecord(item.title);
    const isDone = !!rec;

    return `
      <div class="bg-white rounded-xl border ${
        isDone ? 'border-emerald-400 bg-emerald-50/20 shadow-emerald-100 ring-1 ring-emerald-300' : 'border-slate-200 shadow-sm hover:border-sky-300'
      } p-4 transition flex flex-col justify-between hover:shadow-md">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-700'}">
              ID: ${item.id}
            </span>
            ${isDone 
              ? `<span class="text-xs font-bold text-emerald-600 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> ${rec.score || 'Đã nộp'}</span>` 
              : `<span class="text-xs font-semibold text-slate-400"><i class="fa-regular fa-clock"></i> Chưa làm</span>`
            }
          </div>
          <h4 class="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug" title="${item.title}">
            ${item.title}
          </h4>
        </div>

        <button onclick="window.startLessonPWT1('${item.file}', '${item.title.replace(/'/g, "\\'")}')" class="w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
          isDone ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'
        }">
          <i class="fa-solid fa-pen-nib text-[11px]"></i> ${isDone ? 'Xem lại & Dịch lại' : 'Vào làm bài &rarr;'}
        </button>
      </div>
    `;
  }).join('');
}

window.filterPWT1Cards = () => renderCards();

// ==================== CHUYỂN QUA LẠI WORKSPACE ====================
window.startLessonPWT1 = async (filePath, title) => {
  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    const res = await fetch(filePath);
    currentExercise = await res.json();
    currentExercise.title = title;
    updateExerciseView();
  } catch (err) {
    console.error("Lỗi nạp bài tập:", err);
  }
};

window.backToPortalPWT1 = () => {
  document.getElementById('workspaceScreen').classList.add('hidden');
  document.getElementById('portalScreen').classList.remove('hidden');
  renderCards();
};

function updateExerciseView() {
  if (!currentExercise) return;
  const targetBand = document.getElementById('bandTargetSelect').value;

  document.getElementById('chartTypeBadge').innerText = currentExercise.type || 'Task 1';
  const promptText = `📌 ĐỀ BÀI (ENGLISH PROMPT):\n${currentExercise.prompt}\n\n--- BẢN MẪU TIẾNG VIỆT ĐỐI ỨNG (${targetBand.toUpperCase()}): ---\n\n${currentExercise[targetBand] || currentExercise.band8}`;
  document.getElementById('vietnameseSourceText').innerText = promptText;

  const imgElement = document.getElementById('chartImage');
  const fallback = document.getElementById('imageFallback');
  const pathDisplay = document.getElementById('expectedImgName');

  const fileName = currentExercise.image.split('/').pop();
  const relativeImagePath = `prewt12images/${fileName}`;
  pathDisplay.innerText = relativeImagePath;

  imgElement.style.display = 'none';
  fallback.style.display = 'block';

  const tester = new Image();
  tester.src = relativeImagePath;
  tester.onload = () => {
    imgElement.src = relativeImagePath;
    imgElement.style.display = 'inline-block';
    fallback.style.display = 'none';
  };
  tester.onerror = () => {
    imgElement.style.display = 'none';
    fallback.style.display = 'block';
  };
}

function updateWordCount() {
  const text = document.getElementById('studentEnglishInput').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCountDisplay').innerText = `${words} từ`;
}

// ==================== CHẤM BÀI & LƯU CLOUD DRIVE ====================
async function runEvaluation() {
  const studentText = document.getElementById('studentEnglishInput').value.trim();
  const sourceVN = document.getElementById('vietnameseSourceText').innerText.trim();

  if (!studentText) {
    alert("⚠️ Em hãy viết hoặc gõ câu dịch của mình trước khi bấm chấm nhé!");
    return;
  }

  const btn = document.getElementById('btnGrading');
  const resultBox = document.getElementById('result-box');
  const resultContent = document.getElementById('result-content');
  const statusBar = document.getElementById('status-bar');

  btn.disabled = true;
  resultBox.style.display = 'block';
  resultContent.innerHTML = '';
  statusBar.innerHTML = "⏳ Thầy đang đối chiếu số liệu biểu đồ & dịch thuật 2 tầng cho em...";

  const systemInstruction = `
Bạn là Giám khảo IELTS Writing Task 1 cự phách và là Thầy dạy dịch thuật học thuật.
QUY TẮC BẮT BUỘC: Xưng "Anh" và gọi học sinh là "Em".
QUY TẮC ĐỊNH DẠNG: Dùng cú pháp Markdown chuẩn (#, ##, ###, ####). Dùng thẻ inline:
<del class="err">từ sai</del>
<ins class="fix">từ sửa đúng</ins>
<mark class="vocab">từ vựng C1-C2 Task 1</mark>
<span class="teacher-note">💬 (lời dặn của Anh)</span>

XUẤT THEO CẤU TRÚC:
# PHẦN 1: MỔ XẺ TỪNG CÂU DỊCH (SỬA BÀI 2 TẦNG TASK 1)
---
### 📌 Câu [Số]: "[Câu học sinh]"
*Đối chiếu tiếng Việt: "[Câu tiếng Việt]"*
#### 🛠️ TẦNG 1: SỬA LỖI NGỮ PHÁP, SỐ LIỆU & DIỄN ĐẠT (Band 6.5 - 7.0)
- **Anh sửa trực tiếp:** [Câu sửa]
- **🔄 Các điểm cần sửa ngay:** [Lỗi sai]
- **👉 Bản sửa sạch lỗi:** "[Câu hoàn chỉnh]"

#### ✨ TẦNG 2: NÂNG TẦM ACADEMIC TASK 1 (Band 8.0 - 8.5)
- **Biến hóa với cấu trúc và Collocations học thuật:** [Câu Band 8+]
- **🚀 Từ vựng & cấu trúc ăn điểm:** [Cụm tầng 1 ➔ Cụm Band 8]
- **👉 Bản nâng cấp:** "[Câu đỉnh cao]"
---

# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ TASK 1
| Task Achievement | Coherence & Cohesion | Lexical Resource | Grammatical Range & Accuracy |
|---|---|---|---|
| Band [X] | Band [X] | Band [X] | Band [X] |

> ### 🎯 OVERALL BAND DỰ KIẾN: [X]/9.0

# PHẦN 3: LỜI DẶN DÒ CHIẾN LƯỢC CỦA ANH
[Nêu 2-3 lỗi cố hữu cần khắc phục]

# PHẦN 4: BẢN DỊCH HOÀN CHỈNH SẠCH LỖI (BAND 7.0)
> [Tổng hợp các câu sửa tầng 1]

# PHẦN 5: BẢN DỊCH ĐẲNG CẤP BẢN XỨ (BAND 8.5)
> [Tổng hợp các câu tầng 2]
`;

  const payload = [
    { text: systemInstruction + `\n\nĐề bài: ${currentExercise.prompt}\nDạng bài: ${currentExercise.type}\nTiếng Việt:\n${sourceVN}\n\nBài học sinh:\n${studentText}` }
  ];

  let fullText = "";
  try {
    const usedModel = await streamGeminiPWT1(payload, (chunk) => {
      fullText += chunk;
      resultContent.innerHTML = marked.parse(fullText);
    });
    statusBar.innerHTML = `✅ Thầy đã chấm xong bằng model [${usedModel}]. Em học kỹ các cấu trúc Tầng 2 nhé!`;
    btn.disabled = false;

    // --- LƯU VÀO LOCALSTORAGE VÀ BẮN LÊN GOOGLE DRIVE ---
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} - ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      const sName = localStorage.getItem('ielts_student_name') || 'Học viên';
      const sEmail = localStorage.getItem('ielts_student_email') || '';
      
      const bandMatch = fullText.match(/OVERALL BAND DỰ KIẾN:\s*([0-9.]+)/i) || fullText.match(/Band\s*([0-9.]+)/i);
      const bandScore = bandMatch ? `Band ${bandMatch[1]}` : "Đã dịch xong";

      const attemptSnapshot = {
        id: "attempt_pwt1_" + Date.now(),
        timestamp: timeStr,
        testTitle: `Pre-Writing T1: ${currentExercise?.title || 'Dịch biểu đồ'}`,
        studentName: sName,
        studentEmail: sEmail,
        score: bandScore,
        timeSpent: "N/A",
        details: `BẢN DỊCH HỌC VIÊN:\n${studentText}\n\nĐÁNH GIÁ 2 TẦNG:\n${fullText}`,
        pageUrl: "pre-writing/index-pwt1.html"
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
      console.warn("Lỗi lưu Pre-Writing 1:", errHist);
    }

  } catch (e) {
    statusBar.innerHTML = `❌ Lỗi: ${e.message}. Em bấm thử lại nhé!`;
    btn.disabled = false;
  }
}
