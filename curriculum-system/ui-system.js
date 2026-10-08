/**
 * curriculum-system/ui-system.js
 * GIAO DIỆN CHỌN MA TRẬN 2 ĐẦU - BẢNG ĐIỀU KHIỂN & LỊCH CHUYÊN CẦN DUOLINGO 5 MÀU
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
    this.selectedDateStr = this.getFormattedDate(new Date()); // Ngày đang được chọn trên lịch
    this.isListCollapsed = false; // Trạng thái thu gọn/mở rộng danh sách bài tập
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

  // ĐỐI SOÁT CHUẨN XÁC: TÌM BÀI ĐÃ NỘP TRONG LỊCH SỬ ĐỂ LẤY ĐIỂM VÀ THỜI GIAN THẬT
  getNodeCompletionInfo(node) {
    try {
      const history = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
      const match = history.find(item => {
        if (!item) return false;
        const t = (item.testTitle || '').toLowerCase();
        const nTitle = (node.title || '').toLowerCase();
        const nId = (node.id || '').toLowerCase();
        const u = (item.pageUrl || '').toLowerCase();
        const nu = (node.url || '').toLowerCase();

        const matchId = nId && t.includes(nId);
        const matchTitle = (nTitle && t.includes(nTitle)) || (t && nTitle.includes(t));
        const matchUrl = nu && u && (u.includes(nu) || nu.includes(u));

        // Đối chiếu mã bài (ví dụ [01.2], 01-1, etc.)
        const codeInNode = node.url?.match(/[\d]+[\-\.][\d]+/)?.[0];
        const matchCode = codeInNode && t.includes(codeInNode);

        return matchId || matchTitle || matchUrl || matchCode;
      });

      if (match) {
        return {
          isCompleted: true,
          score: match.score || 'Đã nộp',
          timeSpent: match.timeSpent && match.timeSpent !== 'N/A' ? match.timeSpent : 'Hoàn thành',
          timestamp: match.timestamp || ''
        };
      }
    } catch(e) {}
    return { isCompleted: false };
  }

  isNodeCompletedInHistory(node) {
    return this.getNodeCompletionInfo(node).isCompleted;
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

  // RENDER KHỐI LỘ TRÌNH TẠI MÀN HÌNH CHÍNH
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
              Chọn Điểm xuất phát và Mục tiêu mong muốn, hệ thống sẽ tự động băm lộ trình theo số buổi học:
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

    // ĐỐI SOÁT THẬT: Chỉ đánh dấu hoàn thành nếu có trong lịch sử nộp bài
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

    container.innerHTML = `
      <div class="cs-container" style="border: 2.5px solid #E8E2D8; border-bottom: 5px solid #D3CBC0; border-radius: 22px;">
        
        <!-- BANNER NỔI BẬT: XEM TOÀN BỘ LỘ TRÌNH DẪN SANG ROADMAP.HTML -->
        <div style="background: linear-gradient(135deg, #8B1518 0%, #B91C1C 100%); border-radius: 18px; padding: 18px 22px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 4px 0 #5E0C0E; color: white;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #FEF08A; color: #854D0E; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 20px;">CHẶNG: BAND ${data.startBand || 0.0} ➔ ${data.targetBand || 7.0}</span>
              <span style="font-size: 13px; opacity: 0.9;">(1.5h BTVN/ngày)</span>
            </div>
            <h3 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">🗺️ BẢN ĐỒ TOÀN CẢNH LỘ TRÌNH</h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.92;">Xem chi tiết từng ngày học, các dạng đề Cam 17-21 và bài giảng được phân bổ</p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center;">
            <a href="curriculum-system/roadmap.html" class="btn-3d" style="background: #FFFFFF; color: #8B1518 !important; border-bottom: 4px solid rgba(0,0,0,0.18); font-size: 14px; padding: 12px 22px;">
              🚀 XEM TOÀN BỘ LỘ TRÌNH &rarr;
            </a>
            <button type="button" onclick="window.curriculumUI.resetRoadmap()" class="btn-3d" style="background: rgba(255,255,255,0.2); color: #FFFFFF !important; border: 1.5px solid rgba(255,255,255,0.4); border-bottom: 4px solid rgba(0,0,0,0.2); padding: 12px 16px; font-size: 13px;" title="Thiết lập lại lộ trình">
              🔄 Đặt lại
            </button>
          </div>
        </div>

        <div class="cs-header" style="border-bottom: 2px solid #FAF7F2;">
          <div class="cs-title-group">
            <h3 style="font-size: 18px; color: #8B1518;">
              <i class="fa-solid fa-calendar-day"></i> NHIỆM VỤ HỌC HÔM NAY (NGÀY ${data.currentDay}/${data.schedule.length})
            </h3>
          </div>
        </div>

        <!-- 4 Ô THỐNG KÊ VÀNG -->
        <div class="cs-stats-grid">
          <div class="cs-stat-box" style="background: #FAF7F2; border: 1.5px solid #E8E2D8; border-radius: 14px;">
            <div class="cs-stat-val" style="color: #8B1518;">${completedTotal}/${data.totals.nodeCount}</div>
            <div class="cs-stat-lbl">Đốt đã xong</div>
          </div>
          <div class="cs-stat-box" style="background: #FAF7F2; border: 1.5px solid #E8E2D8; border-radius: 14px;">
            <div class="cs-stat-val" style="color: #16A34A;">${data.totals.totalSelfStudyHours}h</div>
            <div class="cs-stat-lbl">BTVN Tự cày (1.5h/ngày)</div>
          </div>
          <div class="cs-stat-box" style="background: #FAF7F2; border: 1.5px solid #E8E2D8; border-radius: 14px;">
            <div class="cs-stat-val" style="color: #0284C7;">${data.totals.totalLiveSessions} buổi</div>
            <div class="cs-stat-lbl">Lớp học GV (${data.totals.totalTeacherHours}h - HP: ${data.totals.tuitionVND})</div>
          </div>
          <div class="cs-stat-box" style="background: #FAF7F2; border: 1.5px solid #E8E2D8; border-radius: 14px;">
            <div class="cs-stat-val" style="color: #D97706;">${data.totals.estimatedMonths} tháng</div>
            <div class="cs-stat-lbl">${data.totals.totalWeeks} tuần (${data.schedule.length} ngày BTVN)</div>
          </div>
        </div>

        <div class="cs-progress-container">
          <div class="cs-progress-header">
            <span>Tiến độ hoàn thành</span>
            <span><b>${progressPercent}%</b> (${completedTotal}/${data.totals.nodeCount} bài)</span>
          </div>
          <div class="cs-progress-bar-bg" style="background: #E8E2D8; height: 14px;">
            <div class="cs-progress-bar-fill" style="width: ${progressPercent}%; background: #8B1518;"></div>
          </div>
        </div>

        <!-- DANH SÁCH BÀI TẬP HÔM NAY: CHỈ KHI NỘP BÀI THẬT MỚI HIỆN HOÀN THÀNH KÈM ĐIỂM SỐ -->
        <div class="cs-task-list">
          ${currentDayPlan.nodes.map(node => {
            const compInfo = this.getNodeCompletionInfo(node);
            const isDone = compInfo.isCompleted;

            return `
              <div class="cs-task-card ${isDone ? 'is-done' : ''}" style="border: 2px solid ${isDone ? '#86EFAC' : '#E8E2D8'}; border-radius: 16px; background: ${isDone ? '#F0FDF4' : '#FFFFFF'};">
                <div class="cs-task-info">
                  <div class="cs-task-meta">
                    <span class="cs-node-id">${node.id}</span>
                    <span class="cs-node-domain" style="background: #FDEDEE; color: #8B1518;">${node.domain}</span>
                    <span class="cs-node-time">⏱️ Dự kiến: <b>${node.assignedDurationMinutes} phút</b></span>
                  </div>
                  <div class="cs-task-title" style="font-size: 15px; margin-top: 4px;">
                    ${isDone ? '✓ ' : ''}${node.title}
                  </div>
                  
                  ${isDone ? `
                    <div style="font-size: 12.5px; font-weight: 800; color: #166534; background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 8px; padding: 4px 10px; margin-top: 6px; display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                      <span>🎯 Điểm đạt: <b>${compInfo.score}</b></span>
                      <span>⏱️ Thời gian làm: <b>${compInfo.timeSpent}</b></span>
                      <span>📅 Nộp lúc: <b>${compInfo.timestamp}</b></span>
                    </div>
                  ` : `
                    <div style="font-size: 12px; color: #756D68; background: #FAF7F2; border: 1px solid #E8E2D8; padding: 5px 10px; border-radius: 8px; margin-top: 6px; line-height: 1.4;">
                      💡 <b>Lợi ích:</b> ${node.benefit || 'Củng cố phản xạ ngôn ngữ và kỹ năng học thuật.'}
                    </div>
                  `}
                </div>

                <div>
                  ${isDone ? `
                    <span class="cs-btn-action cs-btn-done" style="background: #DCFCE7; color: #166534; border: 1.5px solid #86EFAC; font-weight: 900;">
                      <i class="fa-solid fa-check"></i> Đã hoàn thành
                    </span>
                  ` : `
                    <a href="${node.url}" target="_blank" class="cs-btn-action cs-btn-start" style="background: #8B1518; color: #FFFFFF; font-weight: 900; border-bottom: 3px solid #5E0C0E;">
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

  // =========================================================================
  // BỘ MÁY LỊCH CHUYÊN CẦN 5 MÀU (HEATMAP), CLICK CHỌN NGÀY & THU GỌN ACCORDION
  // =========================================================================
  renderTodayHistoryAndCalendar(attempts = [], email = '') {
    this.cachedAttempts = attempts;
    this.cachedEmail = email;

    const container = document.getElementById('historyResultsList');
    if (!container) return;

    // Lọc danh sách bài tập theo ngày đang được chọn (selectedDateStr)
    const selectedAttempts = attempts.filter(att => (att.timestamp || '').includes(this.selectedDateStr));

    // Cập nhật huy hiệu số bài hôm nay
    const todayStr = this.getFormattedDate(new Date());
    const todayAttemptsCount = attempts.filter(att => (att.timestamp || '').includes(todayStr)).length;
    const badge = document.getElementById('totalAttemptsBadge');
    if (badge) badge.innerText = `${todayAttemptsCount} bài hôm nay`;

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

    // 1. HTML Lịch tháng 5 màu & Bảng chú thích Legend
    const calHtml = this.generateMonthCalendarHtml(attempts);

    // 2. HTML Danh sách bài nộp theo ngày được chọn (có nút Thu gọn/Mở rộng)
    const isToday = this.selectedDateStr === todayStr;
    const displayDateLabel = isToday ? `Hôm nay (${this.selectedDateStr})` : `Ngày ${this.selectedDateStr}`;

    let listHtml = `
      <div style="margin-top: 18px; border-top: 2px dashed #E8E2D8; padding-top: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <b style="font-size: 14.5px; color: #8B1518;">
            📝 Bài tập đã nộp: ${displayDateLabel} (${selectedAttempts.length} bài)
          </b>
          <button type="button" onclick="window.curriculumUI.toggleListCollapse()" class="duo-cal-nav-btn" style="cursor: pointer;">
            ${this.isListCollapsed ? 'Mở rộng ▼' : 'Thu gọn ▲'}
          </button>
        </div>

        <div id="csSelectedDateListBody" style="display: ${this.isListCollapsed ? 'none' : 'block'};">
    `;

    if (selectedAttempts.length === 0) {
      listHtml += `
        <div style="text-align: center; padding: 20px 14px; background: #FAF7F2; border-radius: 14px; border: 2px dashed #E8E2D8;">
          <div style="font-size: 24px; margin-bottom: 4px;">📅</div>
          <b style="color: #261F1D; font-size: 14px;">Không có bài làm nào trong ngày ${this.selectedDateStr}</b>
          <div style="font-size: 12px; color: #756D68; margin-top: 2px;">Em hãy nhấp vào các ô có màu trên lịch để xem lại bài đã nộp nhé!</div>
        </div>
      `;
    } else {
      selectedAttempts.forEach(att => {
        const reviewLink = this.resolveReviewPageUrl(att.pageUrl, att.id, email);
        listHtml += `
          <div class="attempt-item-card" style="background: #FFFFFF; border: 1.5px solid #E8E2D8; border-bottom: 3.5px solid #D3CBC0; border-radius: 14px; padding: 12px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <b style="font-size: 14px; color: #261F1D;">📝 ${att.testTitle}</b>
              <div style="font-size: 12px; font-weight: 700; color: #756D68; margin-top: 2px;">
                ⏱️ Nộp lúc: <b>${att.timestamp}</b> • Làm trong: <b>${att.timeSpent || 'N/A'}</b>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="score-pill" style="background: #16A34A; color: white; padding: 4px 10px; border-radius: 10px; font-weight: 800; font-size: 12px;">Điểm: ${att.score}</span>
              <a href="${reviewLink}" target="_blank" class="btn-review" style="background: #0284C7; color: white; text-decoration: none; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 800;">👁️ Xem bài</a>
            </div>
          </div>
        `;
      });
    }

    listHtml += `</div></div>`;

    container.innerHTML = calHtml + listHtml;
  }

  // BỘ MÁY VẼ LỊCH 5 MÀU (HEATMAP) & BẢNG CHÚ THÍCH (LEGEND)
  generateMonthCalendarHtml(attempts) {
    const year = this.calCurrentYear;
    const month = this.calCurrentMonth;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Thứ 2 là 0

    // Đếm số bài đã nộp theo từng ngày trong tháng
    const dateCountMap = {};
    attempts.forEach(att => {
      const m = att.timestamp?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (m && parseInt(m[2], 10) === (month + 1) && parseInt(m[3], 10) === year) {
        const d = parseInt(m[1], 10);
        dateCountMap[d] = (dateCountMap[d] || 0) + 1;
      }
    });

    const now = new Date();
    const isCurrentMonthNow = now.getFullYear() === year && now.getMonth() === month;
    const todayDateNum = now.getDate();

    let gridHtml = '';
    for (let i = 0; i < adjustedFirstDay; i++) {
      gridHtml += `<div class="cs-cal-cell cs-cal-cell-empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const count = dateCountMap[day] || 0;
      const isToday = isCurrentMonthNow && (day === todayDateNum);
      const isFuture = isCurrentMonthNow && (day > todayDateNum);

      const dStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      const isSelected = this.selectedDateStr === dStr;

      // Phân bổ 5 CẤP ĐỘ MÀU (HEATMAP LEVELS)
      let colorClass = 'cal-color-zero';
      if (isFuture) {
        colorClass = 'cal-color-future';
      } else if (count === 0) {
        colorClass = 'cal-color-zero';
      } else if (count === 1) {
        colorClass = 'cal-color-low';
      } else if (count === 2) {
        colorClass = 'cal-color-mid';
      } else if (count >= 3 && count <= 4) {
        colorClass = 'cal-color-full';
      } else if (count >= 5) {
        colorClass = 'cal-color-over';
      }

      const activeBorder = isSelected ? 'box-shadow: 0 0 0 3px #8B1518, 0 4px 10px rgba(0,0,0,0.2); transform: scale(1.06); z-index: 5;' : '';

      gridHtml += `
        <div class="cs-cal-cell ${colorClass}" style="${activeBorder}" onclick="window.curriculumUI.selectCalendarDate(${day}, ${month}, ${year})">
          <span>${day}</span>
          ${count > 0 ? `<span class="cs-cal-subtext">${count >= 5 ? '🔥 ' : ''}${count} bài</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="cs-calendar-wrapper" style="border: 2px solid #E8E2D8; border-radius: 18px; padding: 18px; background: #FAF7F2;">
        <div class="cs-calendar-nav">
          <b class="cs-calendar-title" style="font-size: 15px; color: #261F1D;">
            <i class="fa-solid fa-fire text-amber-500"></i> LỊCH CHUYÊN CẦN: THÁNG ${month + 1}/${year}
          </b>
          <div style="display:flex; gap:6px;">
            <button type="button" class="cs-cal-btn" onclick="window.curriculumUI.changeCalMonth(-1)">◀ Tháng trước</button>
            <button type="button" class="cs-cal-btn" onclick="window.curriculumUI.changeCalMonth(1)">Tháng sau ▶</button>
          </div>
        </div>

        <div class="cs-calendar-grid">
          <div class="cs-cal-day-name">T2</div>
          <div class="cs-cal-day-name">T3</div>
          <div class="cs-cal-day-name">T4</div>
          <div class="cs-cal-day-name">T5</div>
          <div class="cs-cal-day-name">T6</div>
          <div class="cs-cal-day-name">T7</div>
          <div class="cs-cal-day-name">CN</div>
          ${gridHtml}
        </div>

        <!-- BẢNG CHÚ THÍCH MỨC ĐỘ 5 MÀU (LEGEND) -->
        <div class="cs-legend-bar" style="margin-top: 14px; border-top: 1px solid #E8E2D8; padding-top: 10px;">
          <span style="color: #756D68; font-size: 12px; margin-right: 4px;">Mức độ hoàn thành:</span>
          <div class="cs-legend-item">
            <span class="cs-legend-dot cal-color-zero"></span> <span>0 bài</span>
          </div>
          <div class="cs-legend-item">
            <span class="cs-legend-dot cal-color-low"></span> <span>1 bài</span>
          </div>
          <div class="cs-legend-item">
            <span class="cs-legend-dot cal-color-mid"></span> <span>2 bài</span>
          </div>
          <div class="cs-legend-item">
            <span class="cs-legend-dot cal-color-full"></span> <span>3-4 bài (Chuẩn)</span>
          </div>
          <div class="cs-legend-item">
            <span class="cs-legend-dot cal-color-over"></span> <span>5+ bài (Vượt chỉ tiêu 🔥)</span>
          </div>
        </div>
      </div>
    `;
  }

  // SỰ KIỆN: BẤM VÀO NGÀY TRÊN LỊCH ĐỂ XEM BÀI NỘP
  selectCalendarDate(day, month, year) {
    this.selectedDateStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    this.renderTodayHistoryAndCalendar(this.cachedAttempts, this.cachedEmail);
  }

  // SỰ KIỆN: THU GỌN / MỞ RỘNG DANH SÁCH BÀI LÀM
  toggleListCollapse() {
    this.isListCollapsed = !this.isListCollapsed;
    const body = document.getElementById('csSelectedDateListBody');
    if (body) {
      body.style.display = this.isListCollapsed ? 'none' : 'block';
    }
    const btn = event.target;
    if (btn) btn.innerText = this.isListCollapsed ? 'Mở rộng ▼' : 'Thu gọn ▲';
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
}

export const curriculumUI = new CurriculumUISystem();
window.curriculumUI = curriculumUI;
