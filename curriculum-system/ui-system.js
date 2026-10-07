/**
 * curriculum-system/ui-system.js
 * BỘ ĐIỀU KHIỂN GIAO DIỆN LỘ TRÌNH, FULL TIMELINE & BẢNG ĐỊNH MỨC THỜI GIAN
 */

import { curriculumEngineSystem } from './engine-system.js';
import { MASTER_CURRICULUM_SYSTEM } from './manifest-system.js';

// BẢNG ĐỊNH MỨC THỜI GIAN THEO TỪNG PHÂN HỆ ĐỂ CHÚ THÍCH CHO HỌC SINH
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

  initRoadmap(presetLevel = 'beginner', dailyHours = 1.5, speed = 'normal') {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    let masteredTags = [];

    if (presetLevel === 'intermediate') {
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'VOCAB_U01', 'VOCAB_U02'];
    } else if (presetLevel === 'advanced') {
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'G_PAST_CONT', 'G_IRREG_V3', 'G_PRES_PERF', 'G_PAST_PERF', 'G_CONDITIONALS', 'G_PASSIVE_VOICE', 'G_COMPARISON', 'G_RELATIVE_CLAUSE', 'G_PREP_ADV', 'G_WORD_FORM'];
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

  // =========================================================================
  // ADMIN ĐỔI TỐC ĐỘ HỌC CHO HỌC SINH
  // =========================================================================
  adminChangeSpeedProfile(newSpeed) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    if (!data) return;

    data.speedProfile = newSpeed;
    // Tái cấu trúc lại tổng thời gian và lịch theo tốc độ mới
    const currentCompleted = [...data.completedNodeIds];
    const allRetained = curriculumEngineSystem.pruneCurriculum(data.presetLevel === 'intermediate' ? ['G_NOUNS'] : []);
    data.totals = curriculumEngineSystem.calculateTotals(allRetained, newSpeed);
    const newSchedule = curriculumEngineSystem.generateDailyCalendar(allRetained, newSpeed, data.dailyHours || 1.5);
    data.schedule = newSchedule.dailySchedule;
    data.completedNodeIds = currentCompleted;

    this.saveRoadmap(email, data);
    this.render();
    alert(`👑 Admin đã cập nhật tốc độ học viên thành công: ${newSpeed.toUpperCase()}`);
    this.closeModal();
  }

  // =========================================================================
  // MỞ BẢNG CHÚ THÍCH ĐỊNH MỨC THỜI GIAN
  // =========================================================================
  showBenchmarkExplanationModal() {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);
    const speed = data?.speedProfile || 'normal';
    const info = BENCHMARK_EXPLANATIONS[speed] || BENCHMARK_EXPLANATIONS.normal;
    const isAdmin = (localStorage.getItem('ielts_student_email') || '').toLowerCase().includes('admin');

    const adminControlHtml = isAdmin ? `
      <div style="margin-top:16px; padding:12px; background:#fef3c7; border:1px solid #f59e0b; border-radius:8px;">
        <b style="color:#b45309; font-size:13px;">👑 Dành cho Admin: Đổi tốc độ cho học sinh này</b>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button onclick="window.curriculumUI.adminChangeSpeedProfile('fast')" style="padding:6px 12px; background:#0284c7; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">⚡ Học Nhanh</button>
          <button onclick="window.curriculumUI.adminChangeSpeedProfile('normal')" style="padding:6px 12px; background:#16a34a; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🌱 Bình Thường</button>
          <button onclick="window.curriculumUI.adminChangeSpeedProfile('slow')" style="padding:6px 12px; background:#d97706; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🐢 Học Kỹ/Chậm</button>
        </div>
      </div>
    ` : '';

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
        ${adminControlHtml}
      </div>
    `);
  }

  // =========================================================================
  // MỞ MÀN HÌNH FULL LỘ TRÌNH (TẤT CẢ CÁC NGÀY TỪ 1 ĐẾN HẾT)
  // =========================================================================
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
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; border-bottom:1px dashed #e2e8f0; padding-bottom:6px;">
                        <div>
                          <span style="font-family:monospace; font-weight:bold; font-size:11px; background:#1e293b; color:white; padding:1px 5px; border-radius:3px;">${n.id}</span>
                          <span style="font-weight:700; margin-left:6px; color:${done ? '#16a34a' : '#1e293b'};">${done ? '✓ ' : ''}${n.title}</span>
                        </div>
                        <span style="font-size:11.5px; color:#64748b; white-space:nowrap;">${n.assignedDurationMinutes}p</span>
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

  /**
   * VẼ GIAO DIỆN LÊN KHỐI CHÍNH
   */
  render(targetContainerId = 'roadmapSectionMount') {
    let container = document.getElementById(targetContainerId);
    if (!container) return;

    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);

    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div style="text-align:center; padding:15px 10px;">
            <h3 style="margin:0 0 8px 0; font-size:20px; font-weight:800; color:#0284c7;">🎯 EM CHƯA CÓ LỘ TRÌNH HỌC TẬP CÁ NHÂN HÓA</h3>
            <p style="margin:0 auto 18px auto; max-width:600px; font-size:13.5px; color:#64748b; line-height:1.6;">
              Hệ thống tự động đo tốc độ, gọt bài thừa và xuất ra lịch học chuẩn xác từng ngày:
            </p>
            <div class="cs-setup-buttons">
              <button type="button" class="cs-btn-preset" style="background:#0284c7;" onclick="window.curriculumUI.initRoadmap('beginner')">
                🌱 Mất gốc hoàn toàn (Học từ Đốt 001)
              </button>
              <button type="button" class="cs-btn-preset" style="background:#16a34a;" onclick="window.curriculumUI.initRoadmap('intermediate')">
                ⚡ Đã có nền 4.5 - 5.0 (Gọt bỏ Ngữ pháp căn bản)
              </button>
              <button type="button" class="cs-btn-preset" style="background:#8B1518;" onclick="window.curriculumUI.initRoadmap('advanced')">
                🔥 Bứt phá 6.0+ ➔ 7.5 (Tập trung Cam & Viết Nói)
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // ĐỒNG BỘ CÁC BÀI ĐÃ LÀM TỪ LỊCH SỬ CHUNG
    data.schedule.forEach(day => {
      day.nodes.forEach(node => {
        if (!data.completedNodeIds.includes(node.id) && this.isNodeCompletedInHistory(node)) {
          data.completedNodeIds.push(node.id);
        }
      });
    });

    const completedTotal = data.completedNodeIds.length;
    // TÍNH TOÁN % TIẾN ĐỘ CHẠY THẬT CHUẨN XÁC
    const progressPercent = data.totals.nodeCount > 0 
      ? Math.min(100, Math.round((completedTotal / data.totals.nodeCount) * 100))
      : 0;

    const currentDayPlan = data.schedule.find(s => s.dayNumber === data.currentDay) || data.schedule[0];
    const speedInfo = BENCHMARK_EXPLANATIONS[data.speedProfile] || BENCHMARK_EXPLANATIONS.normal;

    container.innerHTML = `
      <div class="cs-container">
        <!-- Header & Các Nút Hành Động -->
        <div class="cs-header">
          <div class="cs-title-group">
            <span class="cs-badge cs-badge-speed" onclick="window.curriculumUI.showBenchmarkExplanationModal()" title="Nhấp để xem bảng định mức thời gian và đổi tốc độ">
              TỐC ĐỘ: ${speedInfo.label} <i class="fa-solid fa-circle-info"></i>
            </span>
            <h3>📅 NHIỆM VỤ HỌC HÔM NAY (NGÀY ${data.currentDay}/${data.schedule.length})</h3>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <!-- NÚT MỞ TOÀN BỘ LỘ TRÌNH -->
            <button type="button" onclick="window.curriculumUI.showFullRoadmapModal()" style="background:#0f172a; color:white; border:none; padding:6px 14px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-map-location-dot text-sky-400"></i> Xem Toàn Bộ Lộ Trình
            </button>
            <button type="button" onclick="window.curriculumUI.resetRoadmap()" style="background:none; border:1px solid #cbd5e1; padding:5px 10px; border-radius:8px; font-size:12px; color:#64748b; cursor:pointer;">
              🔄 Đặt lại
            </button>
          </div>
        </div>

        <!-- Thống kê khối lượng & Số giờ giáo viên -->
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

        <!-- THANH PROGRESS CHẠY ĐỘNG THEO TIẾN ĐỘ THẬT -->
        <div class="cs-progress-container">
          <div class="cs-progress-header">
            <span>Tiến độ hoàn thành lộ trình</span>
            <span><b>${progressPercent}%</b> (${completedTotal}/${data.totals.nodeCount} bài)</span>
          </div>
          <div class="cs-progress-bar-bg">
            <div class="cs-progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <!-- Danh sách bài tập của ngày hôm nay -->
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
}

export const curriculumUI = new CurriculumUISystem();
window.curriculumUI = curriculumUI;
