/**
 * curriculum-system/engine-system.js
 * BỘ MÁY ĐIỀU PHỐI ĐA KỸ NĂNG & VÒNG LẶP DUY TRÌ (PIPELINE & MAINTENANCE SCHEDULER)
 * - Ngữ pháp cày liên tục từ Ngày 1 đến khi hết sạch.
 * - Xong Pre của kỹ năng nào ➔ Chuyển sang đề chính thức kỹ năng đó ngay lập tức.
 * - Listening/Reading xong trước ➔ Dồn lực Writing/Speaking.
 * - Cứ 2-3 ngày chèn slot ôn lại: Listening 30p hoặc Reading 60p.
 */

export class CurriculumEngineSystem {
  constructor() {
    this.allNodes = [];
  }

  setNodes(nodes) {
    this.allNodes = [...nodes];
  }

  pruneCurriculum(masteredTags = []) {
    if (!masteredTags || masteredTags.length === 0) return [...this.allNodes];
    return this.allNodes.filter(node => {
      if (!node.tags || node.tags.length === 0) return true;
      const isMastered = node.tags.every(tag => masteredTags.includes(tag));
      return !isMastered;
    });
  }

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
   * BỘ MÁY XẾP LỊCH THEO TIẾN TRÌNH PIPELINE ĐỘC LẬP & VÒNG LẶP DUY TRÌ
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHoursCommitment = 1.0) {
    const dailyTargetMinutes = Math.round(dailyHoursCommitment * 60); // 60 phút/ngày
    const calendarDays = [];

    // 1. TÁCH CÁC NHÁNH BÀI TẬP VÀO CÁC HÀNG ĐỢI (QUEUES) ĐỘC LẬP
    const qGrammar = [];
    const qVocab = [];
    const qPreLis = [];
    const qOffLis = [];
    const qPreRead = [];
    const qOffRead = [];
    const qPreWrite = [];
    const qOffWrite = [];
    const qPreSpk = [];
    const qOffSpk = [];
    const qMock = [];

    retainedNodes.forEach(node => {
      const d = (node.domain || '').toUpperCase();
      if (d === 'GRAMMAR') qGrammar.push(node);
      else if (d === 'VOCABULARY') qVocab.push(node);
      else if (d === 'PRE_LISTENING') qPreLis.push(node);
      else if (d === 'LISTENING') qOffLis.push(node);
      else if (d === 'PRE_READING') qPreRead.push(node);
      else if (d === 'READING') qOffRead.push(node);
      else if (d.includes('PRE_WRITING')) qPreWrite.push(node);
      else if (d.includes('WRITING')) qOffWrite.push(node);
      else if (d === 'PRE_SPEAKING') qPreSpk.push(node);
      else if (d === 'SPEAKING') qOffSpk.push(node);
      else if (d === 'MOCK_TEST') qMock.push(node);
    });

    let currentDayIndex = 1;
    let daysSinceLastReview = 0;
    let reviewFlip = 0; // Luân phiên giữa Reading và Listening review
    let reviewCount = 1;

    // HÀM TIỆN ÍCH BỐC BÀI TỪ QUEUE
    const pickFromQueue = (queue, dayNodes, currentMinutes, maxAllowed) => {
      if (!queue || queue.length === 0) return 0;
      const node = queue[0];
      const dur = node.duration?.[speedProfile] || node.duration?.normal || 20;

      if (currentMinutes + dur <= maxAllowed || dayNodes.length === 0) {
        queue.shift();
        dayNodes.push({
          ...node,
          assignedDurationMinutes: dur
        });
        return dur;
      }
      return 0;
    };

    // KIỂM TRA XEM CÒN BÀI NÀO CẦN HỌC KHÔNG
    const hasPendingTasks = () => {
      return (
        qGrammar.length > 0 || qVocab.length > 0 ||
        qPreLis.length > 0 || qOffLis.length > 0 ||
        qPreRead.length > 0 || qOffRead.length > 0 ||
        qPreWrite.length > 0 || qOffWrite.length > 0 ||
        qPreSpk.length > 0 || qOffSpk.length > 0 ||
        qMock.length > 0
      );
    };

    // VÒNG LẶP XẾP LỊCH TỪNG NGÀY ĐẾN KHI HẾT BÀI
    while (hasPendingTasks() && currentDayIndex <= 600) {
      let dayMinutes = 0;
      const dayNodes = [];

      // KIỂM TRA TRẠNG THÁI: LISTENING VÀ READING CHÍNH THỨC ĐÃ HOÀN THÀNH CHƯA?
      const isLisReadFinished = (qPreLis.length === 0 && qOffLis.length === 0 && qPreRead.length === 0 && qOffRead.length === 0);

      // NẾU ĐÃ XONG LISTENING & READING ➔ KÍCH HOẠT VÒNG LẶP ÔN TẬP DUY TRÌ (CỨ 2-3 NGÀY)
      if (isLisReadFinished && (qOffWrite.length > 0 || qOffSpk.length > 0)) {
        daysSinceLastReview++;

        if (daysSinceLastReview >= 3) {
          daysSinceLastReview = 0;
          reviewFlip++;

          if (reviewFlip % 2 === 1) {
            // NGÀY ÔN READING: CHIẾM ÍT NHẤT 60 PHÚT (FULL DAY)
            const readReviewNode = {
              id: `S4_REV_READ_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4",
              domain: "READING",
              type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Giải 1 Đề Cambridge Reading Cũ (Bấm giờ nghiêm ngặt 60 phút)`,
              url: "reading/reading.html",
              duration: { fast: 50, normal: 60, slow: 70 },
              coachHours: 0.5,
              tags: ["READ_MAINTENANCE"]
            };
            calendarDays.push({
              dayNumber: currentDayIndex,
              totalMinutes: 60,
              nodes: [{ ...readReviewNode, assignedDurationMinutes: 60 }]
            });
            currentDayIndex++;
            reviewCount++;
            continue; // Kết thúc ngày ôn Reading 60p
          } else {
            // NGÀY ÔN LISTENING: CHIẾM ĐÚNG 30 PHÚT
            const lisReviewNode = {
              id: `S4_REV_LIS_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4",
              domain: "LISTENING",
              type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Nghe lại 1 Đề Cambridge Listening Cũ (Bấm giờ 30 phút)`,
              url: "listening/listening.html",
              duration: { fast: 25, normal: 30, slow: 35 },
              coachHours: 0.25,
              tags: ["LIS_MAINTENANCE"]
            };
            dayNodes.push({ ...lisReviewNode, assignedDurationMinutes: 30 });
            dayMinutes += 30;
            reviewCount++;
          }
        }
      }

      // =====================================================================
      // 1. SLOT ƯU TIÊN SỐ 1: NGỮ PHÁP (CHẠY LIÊN TỤC 1 ĐẾN 2 SLOT ĐẾN KHI HẾT)
      // =====================================================================
      if (qGrammar.length > 0) {
        dayMinutes += pickFromQueue(qGrammar, dayNodes, dayMinutes, 30);
        // Nếu còn thời gian và kho ngữ pháp còn nhiều, cho thêm 1 bài thực hành ngữ pháp
        if (qGrammar.length > 0 && dayMinutes < 30) {
          dayMinutes += pickFromQueue(qGrammar, dayNodes, dayMinutes, 45);
        }
      }

      // =====================================================================
      // 2. SLOT ƯU TIÊN SỐ 2: NHÁNH LISTENING (PRE ➔ XONG LÀ LÊN CHÍNH THỨC NGAY)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreLis.length > 0) {
          dayMinutes += pickFromQueue(qPreLis, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        } else if (qOffLis.length > 0) {
          // Pre-Listening xong rồi ➔ Học Listening Cambridge chính thức ngay!
          dayMinutes += pickFromQueue(qOffLis, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 3. SLOT ƯU TIÊN SỐ 3: TỪ VỰNG HOẶC NHÁNH READING (PRE ➔ CHÍNH THỨC)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        if (qVocab.length > 0 && (currentDayIndex % 2 === 1 || qPreRead.length === 0)) {
          dayMinutes += pickFromQueue(qVocab, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        } else if (qPreRead.length > 0) {
          dayMinutes += pickFromQueue(qPreRead, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        } else if (qOffRead.length > 0) {
          // Pre-Reading xong rồi ➔ Học Reading Cambridge chính thức ngay!
          dayMinutes += pickFromQueue(qOffRead, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 4. SLOT TIẾP THEO: PRE-WRITING (56 BÀI) & PRE-SPEAKING (SHADOWING)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreWrite.length > 0) {
          dayMinutes += pickFromQueue(qPreWrite, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        } else if (qPreSpk.length > 0) {
          dayMinutes += pickFromQueue(qPreSpk, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 5. GIAI ĐOẠN SẢN SINH: WRITING & SPEAKING CHÍNH THỨC (KHI PRE ĐÃ XONG)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        // Chỉ vào Writing chính thức khi 56 bài Pre-Writing đã sạch
        if (qPreWrite.length === 0 && qOffWrite.length > 0) {
          dayMinutes += pickFromQueue(qOffWrite, dayNodes, dayMinutes, dailyTargetMinutes + 15);
        }
        // Chỉ vào Speaking chính thức khi Pre-Speaking đã sạch
        else if (qPreSpk.length === 0 && qOffSpk.length > 0) {
          dayMinutes += pickFromQueue(qOffSpk, dayNodes, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 6. GIAI ĐOẠN CUỐI CÙNG: FULL MOCK TESTS
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes && qMock.length > 0) {
        dayMinutes += pickFromQueue(qMock, dayNodes, dayMinutes, 180);
      }

      // ĐẨY NGÀY VÀO LỊCH HỌC NẾU CÓ BÀI
      if (dayNodes.length > 0) {
        calendarDays.push({
          dayNumber: currentDayIndex,
          totalMinutes: dayMinutes,
          nodes: dayNodes
        });
        currentDayIndex++;
      } else {
        // Dự phòng chống treo vòng lặp nếu còn bài lẻ quá lớn
        const fallbackQueues = [qOffWrite, qOffRead, qOffLis, qOffSpk, qMock];
        let found = false;
        for (const q of fallbackQueues) {
          if (q.length > 0) {
            const bigNode = q.shift();
            const bigDur = bigNode.duration?.[speedProfile] || bigNode.duration?.normal || 60;
            calendarDays.push({
              dayNumber: currentDayIndex,
              totalMinutes: bigDur,
              nodes: [{ ...bigNode, assignedDurationMinutes: bigDur }]
            });
            currentDayIndex++;
            found = true;
            break;
          }
        }
        if (!found) break;
      }
    }

    return {
      totalDays: calendarDays.length,
      estimatedMonths: Math.round((calendarDays.length / 26) * 10) / 10,
      dailySchedule: calendarDays
    };
  }
}

export const curriculumEngineSystem = new CurriculumEngineSystem();
