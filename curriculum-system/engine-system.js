/**
 * curriculum-system/engine-system.js
 * BỘ NÃO ĐIỀU PHỐI LỘ TRÌNH ĐỘC LẬP & TÍNH TOÁN THỜI LƯỢNG HỌC PHÍ
 * Cung cấp API mở cho AI can thiệp (Pruning, Re-ordering, Injection)
 */

export class CurriculumEngineSystem {
  constructor(allNodes = []) {
    this.allNodes = [...allNodes];
  }

  setNodes(nodes) {
    this.allNodes = [...nodes];
  }

  /**
   * 1. PHÂN LOẠI TỐC ĐỘ HỌC VIÊN QUA BÀI TEST ĐẦU VÀO
   * @param {number} actualSecondsSpent - Thời gian học sinh hoàn thành bài test
   * @param {number} benchmarkSeconds - Thời gian chuẩn
   * @returns {'fast' | 'normal' | 'slow'}
   */
  determineSpeedProfile(actualSecondsSpent, benchmarkSeconds = 1200) {
    const ratio = actualSecondsSpent / (benchmarkSeconds || 1);
    if (ratio <= 0.8) return 'fast';
    if (ratio <= 1.25) return 'normal';
    return 'slow';
  }

  /**
   * 2. THUẬT TOÁN GỌT ĐỐT (PRUNING) CHO AI
   * Cắt bỏ các đốt mà học sinh đã đạt điểm tối đa ở bài test đầu vào
   * @param {Array<string>} masteredTags - Danh sách tag học sinh làm đúng hoàn toàn
   * @returns {Array} Danh sách các đốt giữ lại
   */
  pruneCurriculum(masteredTags = []) {
    if (!masteredTags || masteredTags.length === 0) {
      return this.allNodes;
    }

    return this.allNodes.filter(node => {
      if (!node.tags || node.tags.length === 0) return true;
      // Nếu tất cả tags của bài này nằm trong danh sách đã giỏi -> CẮT BỎ
      const isMastered = node.tags.every(tag => masteredTags.includes(tag));
      return !isMastered;
    });
  }

  /**
   * 3. TÍNH TOÁN TỔNG KHỐI LƯỢNG CÔNG VIỆC & GIỜ HỌC GIÁO VIÊN (THU HỌC PHÍ)
   * @param {Array} retainedNodes - Danh sách đốt sau khi gọt
   * @param {'fast' | 'normal' | 'slow'} speedProfile - Tốc độ học
   */
  calculateTotals(retainedNodes, speedProfile = 'normal') {
    let totalMinutes = 0;
    let totalCoachHours = 0;

    retainedNodes.forEach(node => {
      const dur = node.duration[speedProfile] || node.duration.normal || 20;
      totalMinutes += dur;
      totalCoachHours += (node.coachHours || 0);
    });

    return {
      totalSelfStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalCoachHours: Math.round(totalCoachHours * 10) / 10,
      coachSessionsEstimate: Math.ceil(totalCoachHours / 2), // Giả sử mỗi buổi học 2 tiếng
      nodeCount: retainedNodes.length
    };
  }

  /**
   * 4. BỘ MÁY TỰ ĐỘNG SINH LỊCH HỌC TỪNG NGÀY (DAILY CALENDAR GENERATOR)
   * @param {Array} retainedNodes - Các đốt cần học
   * @param {'fast' | 'normal' | 'slow'} speedProfile - Tốc độ học
   * @param {number} dailyHoursCommitment - Số giờ học sinh cam kết học mỗi ngày (VD: 1.5 tiếng)
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHoursCommitment = 1.5) {
    const dailyTargetMinutes = dailyHoursCommitment * 60;
    const calendarDays = [];

    let currentDayIndex = 1;
    let currentDayNodes = [];
    let currentDayMinutes = 0;

    retainedNodes.forEach(node => {
      const nodeMinutes = node.duration[speedProfile] || node.duration.normal || 20;

      // Nếu cộng thêm bài này mà vượt quá chỉ tiêu trong ngày và ngày đó đã có ít nhất 1 bài
      if (currentDayMinutes + nodeMinutes > dailyTargetMinutes && currentDayNodes.length > 0) {
        calendarDays.push({
          dayNumber: currentDayIndex,
          totalMinutes: currentDayMinutes,
          nodes: currentDayNodes
        });

        currentDayIndex++;
        currentDayNodes = [];
        currentDayMinutes = 0;
      }

      currentDayNodes.push({
        ...node,
        assignedDurationMinutes: nodeMinutes
      });
      currentDayMinutes += nodeMinutes;
    });

    if (currentDayNodes.length > 0) {
      calendarDays.push({
        dayNumber: currentDayIndex,
        totalMinutes: currentDayMinutes,
        nodes: currentDayNodes
      });
    }

    const totalDays = calendarDays.length;
    const estimatedMonths = Math.round((totalDays / 30) * 10) / 10;

    return {
      totalDays,
      estimatedMonths,
      dailySchedule: calendarDays
    };
  }

  // =========================================================================
  // 5. CỔNG KẾT NỐI CHO CON AI CAN THIỆP TRONG TƯƠNG LAI (AI INTERVENTION HOOKS)
  // =========================================================================

  /**
   * AI CHÈN ĐỐT BỔ TRỢ VÀO GIỮA LỘ TRÌNH KHI HỌC SINH LÀM SAI NHIỀU
   * @param {Array} currentSchedule - Lịch học hiện tại
   * @param {string} targetNodeId - Mã bài vừa làm sai
   * @param {Array} remedialNodes - Danh sách bài bổ trợ AI tạo ra
   */
  aiInjectRemedialNodes(currentSchedule, targetNodeId, remedialNodes = []) {
    return currentSchedule.map(day => {
      const targetIndex = day.nodes.findIndex(n => n.id === targetNodeId);
      if (targetIndex !== -1) {
        const updatedNodes = [...day.nodes];
        updatedNodes.splice(targetIndex + 1, 0, ...remedialNodes);
        return { ...day, nodes: updatedNodes };
      }
      return day;
    });
  }

  /**
   * AI ĐIỀU CHỈNH LẠI THỨ TỰ ƯU TIÊN THEO KẾT QUẢ ĐẦU VÀO
   * @param {Array} nodes - Danh sách đốt
   * @param {Array<string>} weakTags - Những kỹ năng học sinh yếu nhất cần ưu tiên kéo lên trước
   */
  aiPrioritizeWeaknesses(nodes, weakTags = []) {
    if (!weakTags.length) return nodes;
    return [...nodes].sort((a, b) => {
      const aHasWeak = (a.tags || []).some(t => weakTags.includes(t));
      const bHasWeak = (b.tags || []).some(t => weakTags.includes(t));
      if (aHasWeak && !bHasWeak) return -1;
      if (!aHasWeak && bHasWeak) return 1;
      return 0;
    });
  }
}

export const curriculumEngineSystem = new CurriculumEngineSystem();
