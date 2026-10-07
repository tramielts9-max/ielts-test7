/**
 * curriculum-system/ui-system.js
 * GIAO DIỆN CHỌN MA TRẬN 2 ĐẦU (START ➔ TARGET BAND), HIỂN THỊ 4 THÔNG SỐ VÀNG:
 * ĐỐT ĐÃ XONG | GIỜ TỰ CÀY (1.5H/NGÀY) | SỐ BUỔI HỌC VỚI GV (3 BUỔI/TUẦN) | THỜI GIAN VỀ ĐÍCH
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
      const targetB = 7.0; // Trần cao nhất là 7.0
      const pruned = curriculumEngineSystem.pruneCurriculumByBands(startB, targetB, result.weak_tags || []);
      const savedCount = MASTER_CURRICULUM_SYSTEM.length - pruned.length;

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
            <span>✂️ Đã gọt bỏ: <b>${savedCount} bài</b></span>
            <span>⏱️ BTVN: <b>1.5h/ngày</b></span>
            <span>🏫 Lớp học: <b>3 buổi/tuần (2h/buổi)</b></span>
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

  // ÁP DỤNG LỘ TRÌNH THEO 2 MỐC BAND BẤT KỲ
  applyBandRoadmap(startBand, targetBand, aiData = null) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const sBand = parseFloat(startBand) || 0.0;
    const tBand = parseFloat(targetBand) || 7.0;

    const retainedNodes = curriculumEngineSystem.pruneCurriculumByBands(sBand, tBand, aiData?.weak_tags || []);
    const totals = curriculumEngineSystem.calculateTotals(retainedNodes, 'normal', 1.5);
    const scheduleData = curriculumEngineSystem.generateDailyCalendar(retainedNodes, 'normal', 1.5);

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
    const isAdmin = this.checkIsAdmin();

    // 1. MÀN HÌNH CHƯA CÓ LỘ TRÌNH ➔ CHỌN MA TRẬN 2 ĐẦU (CÓ Ô 2.0)
    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div style="text-align:center; padding:10px;">
            <h3 style="margin:0 0 6px 0; font-size:21px; font-weight:800; color:#0284c7;">🎯 THIẾT LẬP LỘ TRÌNH CÁ NHÂN HÓA (MỌI MỐC BAND)</h3>
            <p style="margin:0 auto 16px auto; max-width:650px; font-size:13px; color:#64748b;">
              Chọn Điểm xuất phát và Điểm mục tiêu mong muốn, hệ thống sẽ tự động băm lộ trình và tính chuẩn xác số buổi học:
            </p>

            <!-- KHUNG CHỌN MA TRẬN 2 ĐẦU (BỔ SUNG Ô 2.0) -->
            <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:12px; padding:18px; max-width:620px; margin:0 auto 20px auto; display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; text-align:left;">
                <div>
                  <label style="font-size:12.5px; font-weight:bold; color:#1e293b; display:block; margin-bottom:4px;">📍 1. Điểm hiện tại của em:</label>
                  <select id="matrixStartBandSelect" class="border border-slate-300 rounded p-2 text-sm w-full font-semibold">
                    <option value="0.0">0.0 (Mất gốc hoàn toàn)</option>
                    <option value="2.0" selected>2.0 (Biết bập bõm, mất gốc)</option>
                    <option value="3.0">3.0 (Nhớ từ vựng căn bản)</option>
                    <option value="3.5">3.5 (Ngữ pháp câu đơn)</option>
                    <option value="4.0">4.0 (Đã học tiếng Anh cơ bản)</option>
                    <option value="4.5">4.5 (Có gốc, chưa làm đề)</option>
                    <option value="5.0">5.0 (Bắt đầu làm quen đề)</option>
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
                    <option value="6.0">Band 6.0 (Xét tuyển Đại học Top đầu)</option>
                    <option value="6.5" selected>Band 6.5 (Chuẩn vàng Du học & Việc làm)</option>
                    <option value="7.0">Band 7.0 (TRẦN CAO NHẤT KHÓA HỌC)</option>
                  </select>
                </div>
              </div>

              <div style="font-size:12px; color:#64748b; text-align:left;">
                ⏱️ Quy chuẩn: <b>1.5h BTVN tự cày/ngày</b> • Lớp học: <b>3 buổi/tuần (2h/buổi = 12 buổi/tháng)</b>.
              </div>

              <button type="button" onclick="window.curriculumUI.applyBandRoadmap(document.getElementById('matrixStartBandSelect').value, document.getElementById('matrixTargetBandSelect').value)" style="background:#0284c7; color:white; border:none; padding:11px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer; shadow;">
                🚀 BẮT ĐẦU TẠO LỘ TRÌNH RIÊNG
              </button>
            </div>

            <!-- CHẨN ĐOÁN THÔNG MINH BẰNG AI GEMINI -->
            <div class="cs-diag-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                  <b style="color:#0369a1; font-size:14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> HOẶC CHẨN ĐOÁN TỰ ĐỘNG BẰNG AI (SPEECH-TO-TEXT)</b>
                  <div style="font-size:12px; color:#64748b; margin-top:2px;">Bấm Micro để nói tự thuật trình độ, AI sẽ tự động đoán điểm và tạo lộ trình:</div>
                </div>
                <button type="button" id="btnDiagMic" class="cs-diag-mic-btn" onclick="window.curriculumUI.toggleMicrophone()">
                  <i class="fa-solid fa-microphone"></i> Bấm để nói tự thuật trình độ
                </button>
              </div>

              <textarea id="diagTextInput" class="cs-diag-textarea" placeholder="Ví dụ: Em đang ở band 2.0 bập bõm, muốn học lên 6.5..."></textarea>

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

    // 2. MÀN HÌNH ĐÃ CÓ LỘ TRÌNH ➔ 4 THÔNG SỐ VÀNG CHUẨN XÁC
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
            <span class="cs-badge cs-badge-speed">
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

        <!-- 4 Ô THỐNG KÊ VÀNG CHUẨN TOÁN HỌC -->
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
            <div class="cs-stat-lbl">Lớp học với GV (${data.totals.totalTeacherHours}h trực tiếp)</div>
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
          <span style="font-size:12px; color:#94a3b8;">Thời gian: ${data.totals.estimatedMonths} tháng (${data.totals.totalLiveSessions} buổi học với GV) • ${data.schedule.length} ngày BTVN</span>
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
