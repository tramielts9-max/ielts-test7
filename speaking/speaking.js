/**
 * IELTS SPEAKING CONTROLLER & 2-TIER GRADING ENGINE
 * Tích hợp Màn hình Portal Lưới Card + Đổi màu theo Lịch sử hoàn thành
 */

// 1. MÃ HÓA RUNTIME AUTH KEY
const _AUTH_SEEDS = [
  65, 81, 46, 65, 98, 56, 82, 78, 54, 75, 116, 80, 107, 51, 45, 50,
  75, 103, 117, 114, 119, 117, 116, 65, 115, 55, 95, 118, 82, 66,
  121, 81, 110, 113, 67, 48, 77, 86, 55, 52, 66, 119, 107, 82, 107,
  80, 110, 74, 89, 70, 90, 49, 119
];

function getDecodedKey() {
  return _AUTH_SEEDS.map(c => String.fromCharCode(c)).join('');
}

const CLOUD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec";

// Global States
let currentPart = 1;
let currentPromptsData = [];
let selectedPromptItem = null;
let isCustomMode = false;

// Speech & Recording States
let recognition = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let base64Audio = null;

// Self-Reliance Timer (20s Rule)
let guideTimer = null;
let guideSecondsCount = 0;
let isGuideOpen = false;
let hasUsedAssistance = false;

if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true });
}

window.addEventListener('DOMContentLoaded', () => {
  loadPartData(1);
  initSpeechRecognition();
});

// ==================== LẤY LỊCH SỬ TỪ LOCALSTORAGE ====================
function getCompletedRecord(promptId, topicName) {
  try {
    const list = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
    return list.find(item => 
      (item.testTitle && (item.testTitle.includes(promptId) || item.testTitle.includes(topicName))) ||
      (item.details && (item.details.includes(promptId) || item.details.includes(topicName)))
    );
  } catch(e) {
    return null;
  }
}

// ==================== MÀN HÌNH 1: PORTAL CARD LOGIC ====================
async function loadPartData(partNum) {
  currentPart = partNum;
  document.getElementById('tabPart1Btn')?.classList.toggle('bg-violet-600', partNum === 1);
  document.getElementById('tabPart1Btn')?.classList.toggle('text-white', partNum === 1);
  document.getElementById('tabPart1Btn')?.classList.toggle('bg-slate-800', partNum !== 1);

  document.getElementById('tabPart2Btn')?.classList.toggle('bg-violet-600', partNum === 2);
  document.getElementById('tabPart2Btn')?.classList.toggle('text-white', partNum === 2);
  document.getElementById('tabPart2Btn')?.classList.toggle('bg-slate-800', partNum !== 2);

  document.getElementById('tabPart3Btn')?.classList.toggle('bg-violet-600', partNum === 3);
  document.getElementById('tabPart3Btn')?.classList.toggle('text-white', partNum === 3);
  document.getElementById('tabPart3Btn')?.classList.toggle('bg-slate-800', partNum !== 3);

  const urlsToTry = [
    `speaking-part${partNum}.json`,
    `data/speaking-part${partNum}.json`,
    `data/manifest-part${partNum}.json`
  ];

  currentPromptsData = [];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const raw = await res.json();
        currentPromptsData = Array.isArray(raw) ? raw : (raw.topics || []);
        if (currentPromptsData.length > 0) break;
      }
    } catch(e) {}
  }

  renderPortalCards();
}

window.switchSpeakingPart = (partNum) => {
  loadPartData(partNum);
};

function renderPortalCards() {
  const container = document.getElementById('portalCardsGrid');
  const search = (document.getElementById('portalSearchInput')?.value || '').toLowerCase().trim();
  if (!container) return;

  let completedCount = 0;
  currentPromptsData.forEach(item => {
    if (getCompletedRecord(item.id, item.topic)) completedCount++;
  });

  const progressBadge = document.getElementById('portalProgressBadge');
  if (progressBadge) {
    progressBadge.innerText = `${completedCount}/${currentPromptsData.length} Đã luyện`;
  }

  const filtered = currentPromptsData.filter(item => {
    const t = (item.title || item.topic || '').toLowerCase();
    const p = (item.fullPromptText || '').toLowerCase();
    return t.includes(search) || p.includes(search);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 font-medium">Không tìm thấy chủ đề nào!</div>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const rec = getCompletedRecord(item.id, item.topic);
    const isDone = !!rec;

    const cardClass = isDone 
      ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400' 
      : 'border-slate-800 bg-slate-850 hover:border-violet-500/60 bg-slate-800/80';

    const statusBadge = isDone
      ? `<span class="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
           <i class="fa-solid fa-circle-check"></i> ${rec.score || 'Đã luyện'}
         </span>`
      : `<span class="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
           <i class="fa-regular fa-clock"></i> Chưa làm
         </span>`;

    const qCount = item.questions ? `${item.questions.length} câu hỏi` : (item.questionCount ? `${item.questionCount} câu hỏi` : 'Full set');

    return `
      <div class="rounded-xl border p-4 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between gap-3 ${cardClass}">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 uppercase">
              Part ${currentPart} • ${item.id}
            </span>
            ${statusBadge}
          </div>
          <h3 class="text-sm font-bold text-slate-100 line-clamp-2 mt-1 leading-snug" title="${item.title || item.topic}">
            ${item.title || item.topic}
          </h3>
          <div class="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span class="truncate max-w-[190px] text-slate-400">📁 ${item.topic}</span>
            <span class="text-sky-300 font-semibold whitespace-nowrap">⏱️ ${qCount}</span>
          </div>
        </div>

        <button onclick="window.startLessonSpeaking('${item.id}')" class="w-full py-2.5 mt-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
          isDone ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'
        }">
          <i class="fa-solid fa-microphone text-[11px]"></i> ${isDone ? 'Luyện lại & Chấm lại' : 'Vào luyện nói &rarr;'}
        </button>
      </div>
    `;
  }).join('');
}

window.filterSpeakingCards = () => renderPortalCards();

// ==================== CHUYỂN QUA LẠI WORKSPACE ====================
window.startLessonSpeaking = (promptId) => {
  isCustomMode = false;
  selectedPromptItem = currentPromptsData.find(item => item.id === promptId);
  if (!selectedPromptItem) return;

  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('currentPartTag').innerText = `Part ${currentPart}`;
  document.getElementById('promptDisplayArea').style.display = 'block';
  document.getElementById('customPromptInput').style.display = 'none';
  document.getElementById('promptDisplayArea').innerText = selectedPromptItem.fullPromptText || selectedPromptItem.topic;

  updateGuideView(selectedPromptItem.guide);
  resetGuideTimer();
  resetRecordingUI();
};

window.startCustomSpeaking = () => {
  isCustomMode = true;
  selectedPromptItem = null;

  document.getElementById('portalScreen').classList.add('hidden');
  document.getElementById('workspaceScreen').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('currentPartTag').innerText = "Đề tự nhập";
  document.getElementById('promptDisplayArea').style.display = 'none';
  const customInp = document.getElementById('customPromptInput');
  customInp.style.display = 'block';
  customInp.value = '';

  updateGuideView(null);
  resetGuideTimer();
  resetRecordingUI();
};

window.backToPortalSpeaking = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (recognition) { try { recognition.stop(); } catch(e){} }
  isRecording = false;

  document.getElementById('workspaceScreen').classList.add('hidden');
  document.getElementById('portalScreen').classList.remove('hidden');
  renderPortalCards();
};

function updateGuideView(guide) {
  const ideasText = document.getElementById('guideIdeasText');
  const vocabList = document.getElementById('guideVocabList');
  const outlineText = document.getElementById('guideOutlineText');
  vocabList.innerHTML = '';

  if (guide) {
    ideasText.innerText = guide.suggestedIdeas || "Chưa có gợi ý thêm.";
    outlineText.innerText = guide.sampleOutline || "Chưa có dàn ý.";
    if (guide.keyVocab && Array.isArray(guide.keyVocab)) {
      guide.keyVocab.forEach(v => {
        const li = document.createElement('li');
        li.innerText = v;
        vocabList.appendChild(li);
      });
    }
  } else {
    ideasText.innerText = "Em đang tự luyện đề riêng. Hãy áp dụng cấu trúc AREA hoặc PEEL nhé!";
    outlineText.innerText = "";
  }
}

// ==================== BẤM GIỜ TỰ LỰC 20S ====================
window.toggleGuide = () => {
  const box = document.getElementById('guideContentBox');
  const btn = document.getElementById('btnToggleGuide');
  isGuideOpen = !isGuideOpen;

  if (isGuideOpen) {
    box.style.display = 'block';
    btn.innerText = "📕 ĐÓNG HƯỚNG DẪN CHI TIẾT";
    startGuideTimer();
  } else {
    box.style.display = 'none';
    btn.innerText = "📖 MỞ HƯỚNG DẪN CHI TIẾT (GỢI Ý & TỪ VỰNG)";
    stopGuideTimer();
  }
};

function startGuideTimer() {
  if (guideTimer) return;
  guideTimer = setInterval(() => {
    guideSecondsCount++;
    const timerEl = document.getElementById('timerCount');
    if (timerEl) timerEl.innerText = guideSecondsCount;

    if (guideSecondsCount > 20 && !hasUsedAssistance) {
      hasUsedAssistance = true;
      const badge = document.getElementById('selfRelianceBadge');
      if (badge) {
        badge.className = "self-reliance-badge assisted text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700";
        badge.innerHTML = `⚠️ Đã dùng trợ giúp (>20s: ${guideSecondsCount}s)`;
      }
    }
  }, 1000);
}

function stopGuideTimer() {
  if (guideTimer) {
    clearInterval(guideTimer);
    guideTimer = null;
  }
}

function resetGuideTimer() {
  stopGuideTimer();
  guideSecondsCount = 0;
  hasUsedAssistance = false;
  isGuideOpen = false;
  document.getElementById('guideContentBox').style.display = 'none';
  document.getElementById('btnToggleGuide').innerText = "📖 MỞ HƯỚNG DẪN CHI TIẾT (GỢI Ý & TỪ VỰNG)";
  const badge = document.getElementById('selfRelianceBadge');
  if (badge) {
    badge.className = "self-reliance-badge clean text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800";
    badge.innerHTML = `🟢 Tự lực (<span id="timerCount">0</span>s / tối đa 20s)`;
  }
}

// ==================== THU ÂM & WEB SPEECH API ====================
function initSpeechRecognition() {
  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!window.SpeechRecognition) {
    console.warn("Trình duyệt không hỗ trợ Web Speech API.");
    return;
  }

  recognition = new window.SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const txtArea = document.getElementById('speechTranscript');
    if (txtArea) txtArea.value = final + interim;
  };

  recognition.onerror = (e) => console.error("Speech Error:", e.error);
}

window.toggleRecording = async () => {
  const recBtn = document.getElementById('recBtn');
  const recText = document.getElementById('recText');
  const recIcon = document.getElementById('recIcon');

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        document.getElementById('audioPreview').src = URL.createObjectURL(audioBlob);
        document.getElementById('audioContainer').style.display = 'block';

        const reader = new FileReader();
        reader.onloadend = () => {
          base64Audio = reader.result.split(',')[1];
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      if (recognition) {
        document.getElementById('speechTranscript').value = '';
        try { recognition.start(); } catch(e){}
      }

      isRecording = true;
      recBtn.classList.remove('bg-rose-600');
      recBtn.classList.add('bg-emerald-600', 'animate-pulse');
      recText.innerText = "Dừng ghi âm & Hoàn thành bài nói";
      recIcon.innerText = "⏹️";
    } catch (err) {
      alert("Không thể mở Micro: " + err.message + ". Em hãy cấp quyền micro trên trình duyệt nhé!");
    }
  } else {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (recognition) { try { recognition.stop(); } catch(e){} }

    isRecording = false;
    recBtn.classList.remove('bg-emerald-600', 'animate-pulse');
    recBtn.classList.add('bg-rose-600');
    recText.innerText = "Nói lại lần nữa (Ghi âm mới)";
    recIcon.innerText = "🎙️";
  }
};

function resetRecordingUI() {
  isRecording = false;
  const recBtn = document.getElementById('recBtn');
  if (recBtn) {
    recBtn.classList.remove('bg-emerald-600', 'animate-pulse');
    recBtn.classList.add('bg-rose-600');
    document.getElementById('recText').innerText = "Bắt đầu ghi âm & nói tiếng Anh";
    document.getElementById('recIcon').innerText = "🎙️";
  }
  document.getElementById('audioContainer').style.display = 'none';
  document.getElementById('speechTranscript').value = '';
  document.getElementById('result-box').style.display = 'none';
  document.getElementById('status-bar').innerText = '';
}

// ==================== STREAMING GEMINI CHẤM ĐIỂM ====================
async function streamGeminiDirect(apiKey, parts, onChunk) {
  const modelsQueue = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError = null;
  for (let model of modelsQueue) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: parts }] })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              onChunk(textChunk);
            } catch (e) {}
          }
        }
      }
      return model;
    } catch (err) {
      console.warn(`Model ${model} chuyển tiếp dự phòng: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

window.startGrading = async () => {
  const apiKey = getDecodedKey();
  const taskPrompt = isCustomMode 
    ? document.getElementById('customPromptInput').value.trim() 
    : (selectedPromptItem?.fullPromptText || document.getElementById('promptDisplayArea').innerText.trim());
  const transcript = document.getElementById('speechTranscript').value.trim();

  if (!taskPrompt) {
    alert("⚠️ Vui lòng chọn hoặc nhập đề bài Speaking!");
    return;
  }
  if (!transcript) {
    alert("⚠️ Vui lòng ghi âm hoặc gõ bản ký âm câu trả lời của em!");
    return;
  }

  const submitBtn = document.getElementById('btnStartGrading');
  const printBtn = document.getElementById('btnPrintReport');
  const resultBox = document.getElementById('result-box');
  const resultContent = document.getElementById('result-content');
  const statusBar = document.getElementById('status-bar');

  submitBtn.disabled = true;
  printBtn.style.display = "none";
  resultBox.style.display = "block";
  resultContent.innerHTML = "";

  statusBar.innerHTML = "⏳ Thầy đang phân tích phát âm, ngữ điệu & mổ xẻ bài nói 2 tầng cho em...";

  const assistanceStatus = hasUsedAssistance
    ? `HỌC SINH ĐÃ MỞ XEM HƯỚNG DẪN QUÁ 20S (${guideSecondsCount}s).`
    : `HỌC SINH HOÀN TOÀN TỰ LỰC.`;

  const systemInstruction = `
Bạn là Giám khảo IELTS Speaking hàng đầu và là người Thầy tận tụy.
QUY TẮC XƯNG HÔ: Bắt buộc xưng "Anh" và gọi học sinh là "Em".
QUY TẮC ĐỊNH DẠNG: DÙNG 100% MARKDOWN THUẦN (###, ####, -). MỖI Ý XUỐNG DÒNG RIÊNG BIỆT.
TRẠNG THÁI BÀI LÀM: ${assistanceStatus}

HÃY XUẤT BÀI CHẤM THEO ĐÚNG CẤU TRÚC 5 PHẦN SAU:
# PHẦN 1: MỔ XẺ TỪNG CÂU NÓI (2 TẦNG SPEAKING)
---
### 📌 Câu [Số]: "[Câu gốc của em]" — Đánh giá: Band [Điểm/9]
#### 🛠️ BƯỚC 1: SỬA LỖI DIỄN ĐẠT & NGỮ PHÁP (Band [Điểm/9])
- **Anh chỉnh lại tự nhiên:** [Viết lại câu. Lỗi dùng <del class="err">từ sai</del>, sửa đúng <ins class="fix">từ đúng</ins>]
- **👉 Câu sửa sạch lỗi cơ bản:** "[Câu hoàn chỉnh]"

#### ✨ BƯỚC 2: NÂNG TẦM BẢN XỨ (Band 8.0+)
- **Biến hóa với Collocations & Idioms:** [Viết câu với <mark class="vocab">Collocations C1-C2</mark>]
- **👉 Phiên bản nói đẳng cấp Band 8.0+:** "[Câu xuất sắc nhất]"
---
# PHẦN 2: BẢNG ĐÁNH GIÁ 4 TIÊU CHÍ SPEAKING
| Fluency and Coherence | Lexical Resource | Grammatical Range & Accuracy | Pronunciation |
|---|---|---|---|
| Band [Điểm] | Band [Điểm] | Band [Điểm] | Band [Điểm] |

> ### 🎯 OVERALL SPEAKING BAND HIỆN TẠI: [Band điểm]

# PHẦN 3: LỜI DẶN DÒ CHIẾN LƯỢC CỦA ANH
# PHẦN 4: BẢN NÓI HOÀN THIỆN TỰ NHIÊN (CLEAN VERSION)
# PHẦN 5: BẢN NÓI XUẤT THẦN CHUẨN BẢN XỨ (MASTER 8.5 VERSION)
`;

  const partsPayload = [
    { text: systemInstruction + `\n\nPhần thi: IELTS Speaking Part ${currentPart}\nCâu hỏi:\n${taskPrompt}\n\nTranscript học sinh nói:\n${transcript}` }
  ];

  if (base64Audio) {
    partsPayload.push({
      inlineData: { mimeType: "audio/mp3", data: base64Audio }
    });
  }

  let fullMarkdown = "";
  try {
    await streamGeminiDirect(apiKey, partsPayload, (chunk) => {
      fullMarkdown += chunk;
      resultContent.innerHTML = marked.parse(fullMarkdown);
    });

    statusBar.innerHTML = "✅ Thầy đã chấm xong bài nói cho em rồi nhé! Em xem kỹ từng câu bên dưới nha.";
    submitBtn.disabled = false;
    printBtn.style.display = "inline-block";

    // --- LƯU VÀO LOCAL VÀ BẮN LÊN GOOGLE DRIVE ---
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} - ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
      const sName = localStorage.getItem('ielts_student_name') || 'Học viên';
      const sEmail = localStorage.getItem('ielts_student_email') || '';
      
      const bandMatch = fullMarkdown.match(/BAND HIỆN TẠI:\s*([0-9.]+)/i) || fullMarkdown.match(/Band\s*([0-9.]+)/i);
      const bandScore = bandMatch ? `Band ${bandMatch[1]}` : "Đã hoàn thành";

      const attemptSnapshot = {
        id: "attempt_spk_" + Date.now(),
        timestamp: timeStr,
        testTitle: `Speaking Part ${currentPart}: ${selectedPromptItem ? selectedPromptItem.topic : 'Tự luyện'}`,
        studentName: sName,
        studentEmail: sEmail,
        score: bandScore,
        timeSpent: "N/A",
        details: `ĐỀ BÀI:\n${taskPrompt}\n\nBÀI NÓI (TRANSCRIPT):\n${transcript}\n\nNHẬN XÉT AI:\n${fullMarkdown}`,
        pageUrl: `speaking/index-s.html?prompt=${selectedPromptItem ? selectedPromptItem.id : 'custom'}`
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
      console.warn("Lỗi lưu lịch sử Speaking:", errHist);
    }

  } catch (err) {
    console.error(err);
    statusBar.innerHTML = "❌ Có lỗi xảy ra: " + err.message;
    submitBtn.disabled = false;
  }
};
