/**
 * curriculum-system/ui-system.js
 * BỘ ĐIỀU KHIỂN GIAO DIỆN LỘ TRÌNH, MICRO STT CHẨN ĐOÁN AI & PHÂN QUYỀN ADMIN
 */

import { curriculumEngineSystem } from './engine-system.js';
import { MASTER_CURRICULUM_SYSTEM } from './manifest-system.js';
import { analyzeStudentDiagnostic } from './ai-service-system.js';

let diagRecognition = null;
let isDiagRecording = false;

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

  // =========================================================================
  // BẬT / TẮT MICRO THU ÂM CHẨN ĐOÁN
  // =========================================================================
  toggleMicrophone() {
    if (!diagRecognition) {
      alert("⚠️ Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy gõ trực tiếp vào ô bên dưới nhé!");
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
        if (status) status.innerText = "🔴 Đang lắng nghe giọng nói của em...";
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

  // =========================================================================
  // GỬI CHO AI GEMINI PHÂN TÍCH & GỌT ĐỐT
  // =========================================================================
  async runAIDiagnostic() {
    const text = document.getElementById('diagTextInput')?.value.trim();
    if (!text) {
      alert("⚠️ Em vui lòng nói vào micro, gõ chữ hoặc tải file báo cáo trước khi bấm chẩn đoán nhé!");
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

      // Tính thử số đốt gọt được
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
          <button type="button" onclick="window.curriculumUI.applyAIDiagnosticRoadmap(${JSON.stringify(result).replace(/"/g, '&quot;')})" style="background:#16a34a; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:800; font-size:13.5px; cursor:pointer; width:100%; shadow;">
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

  // =========================================================================
  // ADMIN OVERRIDE PANEL
  // =========================================================================
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

    const newSpeed = document.getElementById('admSpeedSelect').value;
    const newHours = parseFloat(document.getElementById('admHoursSelect').value) || 1.0;
    const isLocked = document.getElementById('admLockToggle').checked;

    data.speedProfile = newSpeed;
    data.dailyHours = newHours;
    data.isLockedByAdmin = isLocked;

    // Tái cấu trúc lịch
    const retained = curriculumEngineSystem.pruneCurriculum(data.aiDiagnosticData?.mastered_tags || []);
    data.totals = curriculumEngineSystem.calculateTotals(retained, newSpeed);
    data.schedule = curriculumEngineSystem.generateDailyCalendar(retained, newSpeed, newHours).dailySchedule;

    this.saveRoadmap(email, data);
    this.render();
    this.closeModal();
    alert("👑 Admin đã cập nhật lộ trình thành công!");
  }

  // =========================================================================
  // RENDER GIAO DIỆN CHÍNH
  // =========================================================================
  render(targetContainerId = 'roadmapSectionMount') {
    let container = document.getElementById(targetContainerId);
    if (!container) return;

    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    const isAdmin = this.checkIsAdmin();

    // CHƯA CÓ LỘ TRÌNH ➔ HIỆN CỔNG CHẨN ĐOÁN AI ĐA NĂNG
    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div style="text-align:center; padding:10px;">
            <h3 style="margin:0 0 6px 0; font-size:21px; font-weight:800; color:#0284c7;">🎯 THIẾT LẬP LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA (858 BÀI)</h3>
            <p style="margin:0 auto 16px auto; max-width:620px; font-size:13px; color:#64748b;">
              Chọn xuất phát điểm nhanh, hoặc sử dụng <b>Trợ lý AI Gemini</b> để tự động nhận diện giọng nói và gọt bài thừa:
            </p>

            <!-- LỰA CHỌN 1: PRESET NHANH -->
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

            <!-- LỰA CHỌN 2: CHẨN ĐOÁN THÔNG MINH BẰNG AI GEMINI -->
            <div class="cs-diag-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <b style="color:#0369a1; font-size:14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> CHẨN ĐOÁN TRÌNH ĐỘ BẰNG AI GEMINI (SPEECH-TO-TEXT)</b>
                  <div style="font-size:12px; color:#64748b; margin-top:2px;">Bấm Micro để nói tự thuật trình độ, hoặc dán bảng điểm thi thử/báo cáo vào ô bên dưới:</div>
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

    // ĐÃ CÓ LỘ TRÌNH
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

  // HÀM TIỆN ÍCH MODAL
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
