/**
 * curriculum-system/ui-system.js
 * GIAO DIỆN CHỌN MA TRẬN 2 ĐẦU - BẢNG ĐIỀU KHIỂN & LỊCH CHUYÊN CẦN DUOLINGO
 */

import { curriculumEngineSystem } from './engine-system.js';
import { MASTER_CURRICULUM_SYSTEM } from './manifest-system.js';
import { analyzeStudentDiagnostic } from './ai-service-system.js';

const CLOUD_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec";

let diagRecognition = null;
let isDiagRecording = false;

class CurriculumUISystem {
  constructor() {
    curriculumEngineSystem.setNodes(MASTER_CURRICULUM_SYSTEM);
    this.calCurrentMonth = new Date().getMonth();
    this.calCurrentYear = new Date().getFullYear();
    this.cachedAttempts = [];
    this.cachedEmail = '';
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
    } catch(e) {}
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

      const startB = parseFloat(result.estimated_band) || 2.0;
      const targetB = Math.min(7.0, parseFloat(result.target_band) || 6.5);
      const pruned = curriculumEngineSystem.pruneCurriculumByBands(startB, targetB, result.weak_tags || []);
      const savedCount = MASTER_CURRICULUM_SYSTEM.length - pruned.length;
      const stats = curriculumEngineSystem.calculateSessionsByBands(startB, targetB);

      resBox.innerHTML = `
        <div class="cs-ai-report-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <b style="color:#166534; font-size:15px;">🎯 KẾT QUẢ CHẨN ĐOÁN TỪ AI GEMINI</b>
            <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:20px; font-weight:800; font-size:12px;">
              Band ước lượng: ~${startB} ➔ Mục tiêu: ${targetB}
            </span>
          </div>
          <p style="font-size:13px; color:#1e293b; margin:10px 0; line-height:1.5;">
            <b>Nhận xét:</b> ${result.academic_summary}
          </p>
          <div style="display:flex; gap:12px; font-size:12px; color:#64748b; flex-wrap:wrap; margin-bottom:12px;">
            <span>✂️ Gọt bỏ: <b>${savedCount} bài thừa</b></span>
            <span>🏫 Lớp học: <b>${stats.sessions} buổi</b> (${stats.months} tháng)</span>
            <span>⏱️ BTVN: <b>1.5h/ngày</b> (${stats.hours}h tự cày)</span>
          </div>
          <button type="button" onclick="window.curriculumUI.applyBandRoadmap(${startB}, ${targetB}, ${JSON.stringify(result).replace(/"/g, '&quot;')})" style="background:#16a34a; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:800; font-size:13.5px; cursor:pointer; width:100%;">
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

  applyBandRoadmap(startBand, targetBand, aiData = null) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const sBand = parseFloat(startBand) || 0.0;
    const tBand = Math.min(7.0, parseFloat(targetBand) || 7.0);

    if (sBand >= tBand) {
      alert("⚠️ Điểm mục tiêu mong muốn (Target Band) phải lớn hơn Điểm hiện tại của em ít nhất 0.5 Band nhé!");
      return;
    }

    const retainedNodes = curriculumEngineSystem.pruneCurriculumByBands(sBand, tBand, aiData?.weak_tags || []);
    const totals = curriculumEngineSystem.calculateTotals(retainedNodes, 'normal', 1.5, sBand, tBand);
    const scheduleData = curriculumEngineSystem.generateDailyCalendar(retainedNodes, 'normal', 1.5, sBand, tBand);

    const payload = {
      createdAt: new Date().toISOString(),
      studentEmail: email,
      startBand: sBand,
      targetBand: tBand,
      speedProfile: 'normal',
      dailyHours: 1.5,
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

  render(targetContainerId = 'roadmapSectionMount') {
    let container = document.getElementById(targetContainerId);
    if (!container) return;

    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);

    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div style="text-align:center; padding:10px;">
            <h3 style="margin:0 0 6px 0; font-size:21px; font-weight:800; color:#8B1518;">🎯 THIẾT LẬP LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA</h3>
            <p style="margin:0 auto 16px auto; max-width:650px; font-size:13px; color:#64748b;">
              Chọn Điểm xuất phát và Mục tiêu mong muốn, hệ thống sẽ tự động băm lộ trình theo số buổi học (12 buổi/0.5 band + hệ số):
            </p>

            <div style="background:#FAF7F2; border:2px solid #E8E2D8; border-radius:16px; padding:18px; max-width:620px; margin:0 auto 20px auto; display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; text-align:left;">
                <div>
                  <label style="font-size:12.5px; font-weight:bold; color:#1e293b; display:block; margin-bottom:4px;">📍 1. Điểm hiện tại của em:</label>
                  <select id="matrixStartBandSelect" class="border border-slate-300 rounded p-2 text-sm w-full font-semibold">
                    <option value="0.0">0.0 (Mất gốc hoàn toàn)</option>
                    <option value="2.0">2.0 (Biết bập bõm, mất gốc)</option>
                    <option value="3.0">3.0 (Nhớ từ vựng căn bản)</option>
                    <option value="3.5">3.5 (Ngữ pháp câu đơn)</option>
                    <option value="4.0">4.0 (Đã học tiếng Anh cơ bản)</option>
                    <option value="4.5">4.5 (Có gốc, chưa làm đề)</option>
                    <option value="5.0" selected>5.0 (Bắt đầu làm quen đề)</option>
                    <option value="5.5">5.5 (Đã thi thử 5.0 - 5.5)</option>
                    <option value="6.0">6.0 (Cần lên 6.5 - 7.0)</option>
                    <option value="6.5">6.5 (Nước rút chạm trần 7.0)</option>
                  </select>
                </div>

                <div>
                  <label style="font-size:12.5px; font-weight:bold; color:#1e293b; display:block; margin-bottom:4px;">🎯 2. Mục tiêu mong muốn:</label>
                  <select id="matrixTargetBandSelect" class="border border-slate-300 rounded p-2 text-sm w-full font-semibold">
                    <option value="5.0">Band 5.0 (Tốt nghiệp cơ bản / Định cư)</option>
                    <option value="5.5">Band 5.5 (Chuẩn đầu ra Cao đẳng / ĐH)</option>
                    <option value="6.0" selected>Band 6.0 (Xét tuyển Đại học Top đầu)</option>
                    <option value="6.5">Band 6.5 (Chuẩn vàng Du học & Việc làm)</option>
                    <option value="7.0">Band 7.0 (TRẦN CAO NHẤT KHÓA HỌC)</option>
                  </select>
                </div>
              </div>

              <div style="font-size:12px; color:#64748b; text-align:left;">
                🏫 Lớp học: <b>3 buổi/tuần (2h/buổi = 12 buổi/tháng)</b> • BTVN: <b>1.5h tự cày/ngày</b>.
              </div>

              <button type="button" onclick="window.curriculumUI.applyBandRoadmap(document.getElementById('matrixStartBandSelect').value, document.getElementById('matrixTargetBandSelect').value)" style="background:#8B1518; color:white; border:none; padding:12px; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">
                🚀 BẮT ĐẦU TẠO LỘ TRÌNH RIÊNG
              </button>
            </div>

            <!-- CHẨN ĐOÁN THÔNG MINH BẰNG AI GEMINI -->
            <div class="cs-diag-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <b style="color:#0369a1; font-size:14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> HOẶC CHẨN ĐOÁN TỰ ĐỘNG BẰNG AI (SPEECH-TO-TEXT)</b>
                  <div style="font-size:12px; color:#64748b; margin-top:2px;">Bấm Micro để nói tự thuật trình độ, AI sẽ tự động tính toán lộ trình:</div>
                </div>
                <button type="button" id="btnDiagMic" class="cs-diag-mic-btn" onclick="window.curriculumUI.toggleMicrophone()">
                  <i class="fa-solid fa-microphone"></i> Bấm để nói tự thuật trình độ
                </button>
              </div>

              <textarea id="diagTextInput" class="cs-diag-textarea" placeholder="Ví dụ: Em đang ở band 5.0 muốn học lên 6.5..."></textarea>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <input type="file" id="diagFileInput" accept=".txt" style="display:none;" onchange="window.curriculumUI.handleFileUpload(this.files[0])">
                  <button type="button" onclick="document.getElementById('diagFileInput').click()" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;">
                    📄 Tải file báo cáo (.txt)
                  </button>
                  <span id="diagMicStatus" style="font-size:12px; color:#16a34a; font-weight:bold;"></span>
                </div>

                <button type="button" id="btnStartAIAnalyze" onclick="window.curriculumUI.runAIDiagnostic()" style="background:#0284c7; color:white; border:none; padding:9px 18px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">
                  ⚡ Gửi AI Phân Tích & Băm Lộ Trình
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

    const resetBtnHtml = `
      <button type="button" onclick="window.curriculumUI.resetRoadmap()" style="background:none; border:1px solid #cbd5e1; padding:5px 10px; border-radius:8px; font-size:12px; color:#64748b; cursor:pointer;">
        🔄 Đặt lại
      </button>
    `;

    container.innerHTML = `
      <div class="cs-container">
        <div class="cs-header">
          <div class="cs-title-group">
            <span class="cs-badge cs-badge-speed" style="background:#FFF4E5; color:#D97706; border:1.5px solid #FCD34D;">
              CHẶNG: BAND ${data.startBand || 0.0} ➔ ${data.targetBand || 7.0} (1.5h BTVN/NGÀY)
            </span>
            <h3>📅 NHIỆM VỤ HỌC HÔM NAY (NGÀY ${data.currentDay}/${data.schedule.length})</h3>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="window.curriculumUI.showFullRoadmapModal()" style="background:#0f172a; color:white; border:none; padding:6px 14px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-map-location-dot text-sky-400"></i> Xem Toàn Bộ Lộ Trình
            </button>
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
            <div class="cs-stat-lbl">BTVN Tự cày (1.5h/ngày)</div>
          </div>
          <div class="cs-stat-box">
            <div class="cs-stat-val" style="color:#8B1518;">${data.totals.totalLiveSessions} buổi</div>
            <div class="cs-stat-lbl">Lớp học GV (${data.totals.totalTeacherHours}h - HP: ${data.totals.tuitionVND})</div>
          </div>
          <div class="cs-stat-box">
            <div class="cs-stat-val" style="color:#d97706;">${data.totals.estimatedMonths} tháng</div>
            <div class="cs-stat-lbl">${data.totals.totalWeeks} tuần (${data.schedule.length} ngày BTVN)</div>
          </div>
        </div>

        <div class="cs-progress-container">
          <div class="cs-progress-header">
            <span>Tiến độ hoàn thành</span>
            <span><b>${progressPercent}%</b> (${completedTotal}/${data.totals.nodeCount} bài)</span>
          </div>
          <div class="cs-progress-bar-bg">
            <div class="cs-progress-bar-fill" style="width: ${progressPercent}%; background: #8B1518;"></div>
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
                  </div>
                  <div class="cs-task-title">
                    ${isDone ? '✓ ' : ''}${node.title}
                  </div>
                  <div style="font-size:12px; color:#0369a1; background:#f0f9ff; border:1px solid #bae6fd; padding:4px 8px; border-radius:6px; margin-top:5px; line-height:1.4;">
                    <i class="fa-solid fa-lightbulb text-amber-500"></i> <b>Lợi ích:</b> ${node.benefit || 'Củng cố phản xạ ngôn ngữ.'}
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
          <h3 style="margin:0; font-size:17px; font-weight:bold;">🗺️ TOÀN CẢNH LỘ TRÌNH: BAND ${data.startBand || 0.0} ➔ ${data.targetBand || 7.0}</h3>
          <span style="font-size:12px; color:#94a3b8;">Học phí: ${data.totals.tuitionVND} (${data.totals.totalLiveSessions} buổi học với GV) • ${data.totals.estimatedMonths} tháng (${data.schedule.length} ngày BTVN)</span>
        </div>
        <button onclick="window.curriculumUI.closeModal()" style="background:none; border:none; color:white; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div class="cs-modal-body">
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${data.schedule.map(day => {
            const isToday = day.dayNumber === data.currentDay;
            const isPast = day.dayNumber < data.currentDay;
            return `
              <div class="cs-day-timeline-box" style="${isToday ? 'border-color:#8B1518; box-shadow:0 0 0 2px rgba(139,21,24,0.2);' : ''}">
                <div class="cs-day-timeline-header" style="${isToday ? 'background:#FDF2F2; color:#8B1518;' : ''}">
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
                            💡 ${n.benefit || 'Củng cố phản xạ học thuật.'}
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

  // =========================================================================
  // PHƯƠNG THỨC RENDER LỊCH CHUYÊN CẦN DUOLINGO (ĐÃ KHÔI PHỤC VÀ HOÀN THIỆN)
  // =========================================================================
  renderTodayHistoryAndCalendar(attempts = [], email = '') {
    this.cachedAttempts = attempts;
    this.cachedEmail = email;

    const container = document.getElementById('historyResultsList');
    if (!container) return;

    const todayStr = this.getFormattedDate(new Date());
    const todayAttempts = attempts.filter(att => (att.timestamp || '').includes(todayStr));

    // Cập nhật huy hiệu số bài hôm nay
    const badge = document.getElementById('totalAttemptsBadge');
    if (badge) badge.innerText = `${todayAttempts.length} bài hôm nay`;

    // Tính chuỗi Streak 🔥
    const uniqueDates = new Set();
    attempts.forEach(att => {
      const m = att.timestamp?.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (m) uniqueDates.add(m[1]);
    });
    const streakCount = this.calculateStreak(uniqueDates);
    const streakBadge = document.getElementById('streakCounterBadge');
    if (streakBadge) {
      streakBadge.innerHTML = `<i class="fa-solid fa-fire"></i> ${streakCount} NGÀY`;
    }

    // 1. Khung lịch tháng heatmap
    const calHtml = this.generateMonthCalendarHtml(attempts);

    // 2. Khung danh sách bài tập hôm nay
    let todayListHtml = '';
    if (todayAttempts.length === 0) {
      todayListHtml = `
        <div style="text-align:center; padding:18px 12px; background:#FAF7F2; border-radius:14px; border:2px dashed #E8E2D8; margin-top:14px;">
          <div style="font-size:24px; margin-bottom:4px;">🔥</div>
          <b style="color:#261F1D; font-size:14.5px;">Hôm nay em chưa làm bài tập nào!</b>
          <div style="font-size:12.5px; color:#756D68; margin-top:2px;">Hãy hoàn thành 1 nhiệm vụ bên dưới để thắp sáng ngọn lửa Streak nhé.</div>
        </div>
      `;
    } else {
      todayListHtml = `<div style="margin-top:14px;">
        <b style="font-size:13.5px; color:#8B1518; display:block; margin-bottom:8px;">🎯 Chi tiết bài nộp trong ngày (${todayAttempts.length} bài):</b>
      `;
      todayAttempts.forEach(att => {
        const reviewLink = this.resolveReviewPageUrl(att.pageUrl, att.id, email);
        todayListHtml += `
          <div class="attempt-item-card">
            <div>
              <b style="font-size:14px; color:#261F1D;">📝 ${att.testTitle}</b>
              <div style="font-size:12px; font-weight:700; color:#756D68; margin-top:2px;">
                ⏱️ Nộp lúc: <b>${att.timestamp}</b> • Làm trong: <b>${att.timeSpent || 'N/A'}</b>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="score-pill">Điểm: ${att.score}</span>
              <a href="${reviewLink}" target="_blank" class="btn-review">👁️ Xem bài</a>
            </div>
          </div>
        `;
      });
      todayListHtml += `</div>`;
    }

    container.innerHTML = calHtml + todayListHtml;
  }

  generateMonthCalendarHtml(attempts) {
    const year = this.calCurrentYear;
    const month = this.calCurrentMonth;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const activeDates = new Set();
    attempts.forEach(att => {
      const m = att.timestamp?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (m && parseInt(m[2], 10) === (month + 1) && parseInt(m[3], 10) === year) {
        activeDates.add(parseInt(m[1], 10));
      }
    });

    const now = new Date();
    const isCurrentMonthNow = now.getFullYear() === year && now.getMonth() === month;
    const todayDateNum = now.getDate();

    let gridHtml = '';
    for (let i = 0; i < adjustedFirstDay; i++) {
      gridHtml += `<div class="duo-cal-day-cell" style="opacity:0; border:none; background:transparent;"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasDone = activeDates.has(day);
      const isToday = isCurrentMonthNow && (day === todayDateNum);

      let classes = ['duo-cal-day-cell'];
      if (hasDone) classes.push('has-done');
      if (isToday) classes.push('is-today');

      gridHtml += `<div class="${classes.join(' ')}">${day}</div>`;
    }

    return `
      <div class="duo-cal-box">
        <div class="duo-cal-top">
          <b style="font-size:14.5px; color:#261F1D;"><i class="fa-solid fa-fire text-amber-500"></i> LỊCH CHUYÊN CẦN: THÁNG ${month + 1}/${year}</b>
          <div style="display:flex; gap:6px;">
            <button type="button" class="duo-cal-nav-btn" onclick="window.curriculumUI.changeCalMonth(-1)">◀ Tháng trước</button>
            <button type="button" class="duo-cal-nav-btn" onclick="window.curriculumUI.changeCalMonth(1)">Tháng sau ▶</button>
          </div>
        </div>
        <div class="duo-cal-weekdays">
          <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
        </div>
        <div class="duo-cal-days-grid">${gridHtml}</div>
      </div>
    `;
  }

  changeCalMonth(delta) {
    this.calCurrentMonth += delta;
    if (this.calCurrentMonth > 11) {
      this.calCurrentMonth = 0;
      this.calCurrentYear += 1;
    } else if (this.calCurrentMonth < 0) {
      this.calCurrentMonth = 11;
      this.calCurrentYear -= 1;
    }
    this.renderTodayHistoryAndCalendar(this.cachedAttempts, this.cachedEmail);
  }

  getFormattedDate(d) {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
  }

  calculateStreak(uniqueDatesSet) {
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const str = this.getFormattedDate(checkDate);
      if (uniqueDatesSet.has(str)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = this.getFormattedDate(checkDate);
          if (uniqueDatesSet.has(yesterdayStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streak;
  }

  resolveReviewPageUrl(pageUrl, id, email) {
    let target = pageUrl || 'reading/runner-reading.html';
    if (target.startsWith('runner-reading.html')) target = 'reading/' + target;
    if (target.startsWith('runner-listening.html')) target = 'listening/' + target;
    const sep = target.includes('?') ? '&' : '?';
    return `${target}${sep}attemptId=${id}&email=${encodeURIComponent(email)}`;
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
