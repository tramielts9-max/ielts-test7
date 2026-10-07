/**
 * curriculum-system/ui-system.js
 * HIỂN THỊ LỘ TRÌNH, DÒNG CHÚ THÍCH LỢI ÍCH HỌC TẬP VÀ CLOUD SYNC
 */

import { curriculumEngineSystem } from './engine-system.js';
import { MASTER_CURRICULUM_SYSTEM } from './manifest-system.js';
import { analyzeStudentDiagnostic } from './ai-service-system.js';

const CLOUD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec";

let diagRecognition = null;
let isDiagRecording = false;

const BENCHMARK_EXPLANATIONS = {
  fast: {
    label: "Học Nhanh (Fast) ⚡",
    desc: "Dành cho học sinh tiếp thu nhanh, phản xạ tốt hoặc cần luyện thi gấp",
    table: [
      { type: "Ngữ pháp (Lý thuyết / Bài tập)", time: "5 - 15 phút", coach: "0 - 0.25h" },
      { type: "Từ vựng (1 Unit 30 từ)", time: "15 phút", coach: "0h (Tự ôn SRS)" },
      { type: "Pre-Listening & Pre-Reading", time: "10 phút", coach: "0 - 0.25h" },
      { type: "Pre-Writing Task 1 & 2", time: "15 - 20 phút", coach: "0.5h (Sửa câu)" },
      { type: "Reading Cam (1 Passage)", time: "12 - 15 phút", coach: "0 - 0.25h" },
      { type: "Listening Cam (1 Part)", time: "8 - 10 phút", coach: "0 - 0.25h" },
      { type: "Writing Task 1 / Task 2", time: "20p / 40p (Chuẩn thi)", coach: "0.75 - 1.0h" },
      { type: "Speaking Part 1 / 2 / 3", time: "10 - 15 phút", coach: "0.25 - 0.5h" }
    ]
  },
  normal: {
    label: "Học Bình Thường (Normal) 🌱",
    desc: "Lộ trình chuẩn kiến thức, đảm bảo nắm chắc từng dạng bài và làm sổ note lỗi",
    table: [
      { type: "Ngữ pháp (Lý thuyết / Bài tập)", time: "10 - 25 phút", coach: "0 - 0.5h" },
      { type: "Từ vựng (1 Unit 30 từ)", time: "25 phút", coach: "0h (Tự ôn SRS)" },
      { type: "Pre-Listening & Pre-Reading", time: "15 phút", coach: "0 - 0.25h" },
      { type: "Pre-Writing Task 1 & 2", time: "20 - 30 phút", coach: "0.5h (Sửa câu)" },
      { type: "Reading Cam (1 Passage)", time: "15 - 18 phút", coach: "0.25h" },
      { type: "Listening Cam (1 Part)", time: "10 - 12 phút", coach: "0.25h" },
      { type: "Writing Task 1 / Task 2", time: "30p / 50p", coach: "0.75 - 1.0h" },
      { type: "Speaking Part 1 / 2 / 3", time: "15 - 20 phút", coach: "0.25 - 0.5h" }
    ]
  },
  slow: {
    label: "Học Kỹ & Chậm (Slow) 🐢",
    desc: "Dành cho học sinh mất gốc, cần tua nghe nhiều lần và tra từ điển chi tiết",
    table: [
      { type: "Ngữ pháp (Lý thuyết / Bài tập)", time: "20 - 45 phút", coach: "0 - 0.5h" },
      { type: "Từ vựng (1 Unit 30 từ)", time: "40 phút", coach: "0h (Tự ôn SRS)" },
      { type: "Pre-Listening & Pre-Reading", time: "25 phút", coach: "0.25h" },
      { type: "Pre-Writing Task 1 & 2", time: "35 - 45 phút", coach: "0.5h" },
      { type: "Reading Cam (1 Passage)", time: "20 - 25 phút", coach: "0.5h" },
      { type: "Listening Cam (1 Part)", time: "15 - 18 phút", coach: "0.5h" },
      { type: "Writing Task 1 / Task 2", time: "40p / 65p", coach: "1.0h" },
      { type: "Speaking Part 1 / 2 / 3", time: "20 - 30 phút", coach: "0.5h" }
    ]
  }
};

class CurriculumUISystem {
  constructor() {
    curriculumEngineSystem.setNodes(MASTER_CURRICULUM_SYSTEM);
    this.calCurrentMonth = new Date().getMonth();
    this.calCurrentYear = new Date().getFullYear();
    this.initSpeechSTT();
  }

  initSpeechSTT() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) return;

    diagRecognition = new window.SpeechRecognition();
    diagRecognition.continuous = true;
    diagRecognition.interimResults = true;
    diagRecognition.lang = 'vi-VN';

    diagRecognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      const area = document.getElementById('diagTextInput');
      if (area) area.value = (final + interim).trim();
    };

    diagRecognition.onerror = (e) => console.warn("STT Lỗi:", e.error);
  }

  getStorageKey(email) {
    const clean = (email || localStorage.getItem('ielts_student_email') || 'guest').toLowerCase().trim();
    return `ielts_roadmap_data_${clean}`;
  }

  getSavedRoadmap(email) {
    try {
      const raw = localStorage.getItem(this.getStorageKey(email));
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  saveRoadmap(email, data) {
    localStorage.setItem(this.getStorageKey(email), JSON.stringify(data));
    this.syncRoadmapToCloud(email, data);
  }

  syncRoadmapToCloud(email, roadmapData) {
    if (!CLOUD_SCRIPT_URL) return;
    try {
      fetch(CLOUD_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "save_student_roadmap",
          studentEmail: email,
          roadmap: roadmapData
        })
      }).catch(() => {});
    } catch(e) {
      console.warn("Lỗi sync cloud lộ trình:", e);
    }
  }

  checkIsAdmin() {
    const email = (localStorage.getItem('ielts_student_email') || '').toLowerCase().trim();
    return email.includes('admin') || (window.CONFIG?.ADMIN_EMAILS || []).map(e => e.toLowerCase()).includes(email);
  }

  isNodeCompletedInHistory(node) {
    try {
      const history = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
      return history.some(item => {
        const matchTitle = item.testTitle && (item.testTitle.includes(node.id) || item.testTitle.includes(node.title));
        const matchUrl = item.pageUrl && node.url && (item.pageUrl.includes(node.url) || node.url.includes(item.pageUrl));
        return matchTitle || matchUrl;
      });
    } catch(e) {
      return false;
    }
  }

  toggleMicrophone() {
    if (!diagRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói. Em hãy gõ trực tiếp nhé!");
      return;
    }
    const btn = document.getElementById('btnDiagMic');
    const status = document.getElementById('diagMicStatus');

    if (!isDiagRecording) {
      try {
        diagRecognition.start();
        isDiagRecording = true;
        btn.classList.add('recording');
        btn.innerHTML = `<i class="fa-solid fa-stop"></i> Đang nghe... Bấm để Dừng`;
        if (status) status.innerText = "🔴 Đang lắng nghe giọng nói...";
      } catch (e) {}
    } else {
      try {
        diagRecognition.stop();
        isDiagRecording = false;
        btn.classList.remove('recording');
        btn.innerHTML = `<i class="fa-solid fa-microphone"></i> Bấm để nói tự thuật trình độ`;
        if (status) status.innerText = "✅ Đã nhận diện xong!";
      } catch (e) {}
    }
  }

  handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const area = document.getElementById('diagTextInput');
      if (area) area.value = e.target.result;
    };
    reader.readAsText(file);
  }

  async runAIDiagnostic() {
    const text = document.getElementById('diagTextInput')?.value.trim();
    if (!text) {
      alert("⚠️ Em vui lòng nói vào micro hoặc dán báo cáo trước khi chẩn đoán nhé!");
      return;
    }
    const btn = document.getElementById('btnStartAIAnalyze');
    btn.disabled = true;
    btn.innerHTML = `⏳ AI Gemini đang phân tích năng lực & gọt bài thừa...`;

    try {
      const result = await analyzeStudentDiagnostic(text);
      btn.disabled = false;
      btn.innerHTML = `⚡ Chẩn đoán lại`;

      const resBox = document.getElementById('diagAIResultContainer');
      resBox.style.display = 'block';

      const prunedNodes = curriculumEngineSystem.pruneCurriculum(result.mastered_tags || []);
      const savedCount = MASTER_CURRICULUM_SYSTEM.length - prunedNodes.length;

      resBox.innerHTML = `
        <div class="cs-ai-report-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <b style="color:#166534; font-size:15px;">🎯 KẾT QUẢ CHẨN ĐOÁN TỪ AI GEMINI</b>
            <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:20px; font-weight:800; font-size:12px;">
              Band ước lượng: ~${result.estimated_band || '4.5'}
            </span>
          </div>
          <p style="font-size:13px; color:#1e293b; margin:10px 0; line-height:1.5;">
            <b>Nhận xét:</b> ${result.academic_summary}
          </p>
          <div style="display:flex; gap:12px; font-size:12px; color:#64748b; flex-wrap:wrap; margin-bottom:12px;">
            <span>✂️ Đã gọt bỏ: <b>${savedCount} bài</b> cơ bản</span>
            <span>⚡ Tốc độ đề xuất: <b>${(result.recommended_speed || 'normal').toUpperCase()}</b></span>
            <span>⏱️ Cam kết: <b>${result.recommended_daily_hours || 1.0}h/ngày</b></span>
          </div>
          <button type="button" onclick="window.curriculumUI.applyAIDiagnosticRoadmap(${JSON.stringify(result).replace(/"/g, '&quot;')})" style="background:#16a34a; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:800; font-size:13.5px; cursor:pointer; width:100%;">
            🚀 Phê Duyệt & Kích Hoạt Lộ Trình Này Ngay
          </button>
        </div>
      `;
    } catch (e) {
      alert("Lỗi phân tích: " + e.message);
      btn.disabled = false;
      btn.innerHTML = `⚡ Bắt đầu chẩn đoán bằng AI Gemini`;
    }
  }

  applyAIDiagnosticRoadmap(aiData) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const speed = aiData.recommended_speed || 'normal';
    const dailyHours = aiData.recommended_daily_hours || 1.0;

    const retainedNodes = curriculumEngineSystem.pruneCurriculum(aiData.mastered_tags || []);
    const totals = curriculumEngineSystem.calculateTotals(retainedNodes, speed);
    const scheduleData = curriculumEngineSystem.generateDailyCalendar(retainedNodes, speed, dailyHours);

    const payload = {
      createdAt: new Date().toISOString(),
      studentEmail: email,
      presetLevel: `ai_band_${aiData.estimated_band}`,
      speedProfile: speed,
      dailyHours,
      currentDay: 1,
      totals,
      schedule: scheduleData.dailySchedule,
      completedNodeIds: [],
      aiDiagnosticData: aiData,
      isLockedByAdmin: false
    };

    this.saveRoadmap(email, payload);
    this.render();
  }

  initRoadmap(presetLevel = 'beginner', dailyHours = 1.0, speed = 'normal') {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    let masteredTags = [];

    if (presetLevel === 'intermediate') {
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'VOCAB_300_U01', 'VOCAB_300_U02', 'PRE_LIS_A1', 'PRE_READ_A1', 'PRE_SPK_A1'];
    } else if (presetLevel === 'advanced') {
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'G_PAST_CONT', 'G_IRREG_V3', 'G_PRES_PERF', 'G_PAST_PERF', 'G_CONDITIONALS', 'G_PASSIVE_VOICE', 'G_COMPARISON', 'G_RELATIVE_CLAUSE', 'G_PREP_ADV', 'G_WORD_FORM', 'PWT1_CORE', 'PWT2_CORE', 'PRE_LIS_INTER', 'PRE_READ_INTER', 'PRE_SPK_INTER'];
    }

    const retainedNodes = curriculumEngineSystem.pruneCurriculum(masteredTags);
    const totals = curriculumEngineSystem.calculateTotals(retainedNodes, speed);
    const scheduleData = curriculumEngineSystem.generateDailyCalendar(retainedNodes, speed, dailyHours);

    const payload = {
      createdAt: new Date().toISOString(),
      studentEmail: email,
      presetLevel,
      speedProfile: speed,
      dailyHours,
      currentDay: 1,
      totals,
      schedule: scheduleData.dailySchedule,
      completedNodeIds: []
    };

    this.saveRoadmap(email, payload);
    this.render();
  }

  resetRoadmap() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    if (confirm("⚠️ Em có chắc muốn xóa lộ trình hiện tại để thiết lập lại từ đầu không?")) {
      localStorage.removeItem(this.getStorageKey(email));
      this.render();
    }
  }

  completeNode(nodeId) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    if (!data.completedNodeIds.includes(nodeId)) {
      data.completedNodeIds.push(nodeId);
    }

    const currentDayPlan = data.schedule.find(s => s.dayNumber === data.currentDay);
    if (currentDayPlan) {
      const allDone = currentDayPlan.nodes.every(n => data.completedNodeIds.includes(n.id) || this.isNodeCompletedInHistory(n));
      if (allDone && data.currentDay < data.schedule.length) {
        data.currentDay += 1;
        alert("🎉 Xuất sắc! Em đã hoàn thành toàn bộ bài tập của hôm nay. Ngày tiếp theo đã được mở khóa!");
      }
    }

    this.saveRoadmap(email, data);
    this.render();
  }

  showZaloReportModal() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const sName = localStorage.getItem('ielts_student_name') || 'Học viên';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const todayPlan = data.schedule.find(s => s.dayNumber === data.currentDay) || data.schedule[0];
    
    let todayDoneCount = 0;
    todayPlan.nodes.forEach(n => {
      if (data.completedNodeIds.includes(n.id) || this.isNodeCompletedInHistory(n)) todayDoneCount++;
    });

    const isTodayCompleted = todayDoneCount >= todayPlan.nodes.length;
    const progressPercent = Math.round((data.completedNodeIds.length / data.totals.nodeCount) * 100);

    let zaloMessage = "";
    if (isTodayCompleted) {
      zaloMessage = `[TRẠM IELTS - BÁO CÁO HỌC TẬP HÔM NAY]
Kính gửi Phụ huynh em: ${sName}
Ngày: ${todayStr}

🎉 Chúc mừng em đã HOÀN THÀNH 100% bài tập hôm nay (${todayDoneCount}/${todayPlan.nodes.length} bài)!
📊 Tiến độ lộ trình: Đã xong ${data.completedNodeIds.length}/${data.totals.nodeCount} đốt (${progressPercent}%).
⏱️ Tốc độ học tập: ${data.speedProfile.toUpperCase()} (${data.dailyHours}h tự cày/ngày).
👨‍🏫 Tổng số buổi giáo viên đồng hành sửa bài: ${data.totals.coachSessionsEstimate} buổi.

Kính nhờ Phụ huynh động viên em tiếp tục duy trì phong độ ngày mai nhé!`;
    } else {
      zaloMessage = `[TRẠM IELTS - THÔNG BÁO NHẮC NHỞ HỌC TẬP]
Kính gửi Phụ huynh em: ${sName}
Ngày: ${todayStr}

⚠️ Báo động tiến độ: Tính đến 21:30 tối nay, em ${sName} mới hoàn thành ${todayDoneCount}/${todayPlan.nodes.length} bài tập theo lịch ngày.
📌 Bài tập còn thiếu:
${todayPlan.nodes.filter(n => !data.completedNodeIds.includes(n.id) && !this.isNodeCompletedInHistory(n)).map(n => `- ${n.title}`).join('\n')}

Kính nhờ Phụ huynh nhắc nhở em vào web cày xong trước 23:30 để không bị dồn bài sang ngày mai ạ!`;
    }

    this.openModal(`
      <div class="cs-modal-header" style="background:#0068ff;">
        <div>
          <h3 style="margin:0; font-size:16px; font-weight:bold;"><i class="fa-solid fa-paper-plane"></i> XUẤT BÁO CÁO ZALO GỬI PHỤ HUYNH</h3>
          <span style="font-size:12px; color:#dbeafe;">Học viên: ${sName} (${email})</span>
        </div>
        <button onclick="window.curriculumUI.closeModal()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div class="cs-modal-body">
        <div class="cs-zalo-card">
          <div class="cs-zalo-title">
            <i class="fa-solid fa-comment-dots"></i> Tin nhắn Zalo được soạn tự động (${isTodayCompleted ? '✅ Khen ngợi' : '⚠️ Nhắc nhở'}):
          </div>
          <textarea id="zaloMessageText" class="cs-zalo-textarea" readonly>${zaloMessage}</textarea>
          <button type="button" class="cs-btn-zalo-copy" onclick="window.curriculumUI.copyZaloMessage()">
            <i class="fa-solid fa-copy"></i> Sao chép tin nhắn (Để dán vào Zalo)
          </button>
        </div>
      </div>
    `);
  }

  copyZaloMessage() {
    const textEl = document.getElementById('zaloMessageText');
    if (!textEl) return;
    textEl.select();
    navigator.clipboard.writeText(textEl.value).then(() => {
      alert("✅ Đã sao chép tin nhắn báo cáo! Thầy/Cô chỉ việc dán thẳng vào Zalo gửi cho Phụ huynh nhé.");
    });
  }

  showAdminOverrideModal() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    this.openModal(`
      <div class="cs-modal-header" style="background:#92400e;">
        <div>
          <h3 style="margin:0; font-size:16px; font-weight:bold;">👑 BẢNG ĐIỀU CHỈNH LỘ TRÌNH ĐỘC QUYỀN (ADMIN)</h3>
          <span style="font-size:12px; color:#fde68a;">Học viên: ${email}</span>
        </div>
        <button onclick="window.curriculumUI.closeModal()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div class="cs-modal-body">
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <label style="display:block; font-size:13px; font-weight:bold; margin-bottom:4px;">1. Điều chỉnh tốc độ học (Speed Profile):</label>
            <select id="admSpeedSelect" class="border border-slate-300 rounded p-2 text-sm w-full">
              <option value="fast" ${data.speedProfile === 'fast' ? 'selected' : ''}>⚡ Học Nhanh (Fast - ~12 tháng)</option>
              <option value="normal" ${data.speedProfile === 'normal' ? 'selected' : ''}>🌱 Học Bình Thường (Normal - ~14 tháng)</option>
              <option value="slow" ${data.speedProfile === 'slow' ? 'selected' : ''}>🐢 Học Kỹ / Chậm (Slow - ~16-18 tháng)</option>
            </select>
          </div>

          <div>
            <label style="display:block; font-size:13px; font-weight:bold; margin-bottom:4px;">2. Thời gian cam kết học BTVN mỗi ngày:</label>
            <select id="admHoursSelect" class="border border-slate-300 rounded p-2 text-sm w-full">
              <option value="1.0" ${data.dailyHours === 1.0 ? 'selected' : ''}>1.0 tiếng / ngày</option>
              <option value="1.5" ${data.dailyHours === 1.5 ? 'selected' : ''}>1.5 tiếng / ngày</option>
              <option value="2.0" ${data.dailyHours === 2.0 ? 'selected' : ''}>2.0 tiếng / ngày (Gấp rút)</option>
            </select>
          </div>

          <div style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:bold; color:#1e293b;">
              <input type="checkbox" id="admLockToggle" ${data.isLockedByAdmin ? 'checked' : ''}>
              🔒 Khóa cứng lộ trình (Học sinh không thể tự bấm 'Đặt lại' lộ trình)
            </label>
          </div>

          <button type="button" onclick="window.curriculumUI.saveAdminOverride()" style="background:#b45309; color:white; border:none; padding:12px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer; margin-top:10px;">
            💾 Lưu Thay Đổi Của Admin
          </button>
        </div>
      </div>
    `);
  }

  saveAdminOverride() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    data.speedProfile = document.getElementById('admSpeedSelect').value;
    data.dailyHours = parseFloat(document.getElementById('admHoursSelect').value) || 1.0;
    data.isLockedByAdmin = document.getElementById('admLockToggle').checked;

    const retained = curriculumEngineSystem.pruneCurriculum(data.aiDiagnosticData?.mastered_tags || []);
    data.totals = curriculumEngineSystem.calculateTotals(retained, data.speedProfile);
    data.schedule = curriculumEngineSystem.generateDailyCalendar(retained, data.speedProfile, data.dailyHours).dailySchedule;

    this.saveRoadmap(email, data);
    this.render();
    this.closeModal();
    alert("👑 Admin đã cập nhật lộ trình thành công!");
  }

  render(targetContainerId = 'roadmapSectionMount') {
    let container = document.getElementById(targetContainerId);
    if (!container) return;

    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    const isAdmin = this.checkIsAdmin();

    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div style="text-align:center; padding:10px;">
            <h3 style="margin:0 0 6px 0; font-size:21px; font-weight:800; color:#0284c7;">🎯 THIẾT LẬP LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA (858 BÀI)</h3>
            <p style="margin:0 auto 16px auto; max-width:620px; font-size:13px; color:#64748b;">
              Chọn xuất phát điểm nhanh, hoặc sử dụng <b>Trợ lý AI Gemini</b> để nhận diện giọng nói và gọt bài thừa:
            </p>

            <div class="cs-setup-buttons" style="margin-bottom:20px;">
              <button type="button" class="cs-btn-preset" style="background:#0284c7;" onclick="window.curriculumUI.initRoadmap('beginner', 1.0)">
                🌱 Mất gốc hoàn toàn (Học full 858 đốt)
              </button>
              <button type="button" class="cs-btn-preset" style="background:#16a34a;" onclick="window.curriculumUI.initRoadmap('intermediate', 1.0)">
                ⚡ Đã có nền 4.5 - 5.0 (Gọt bỏ Giai đoạn 1)
              </button>
              <button type="button" class="cs-btn-preset" style="background:#8B1518;" onclick="window.curriculumUI.initRoadmap('advanced', 1.0)">
                🔥 Bứt phá 6.0+ ➔ 7.5 (Tập trung Cam & Viết Nói)
              </button>
            </div>

            <div class="cs-diag-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <b style="color:#0369a1; font-size:14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> CHẨN ĐOÁN TRÌNH ĐỘ BẰNG AI GEMINI (SPEECH-TO-TEXT)</b>
                  <div style="font-size:12px; color:#64748b; margin-top:2px;">Bấm Micro để nói tự thuật trình độ, hoặc dán bảng điểm thi thử vào ô bên dưới:</div>
                </div>
                <button type="button" id="btnDiagMic" class="cs-diag-mic-btn" onclick="window.curriculumUI.toggleMicrophone()">
                  <i class="fa-solid fa-microphone"></i> Bấm để nói tự thuật trình độ
                </button>
              </div>

              <textarea id="diagTextInput" class="cs-diag-textarea" placeholder="Ví dụ: Em đã vững ngữ pháp cơ bản và các thì, nhưng kỹ năng nghe số liệu hay bị sót, viết bài Task 1 chưa biết nhóm số liệu... (hoặc dán nội dung báo cáo kết quả thi thử vào đây)"></textarea>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="file" id="diagFileInput" accept=".txt" style="display:none;" onchange="window.curriculumUI.handleFileUpload(this.files[0])">
                  <button type="button" onclick="document.getElementById('diagFileInput').click()" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;">
                    📄 Tải file báo cáo (.txt)
                  </button>
                  <span id="diagMicStatus" style="font-size:12px; color:#16a34a; font-weight:bold;"></span>
                </div>

                <button type="button" id="btnStartAIAnalyze" onclick="window.curriculumUI.runAIDiagnostic()" style="background:#0284c7; color:white; border:none; padding:9px 18px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">
                  ⚡ Gửi AI Phân Tích & Gọt Lộ Trình
                </button>
              </div>

              <div id="diagAIResultContainer" style="display:none;"></div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    data.schedule.forEach(day => {
      day.nodes.forEach(node => {
        if (!data.completedNodeIds.includes(node.id) && this.isNodeCompletedInHistory(node)) {
          data.completedNodeIds.push(node.id);
        }
      });
    });

    const completedTotal = data.completedNodeIds.length;
    const progressPercent = data.totals.nodeCount > 0 ? Math.min(100, Math.round((completedTotal / data.totals.nodeCount) * 100)) : 0;
    const currentDayPlan = data.schedule.find(s => s.dayNumber === data.currentDay) || data.schedule[0];

    const adminBtnHtml = isAdmin ? `
      <button type="button" onclick="window.curriculumUI.showAdminOverrideModal()" style="background:#f59e0b; color:#78350f; border:1px solid #d97706; padding:6px 12px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:5px;">
        👑 Điều Chỉnh (Admin)
      </button>
    ` : '';

    const resetBtnHtml = (!data.isLockedByAdmin || isAdmin) ? `
      <button type="button" onclick="window.curriculumUI.resetRoadmap()" style="background:none; border:1px solid #cbd5e1; padding:5px 10px; border-radius:8px; font-size:12px; color:#64748b; cursor:pointer;">
        🔄 Đặt lại
      </button>
    ` : `<span style="font-size:11.5px; color:#94a3b8; font-weight:bold;"><i class="fa-solid fa-lock"></i> Lộ trình đã khóa bởi Admin</span>`;

    container.innerHTML = `
      <div class="cs-container">
        <div class="cs-header">
          <div class="cs-title-group">
            <span class="cs-badge cs-badge-speed" onclick="window.curriculumUI.showBenchmarkExplanationModal()">
              TỐC ĐỘ: ${data.speedProfile.toUpperCase()} (${data.dailyHours || 1.0}h/ngày) <i class="fa-solid fa-circle-info"></i>
            </span>
            <h3>📅 NHIỆM VỤ HỌC HÔM NAY (NGÀY ${data.currentDay}/${data.schedule.length})</h3>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="window.curriculumUI.showZaloReportModal()" style="background:#0068ff; color:white; border:none; padding:6px 12px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:5px;">
              <i class="fa-solid fa-paper-plane"></i> Báo Cáo Zalo
            </button>
            <button type="button" onclick="window.curriculumUI.showFullRoadmapModal()" style="background:#0f172a; color:white; border:none; padding:6px 14px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-map-location-dot text-sky-400"></i> Xem Toàn Bộ Lộ Trình
            </button>
            ${adminBtnHtml}
            ${resetBtnHtml}
          </div>
        </div>

        <div class="cs-stats-grid">
          <div class="cs-stat-box">
            <div class="cs-stat-val">${completedTotal}/${data.totals.nodeCount}</div>
            <div class="cs-stat-lbl">Đốt đã xong</div>
          </div>
          <div class="cs-stat-box">
            <div class="cs-stat-val" style="color:#16a34a;">${data.totals.totalSelfStudyHours}h</div>
            <div class="cs-stat-lbl">Tổng giờ tự cày</div>
          </div>
          <div class="cs-stat-box">
            <div class="cs-stat-val" style="color:#8B1518;">${data.totals.totalCoachHours}h</div>
            <div class="cs-stat-lbl">Giờ giáo viên (${data.totals.coachSessionsEstimate} buổi)</div>
          </div>
          <div class="cs-stat-box">
            <div class="cs-stat-val" style="color:#d97706;">${data.schedule.length} ngày</div>
            <div class="cs-stat-lbl">Thời gian về đích</div>
          </div>
        </div>

        <div class="cs-progress-container">
          <div class="cs-progress-header">
            <span>Tiến độ hoàn thành lộ trình</span>
            <span><b>${progressPercent}%</b> (${completedTotal}/${data.totals.nodeCount} bài)</span>
          </div>
          <div class="cs-progress-bar-bg">
            <div class="cs-progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <div class="cs-task-list">
          ${currentDayPlan.nodes.map(node => {
            const isDone = data.completedNodeIds.includes(node.id) || this.isNodeCompletedInHistory(node);
            return `
              <div class="cs-task-card ${isDone ? 'is-done' : ''}">
                <div class="cs-task-info">
                  <div class="cs-task-meta">
                    <span class="cs-node-id">${node.id}</span>
                    <span class="cs-node-domain">${node.domain}</span>
                    <span class="cs-node-time">⏱️ Dự kiến: <b>${node.assignedDurationMinutes} phút</b></span>
                    ${node.coachHours > 0 ? `<span style="font-size:11px; color:#991b1b; font-weight:bold;">👨‍🏫 Có thầy sửa: ${node.coachHours}h</span>` : ''}
                  </div>
                  <div class="cs-task-title">
                    ${isDone ? '✓ ' : ''}${node.title}
                  </div>
                  <div style="font-size:12px; color:#0369a1; background:#f0f9ff; border:1px solid #bae6fd; padding:4px 8px; border-radius:6px; margin-top:5px; line-height:1.4;">
                    <i class="fa-solid fa-lightbulb text-amber-500"></i> <b>Lợi ích:</b> ${node.benefit || 'Củng cố phản xạ và độ chính xác ngữ liệu.'}
                  </div>
                </div>

                <div>
                  ${isDone ? `
                    <span class="cs-btn-action cs-btn-done">
                      <i class="fa-solid fa-check"></i> Đã hoàn thành
                    </span>
                  ` : `
                    <a href="${node.url}" target="_blank" onclick="window.curriculumUI.completeNode('${node.id}')" class="cs-btn-action cs-btn-start">
                      🚀 Vào làm bài &rarr;
                    </a>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  showFullRoadmapModal() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    this.openModal(`
      <div class="cs-modal-header">
        <div>
          <h3 style="margin:0; font-size:17px; font-weight:bold;">🗺️ TOÀN CẢNH LỘ TRÌNH HỌC TẬP (${data.schedule.length} NGÀY)</h3>
          <span style="font-size:12px; color:#94a3b8;">Đang ở Ngày ${data.currentDay} • Tiến độ: ${data.completedNodeIds.length}/${data.totals.nodeCount} đốt</span>
        </div>
        <button onclick="window.curriculumUI.closeModal()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div class="cs-modal-body">
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${data.schedule.map(day => {
            const isToday = day.dayNumber === data.currentDay;
            const isPast = day.dayNumber < data.currentDay;
            return `
              <div class="cs-day-timeline-box" style="${isToday ? 'border-color:#0284c7; box-shadow:0 0 0 2px rgba(2,132,199,0.2);' : ''}">
                <div class="cs-day-timeline-header" style="${isToday ? 'background:#e0f2fe; color:#0369a1;' : ''}">
                  <span>📅 NGÀY ${day.dayNumber} ${isToday ? '👈 (HÔM NAY)' : (isPast ? '✓ (ĐÃ QUA)' : '')}</span>
                  <span style="font-size:12px; font-weight:normal; color:#64748b;">⏱️ ${day.totalMinutes} phút</span>
                </div>
                <div style="padding:10px 14px; display:flex; flex-direction:column; gap:8px;">
                  ${day.nodes.map(n => {
                    const done = data.completedNodeIds.includes(n.id) || this.isNodeCompletedInHistory(n);
                    return `
                      <div style="display:flex; justify-content:space-between; align-items:flex-start; font-size:13px; border-bottom:1px dashed #e2e8f0; padding-bottom:8px; gap:10px;">
                        <div style="flex:1;">
                          <div>
                            <span style="font-family:monospace; font-weight:bold; font-size:11px; background:#1e293b; color:white; padding:1px 5px; border-radius:3px;">${n.id}</span>
                            <span style="font-weight:700; margin-left:6px; color:${done ? '#16a34a' : '#1e293b'};">${done ? '✓ ' : ''}${n.title}</span>
                          </div>
                          <div style="font-size:11.5px; color:#0369a1; margin-top:3px;">
                            💡 ${n.benefit || 'Tăng cường phản xạ ngôn ngữ.'}
                          </div>
                        </div>
                        <span style="font-size:11.5px; color:#64748b; white-space:nowrap; font-weight:bold;">${n.assignedDurationMinutes}p</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `);
  }

  showBenchmarkExplanationModal() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    const speed = data?.speedProfile || 'normal';
    const info = BENCHMARK_EXPLANATIONS[speed] || BENCHMARK_EXPLANATIONS.normal;

    this.openModal(`
      <div class="cs-modal-header">
        <h3 style="margin:0; font-size:16px; font-weight:bold;">⏱️ Chú Thích Định Mức Thời Gian: ${info.label}</h3>
        <button onclick="window.curriculumUI.closeModal()" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;">&times;</button>
      </div>
      <div class="cs-modal-body">
        <p style="font-size:13px; color:#64748b; margin-top:0;">${info.desc}</p>
        <table class="cs-benchmark-table">
          <thead>
            <tr>
              <th>Phân hệ / Dạng bài tập</th>
              <th>Thời gian làm ước tính</th>
              <th>Giờ giáo viên sửa</th>
            </tr>
          </thead>
          <tbody>
            ${info.table.map(r => `
              <tr>
                <td><b>${r.type}</b></td>
                <td><span style="color:#0284c7; font-weight:bold;">${r.time}</span></td>
                <td><span style="color:#dc2626; font-weight:bold;">${r.coach}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `);
  }

  renderTodayHistoryAndCalendar(allAttempts, email) {
    const historyListEl = document.getElementById('historyResultsList');
    const badgeEl = document.getElementById('totalAttemptsBadge');
    if (!historyListEl) return;

    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const todayAttempts = allAttempts.filter(att => att.timestamp && att.timestamp.includes(todayStr));
    if (badgeEl) badgeEl.innerText = `${todayAttempts.length} bài hôm nay`;

    let historyHtml = '';
    if (todayAttempts.length === 0) {
      historyHtml = `
        <div class="cs-empty-today">
          <i class="fa-regular fa-calendar-xmark text-lg text-rose-500 mb-1"></i><br>
          Chưa có bài tập nào đã được làm hôm nay.<br>
          <span style="font-size:12px; color:#94a3b8;">Hãy bắt đầu làm các bài trong Lộ trình hôm nay bên trên nhé!</span>
        </div>
      `;
    } else {
      historyHtml = todayAttempts.map(att => {
        let targetPage = att.pageUrl || 'reading/runner-reading.html';
        if (targetPage.startsWith('runner-reading.html')) targetPage = 'reading/' + targetPage;
        if (targetPage.startsWith('runner-listening.html')) targetPage = 'listening/' + targetPage;
        const separator = targetPage.includes('?') ? '&' : '?';
        const reviewLink = `${targetPage}${separator}attemptId=${att.id}&email=${encodeURIComponent(email)}`;

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
            <div>
              <b style="color:#0f172a; font-size:14px;">📝 ${att.testTitle}</b>
              <div style="font-size:12px; color:#64748b; margin-top:2px;">
                ⏱️ Nộp lúc: <b>${att.timestamp}</b> • Làm trong: <b>${att.timeSpent || 'N/A'}</b>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="score-pill" style="background:#16a34a; color:white; font-size:12px; font-weight:bold; padding:3px 10px; border-radius:20px;">Điểm: ${att.score}</span>
              <a href="${reviewLink}" target="_blank" style="background:#0284c7; color:white; text-decoration:none; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:bold;">👁️ Xem lại bài</a>
            </div>
          </div>
        `;
      }).join('');
    }

    const calendarHtml = this.generateMonthCalendarHtml(allAttempts);
    historyListEl.innerHTML = historyHtml + calendarHtml;
  }

  generateMonthCalendarHtml(allAttempts) {
    const year = this.calCurrentYear;
    const month = this.calCurrentMonth;
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const dayAttemptCounts = {};
    allAttempts.forEach(att => {
      const m = att.timestamp?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) {
        const d = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const y = parseInt(m[3], 10);
        if (mo === month && y === year) dayAttemptCounts[d] = (dayAttemptCounts[d] || 0) + 1;
      }
    });

    const dailyTarget = 2;
    const shiftedFirstDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;

    let cellsHtml = '';
    for (let i = 0; i < shiftedFirstDay; i++) {
      cellsHtml += `<div class="cs-cal-cell cs-cal-cell-empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isPastOrToday = (year < todayYear) || (year === todayYear && month < todayMonth) || (year === todayYear && month === todayMonth && d <= todayDate);
      const count = dayAttemptCounts[d] || 0;

      let colorClass = 'cal-color-future';
      let statusLabel = 'Chưa tới';

      if (isPastOrToday) {
        const ratio = count / dailyTarget;
        if (count === 0) { colorClass = 'cal-color-zero'; statusLabel = '0 bài (0%)'; }
        else if (ratio < 0.5) { colorClass = 'cal-color-low'; statusLabel = `${count} bài (<50%)`; }
        else if (ratio < 1.0) { colorClass = 'cal-color-mid'; statusLabel = `${count} bài (≥50%)`; }
        else if (ratio === 1.0) { colorClass = 'cal-color-full'; statusLabel = `${count} bài (100%)`; }
        else { colorClass = 'cal-color-over'; statusLabel = `✨ ${count} bài (>100%)`; }
      }

      cellsHtml += `
        <div class="cs-cal-cell ${colorClass}" title="Ngày ${d}/${month + 1}/${year}: ${statusLabel}">
          <span>${d}</span>
          ${isPastOrToday ? `<span class="cs-cal-subtext">${count} bài</span>` : ''}
        </div>
      `;
    }

    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

    return `
      <div class="cs-calendar-wrapper">
        <div class="cs-calendar-nav">
          <div class="cs-calendar-title">
            🗓️ Lịch Hoạt Động & Chuyên Cần: <b>${monthNames[month]} / ${year}</b>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="cs-cal-btn" onclick="window.curriculumUI.changeCalendarMonth(-1)">◀ Tháng trước</button>
            <button type="button" class="cs-cal-btn" onclick="window.curriculumUI.changeCalendarMonth(1)">Tháng sau ▶</button>
          </div>
        </div>

        <div class="cs-calendar-grid">
          <div class="cs-cal-day-name">T2</div>
          <div class="cs-cal-day-name">T3</div>
          <div class="cs-cal-day-name">T4</div>
          <div class="cs-cal-day-name">T5</div>
          <div class="cs-cal-day-name">T6</div>
          <div class="cs-cal-day-name">T7</div>
          <div class="cs-cal-day-name" style="color:#ef4444;">CN</div>
          ${cellsHtml}
        </div>

        <div class="cs-legend-bar">
          <div class="cs-legend-item"><span class="cs-legend-dot" style="background:#dc2626;"></span><span>0% (Không làm)</span></div>
          <div class="cs-legend-item"><span class="cs-legend-dot" style="background:#fecdd3; border:1px solid #fda4af;"></span><span>&lt; 50%</span></div>
          <div class="cs-legend-item"><span class="cs-legend-dot" style="background:#bbf7d0; border:1px solid #86efac;"></span><span>50% - 99%</span></div>
          <div class="cs-legend-item"><span class="cs-legend-dot" style="background:#15803d;"></span><span>100% Đạt chỉ tiêu</span></div>
          <div class="cs-legend-item"><span class="cs-legend-dot" style="background:linear-gradient(135deg, #fef08a, #f59e0b); border:1px solid #d97706;"></span><span>✨ &gt; 100% (Vượt chỉ tiêu)</span></div>
        </div>
      </div>
    `;
  }

  changeCalendarMonth(delta) {
    this.calCurrentMonth += delta;
    if (this.calCurrentMonth < 0) { this.calCurrentMonth = 11; this.calCurrentYear--; }
    else if (this.calCurrentMonth > 11) { this.calCurrentMonth = 0; this.calCurrentYear++; }
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const local = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
    this.renderTodayHistoryAndCalendar(local, email);
  }

  openModal(htmlContent) {
    this.closeModal();
    const modal = document.createElement('div');
    modal.id = 'csDynamicModal';
    modal.className = 'cs-modal-overlay';
    modal.innerHTML = `<div class="cs-modal-card">${htmlContent}</div>`;
    modal.onclick = (e) => { if (e.target === modal) this.closeModal(); };
    document.body.appendChild(modal);
  }

  closeModal() {
    document.getElementById('csDynamicModal')?.remove();
  }
}

export const curriculumUI = new CurriculumUISystem();
window.curriculumUI = curriculumUI;
