/**
 * curriculum-system/engine-system.js
 * BỘ MÁY ĐIỀU PHỐI ĐA KỸ NĂNG (MULTI-BUCKET INTERLEAVING SCHEDULER)
 * Tự động phân tầng Tiền đề nghiêm ngặt & Trộn 2-3 kỹ năng mỗi ngày (Chuẩn 60p/ngày)
 */

export class CurriculumEngineSystem {
  constructor() {
    this.allNodes = [];
  }

  setNodes(nodes) {
    this.allNodes = [...nodes];
  }

  /**
   * 1. GỌT ĐỐT (PRUNING) DỰA TRÊN TAGS NĂNG LỰC
   */
  pruneCurriculum(masteredTags = []) {
    if (!masteredTags || masteredTags.length === 0) return [...this.allNodes];
    return this.allNodes.filter(node => {
      if (!node.tags || node.tags.length === 0) return true;
      const isMastered = node.tags.every(tag => masteredTags.includes(tag));
      return !isMastered;
    });
  }

  /**
   * 2. TÍNH TOÁN TỔNG THỜI LƯỢNG TỰ CÀY & GIỜ GIÁO VIÊN
   */
  calculateTotals(retainedNodes, speedProfile = 'normal') {
    let totalMinutes = 0;
    let totalCoachHours = 0;

    retainedNodes.forEach(node => {
      const dur = node.duration?.[speedProfile] || node.duration?.normal || 20;
      totalMinutes += dur;
      totalCoachHours += (node.coachHours || 0);
    });

    const totalSelfStudyHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalCoachHoursRounded = Math.round(totalCoachHours * 10) / 10;
    const coachSessionsEstimate = Math.ceil(totalCoachHoursRounded / 2.0);

    return {
      totalSelfStudyHours,
      totalCoachHours: totalCoachHoursRounded,
      coachSessionsEstimate,
      nodeCount: retainedNodes.length
    };
  }

  /**
   * 3. BỘ MÁY TRỘN ĐA KỸ NĂNG THEO CHUẨN GIÁO TRÌNH 7 THÁNG TRẠM IELTS
   * Phân 4 Tầng Tiền đề (Tiers). Trong mỗi Tầng, bốc xen kẽ Output + Input + Support vào mỗi ngày
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHoursCommitment = 1.0) {
    const dailyTargetMinutes = Math.round(dailyHoursCommitment * 60);
    const calendarDays = [];

    // PHÂN CHIA 4 TẦNG TIỀN ĐỀ TUYỆT ĐỐI (STRICT PREREQUISITE TIERS)
    const tiers = {
      T1: [], // Tầng 1: Gốc (Grammar, Vocab 300, Pre-Lis A1, Pre-Read A1, Shadow A1)
      T2: [], // Tầng 2: Chuyển giao (Cam có mớm, Pre-Writing T1/T2, Shadow A2/B1, Pre-skills B2)
      T3: [], // Tầng 3: Sản sinh (Writing T1/T2 chính thức, Speaking P1/P2, Cam nâng cao)
      T4: []  // Tầng 4: Về đích (Cam không mớm, Writing chuyên sâu, Speaking P3, 12 Mock Tests)
    };

    retainedNodes.forEach(node => {
      const stage = node.stage || 'S1';
      if (stage === 'S1') tiers.T1.push(node);
      else if (stage === 'S2') tiers.T2.push(node);
      else if (stage === 'S3') tiers.T3.push(node);
      else tiers.T4.push(node);
    });

    let currentDayIndex = 1;

    // HÀM ĐÓNG GÓI NGÀY XEN KẼ (MULTI-BUCKET ROUND-ROBIN) CHO TỪNG TẦNG
    const processTier = (tierNodes) => {
      if (!tierNodes || tierNodes.length === 0) return;

      // Phân vào 3 Xô chức năng để đan xen:
      // Xô 1: Tiếp nhận Input (Listening, Reading, Pre-Listening, Pre-Reading)
      // Xô 2: Sản sinh Output (Writing, Speaking, Pre-Writing, Ngữ pháp tạo câu)
      // Xô 3: Bổ trợ Support (Từ vựng, Shadowing phát âm, Note lỗi)
      const inputBucket = [];
      const outputBucket = [];
      const supportBucket = [];

      tierNodes.forEach(n => {
        const d = (n.domain || '').toUpperCase();
        if (d.includes('READ') || d.includes('LIS')) {
          inputBucket.push(n);
        } else if (d.includes('WRIT') || d.includes('SPEAK') || d.includes('GRAM')) {
          outputBucket.push(n);
        } else {
          supportBucket.push(n);
        }
      });

      // Lần lượt bốc đan xen 3 xô cho từng ngày đến khi hết sạch bài của Tầng này
      while (inputBucket.length > 0 || outputBucket.length > 0 || supportBucket.length > 0) {
        let dayMinutes = 0;
        const dayNodes = [];

        const tryPick = (bucket) => {
          if (bucket.length === 0) return;
          const node = bucket[0];
          const nodeDur = node.duration?.[speedProfile] || node.duration?.normal || 20;

          // Nếu cộng vào mà không vượt quá thời gian chỉ tiêu ngày
          if (dayMinutes + nodeDur <= dailyTargetMinutes + 10 || dayNodes.length === 0) {
            bucket.shift();
            dayNodes.push({
              ...node,
              assignedDurationMinutes: nodeDur
            });
            dayMinutes += nodeDur;
          }
        };

        // Bốc Vòng 1: 1 bài Output (Ngữ pháp / Viết / Nói ~20p)
        tryPick(outputBucket);

        // Bốc Vòng 2: 1 bài Input (Nghe / Đọc hiểu ~20p)
        tryPick(inputBucket);

        // Bốc Vòng 3: 1 bài Bổ trợ (Từ vựng / Shadowing ~20p)
        tryPick(supportBucket);

        // Nếu còn dư thì bốc nốt từ xô còn bài để làm đầy mốc 60p
        let safety = 0;
        while (dayMinutes < dailyTargetMinutes - 10 && safety < 4) {
          safety++;
          const prevMin = dayMinutes;
          if (outputBucket.length > 0) tryPick(outputBucket);
          else if (inputBucket.length > 0) tryPick(inputBucket);
          else if (supportBucket.length > 0) tryPick(supportBucket);
          if (dayMinutes === prevMin) break;
        }

        if (dayNodes.length > 0) {
          calendarDays.push({
            dayNumber: currentDayIndex,
            totalMinutes: dayMinutes,
            nodes: dayNodes
          });
          currentDayIndex++;
        } else {
          // Xử lý bài thi lớn ngoại lệ (ví dụ Mock Test 120-150 phút)
          const fallbackBucket = outputBucket.length > 0 ? outputBucket : (inputBucket.length > 0 ? inputBucket : supportBucket);
          if (fallbackBucket.length > 0) {
            const bigNode = fallbackBucket.shift();
            const bigDur = bigNode.duration?.[speedProfile] || bigNode.duration?.normal || 60;
            calendarDays.push({
              dayNumber: currentDayIndex,
              totalMinutes: bigDur,
              nodes: [{ ...bigNode, assignedDurationMinutes: bigDur }]
            });
            currentDayIndex++;
          }
        }
      }
    };

    // TUÂN THỦ NGUYÊN TẮC: TẦNG 1 XONG HẾT ➔ MỚI SANG TẦNG 2 ➔ TẦNG 3 ➔ TẦNG 4
    processTier(tiers.T1);
    processTier(tiers.T2);
    processTier(tiers.T3);
    processTier(tiers.T4);

    return {
      totalDays: calendarDays.length,
      estimatedMonths: Math.round((calendarDays.length / 26) * 10) / 10,
      dailySchedule: calendarDays
    };
  }
}

export const curriculumEngineSystem = new CurriculumEngineSystem();
