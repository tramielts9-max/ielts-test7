/**
 * curriculum-system/ui-system.js
 * BỘ ĐIỀU KHIỂN GIAO DIỆN LỘ TRÌNH & DAILY TASK CHECKLIST
 * Kết nối tự động với curriculumEngineSystem và MASTER_CURRICULUM_SYSTEM
 */

import { curriculumEngineSystem } from './engine-system.js';
import { MASTER_CURRICULUM_SYSTEM } from './manifest-system.js';

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

  /**
   * TỰ ĐỘNG DÒ TÌM TRONG ielts_local_history XEM ĐỐT ĐÓ ĐÃ ĐƯỢC LÀM CHƯA
   */
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

  /**
   * KHỞI TẠO LỘ TRÌNH CÁ NHÂN HÓA (DÀNH CHO HỌC SINH HOẶC TEST ĐẦU VÀO)
   * @param {'beginner' | 'intermediate' | 'advanced'} presetLevel
   * @param {number} dailyHours
   */
  initRoadmap(presetLevel = 'beginner', dailyHours = 1.5) {
    const email = localStorage.getItem('ielts_student_email') || 'guest';
    let masteredTags = [];
    let speed = 'normal';

    if (presetLevel === 'intermediate') {
      // Đã vững ngữ pháp nền -> Gọt bỏ đốt Giai đoạn 1
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'VOCAB_U01', 'VOCAB_U02'];
      speed = 'fast';
    } else if (presetLevel === 'advanced') {
      // Đã đạt 5.5 - 6.0 -> Gọt bỏ toàn bộ Giai đoạn 1 & 2
      masteredTags = ['G_NOUNS', 'G_PRES_SIMPLE', 'G_PRES_CONT', 'G_PAST_SIMPLE', 'G_FUTURE_SIMPLE', 'G_ARTICLES', 'G_PREP_BASIC', 'G_PAST_CONT', 'G_IRREG_V3', 'G_PRES_PERF', 'G_PAST_PERF', 'G_CONDITIONALS', 'G_PASSIVE_VOICE', 'G_COMPARISON', 'G_RELATIVE_CLAUSE', 'G_PREP_ADV', 'G_WORD_FORM'];
      speed = 'fast';
    }

    const retainedNodes = curriculumEngineSystem.pruneCurriculum(masteredTags);
    const totals = curriculumEngineSystem.calculateTotals(retainedNodes, speed);
    const scheduleData = curriculumEngineSystem.generateDailyCalendar(retainedNodes, speed, dailyHours);

    const payload = {
      createdAt: new Date().toISOString(),
      studentEmail: email,
      presetLevel,
      speedProfile: speed,
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

    // Kiểm tra xem đã hoàn thành toàn bộ bài của ngày hôm nay chưa
    const currentDayPlan = data.schedule.find(s => s.dayNumber === data.currentDay);
    if (currentDayPlan) {
      const allDone = currentDayPlan.nodes.every(n => data.completedNodeIds.includes(n.id) || this.isNodeCompletedInHistory(n));
      if (allDone && data.currentDay < data.schedule.length) {
        data.currentDay += 1;
        alert("🎉 Xuất sắc! Em đã hoàn thành đủ bài tập của hôm nay. Ngày tiếp theo đã được mở khóa!");
      }
    }

    this.saveRoadmap(email, data);
    this.render();
  }

  /**
   * HIỂN THỊ TOÀN BỘ GIAO DIỆN LỘ TRÌNH LÊN CONTAINER CHỈ ĐỊNH
   */
  render(targetContainerId = 'roadmapSectionMount') {
    let container = document.getElementById(targetContainerId);
    if (!container) {
      // Nếu chưa có thẻ mount, tự động tìm và chèn vào trên bảng lịch sử làm bài
      const historySec = document.querySelector('.history-section');
      if (historySec) {
        container = document.createElement('div');
        container.id = targetContainerId;
        historySec.parentNode.insertBefore(container, historySec);
      } else {
        return;
      }
    }

    const email = localStorage.getItem('ielts_student_email') || 'guest';
    const data = this.getSavedRoadmap(email);

    // TRƯỜNG HỢP 1: CHƯA CÓ LỘ TRÌNH (HIỆN NÚT CHỌN XUẤT PHÁT ĐIỂM)
    if (!data) {
      container.innerHTML = `
        <div class="cs-container">
          <div class="cs-setup-box">
            <div class="cs-setup-title">🎯 THIẾT LẬP LỘ TRÌNH CÁ NHÂN HÓA (0 ➔ 7.5+)</div>
            <p class="cs-setup-desc">
              Hệ thống tự động phân loại khối lượng bài tập, gọt bỏ bài thừa và tính toán số giờ tự học cùng số giờ giáo viên hướng dẫn theo năng lực thực tế của em:
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
    const progressPercent = Math.min(100, Math.round((completedTotal / data.totals.nodeCount) * 100));
    const currentDayPlan = data.schedule.find(s => s.dayNumber === data.currentDay) || data.schedule[0];

    // TRƯỜNG HỢP 2: ĐÃ CÓ LỘ TRÌNH (HIỆN TIẾN ĐỘ & CHECKLIST HÔM NAY)
    container.innerHTML = `
      <div class="cs-container">
        <!-- Header -->
        <div class="cs-header">
          <div class="cs-title-group">
            <span class="cs-badge cs-badge-speed">TỐC ĐỘ: ${data.speedProfile}</span>
            <h3>📅 NHIỆM VỤ HỌC HÔM NAY (NGÀY ${data.currentDay}/${data.schedule.length})</h3>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" onclick="window.curriculumUI.resetRoadmap()" style="background:none; border:1px solid #cbd5e1; padding:4px 10px; border-radius:6px; font-size:12px; color:#64748b; cursor:pointer;">
              🔄 Thiết lập lại
            </button>
          </div>
        </div>

        <!-- Thống kê khối lượng & Gói giờ giáo viên -->
        <div class="cs-stats-grid">
          <div class="cs-stat-box">
            <div class="cs-stat-val">${completedTotal}/${data.totals.nodeCount}</div>
            <div class="cs-stat-lbl">Đốt đã xong (${progressPercent}%)</div>
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
            <div class="cs-stat-val" style="color:#d97706;">~${data.schedule.length} ngày</div>
            <div class="cs-stat-lbl">Thời gian về đích</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="cs-progress-bar-bg">
          <div class="cs-progress-bar-fill" style="width: ${progressPercent}%;"></div>
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
