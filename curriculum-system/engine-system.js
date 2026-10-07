/**
 * curriculum-system/engine-system.js
 * BỘ MÁY ĐIỀU PHỐI ĐA KỸ NĂNG: TRỘN 2-3 MÔN KHÁC NHAU / NGÀY & GÁN CHÚ THÍCH LỢI ÍCH
 */

export class CurriculumEngineSystem {
  constructor() {
    this.allNodes = [];
  }

  setNodes(nodes) {
    this.allNodes = nodes.map(n => ({
      ...n,
      benefit: n.benefit || this.generateBenefit(n)
    }));
  }

  // TỰ ĐỘNG GÁN CHÚ THÍCH LỢI ÍCH THỰC CHIẾN CHO TỪNG BÀI
  generateBenefit(node) {
    const d = (node.domain || '').toUpperCase();
    const t = (node.title || '').toLowerCase();

    if (d === 'GRAMMAR') {
      if (t.includes('lý thuyết')) return "Nắm vững bản chất công thức, tránh dịch 'word-by-word' từ tiếng Việt.";
      return "Triệt tiêu lỗi sai thì, sai cấu trúc câu đơn/phức khi viết và nói.";
    }
    if (d === 'VOCABULARY') return "Nạp từ vựng học thuật theo ngữ cảnh mạch tư duy (Collocations & Topic Words).";
    if (d === 'PRE_LISTENING') return "Luyện tai bắt âm nối, nuốt âm (-s, -ed), số liệu và tên riêng chuẩn xác.";
    if (d === 'PRE_READING') return "Rèn kỹ thuật Skimming & Scanning định vị từ khóa không cần tra từ điển.";
    if (d === 'PRE_SPEAKING') return "Shadowing nhại giọng bản ngữ, chuẩn hóa ngữ điệu và phản xạ kéo dài câu trả lời.";
    if (d.includes('PRE_WRITING')) return "Chuyển ngữ kịch bản Việt ➔ Anh 3 mốc Band, rèn tư duy dàn ý PEEL.";
    if (d === 'READING') {
      if (t.includes('có mớm')) return "Luyện chiến thuật làm chủ dạng bài (Gap Fill, TFNG) có mớm dẫn dắt.";
      return "Tự lực định vị từ khóa dưới áp lực bấm giờ 15-20p/Passage chuẩn phòng thi.";
    }
    if (d === 'LISTENING') return "Rèn độ nhạy bắt từ khóa chuyển ý (Signposting) và bẫy đổi ý (actually, but).";
    if (d === 'WRITING_T1') return "Tự viết bài mô tả biểu đồ 150 từ hoàn chỉnh trong đúng 20 phút (Overview & Grouping).";
    if (d === 'WRITING_T2') return "Viết bài luận học thuật 250 từ chuẩn 4 đoạn PEEL, nâng cấp từ vựng C1-C2.";
    if (d === 'SPEAKING') return "Phản xạ trả lời trôi chảy theo cấu trúc AREA, không bị khựng quá 3 giây.";
    if (d === 'MOCK_TEST') return "Rèn luyện thể lực và tâm lý phòng thi dưới áp lực làm bài liên tục 3 tiếng.";
    return "Củng cố phản xạ và độ chính xác ngôn ngữ học thuật.";
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
   * THUẬT TOÁN TRỘN 2 - 3 KỸ NĂNG KHÁC NHAU / NGÀY (KHÔNG BAO GIỜ TRÙNG MÔN)
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHoursCommitment = 1.0) {
    const dailyTargetMinutes = Math.round(dailyHoursCommitment * 60); // 60 phút/ngày
    const calendarDays = [];

    // PHÂN LOẠI CÁC NHÁNH BÀI TẬP VÀO CÁC HÀNG ĐỢI
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
      const nWithBenefit = { ...node, benefit: node.benefit || this.generateBenefit(node) };

      if (d === 'GRAMMAR') qGrammar.push(nWithBenefit);
      else if (d === 'VOCABULARY') qVocab.push(nWithBenefit);
      else if (d === 'PRE_LISTENING') qPreLis.push(nWithBenefit);
      else if (d === 'LISTENING') qOffLis.push(nWithBenefit);
      else if (d === 'PRE_READING') qPreRead.push(nWithBenefit);
      else if (d === 'READING') qOffRead.push(nWithBenefit);
      else if (d.includes('PRE_WRITING')) qPreWrite.push(nWithBenefit);
      else if (d.includes('WRITING')) qOffWrite.push(nWithBenefit);
      else if (d === 'PRE_SPEAKING') qPreSpk.push(nWithBenefit);
      else if (d === 'SPEAKING') qOffSpk.push(nWithBenefit);
      else if (d === 'MOCK_TEST') qMock.push(nWithBenefit);
    });

    let currentDayIndex = 1;
    let daysSinceLastReview = 0;
    let reviewCount = 1;
    let reviewTypeToggle = 0;

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

    // HÀM TIỆN ÍCH BỐC 1 BÀI TỪ QUEUE (CHỈ BỐC NẾU CHƯA CÓ KỸ NĂNG ĐÓ TRONG NGÀY)
    const pickUniqueDomainTask = (queue, dayNodes, usedDomains, currentMinutes, maxAllowed) => {
      if (!queue || queue.length === 0) return 0;
      const candidate = queue[0];
      const domainKey = (candidate.domain || '').toUpperCase().replace('PRE_', '').replace('_T1', '').replace('_T2', '');

      // Nếu môn này ĐÃ CÓ trong ngày ➔ Không bốc để chống trùng môn
      if (usedDomains.has(domainKey)) return 0;

      const dur = candidate.duration?.[speedProfile] || candidate.duration?.normal || 20;

      if (currentMinutes + dur <= maxAllowed || dayNodes.length === 0) {
        queue.shift();
        usedDomains.add(domainKey);
        dayNodes.push({
          ...candidate,
          assignedDurationMinutes: dur
        });
        return dur;
      }
      return 0;
    };

    // VÒNG LẶP XẾP LỊCH TỪNG NGÀY
    while (hasPendingTasks() && currentDayIndex <= 600) {
      let dayMinutes = 0;
      const dayNodes = [];
      const usedDomainsThisDay = new Set(); // Bộ nhớ chống trùng môn trong ngày

      // KIỂM TRA ĐIỀU KIỆN ÔN TẬP DUY TRÌ (KHI LISTENING & READING ĐÃ XONG SẠCH)
      const isLisReadDone = (qPreLis.length === 0 && qOffLis.length === 0 && qPreRead.length === 0 && qOffRead.length === 0);

      if (isLisReadDone && (qOffWrite.length > 0 || qOffSpk.length > 0)) {
        daysSinceLastReview++;

        if (daysSinceLastReview >= 3) {
          daysSinceLastReview = 0;
          reviewTypeToggle++;

          if (reviewTypeToggle % 2 === 1) {
            // NGÀY ÔN READING: CHIẾM ÍT NHẤT 60 PHÚT (FULL DAY ĐỂ LÀM 1 ĐỀ 3 PASSAGE)
            const readReview = {
              id: `S4_REV_READ_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4",
              domain: "READING",
              type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Giải Đề Reading Cambridge Cũ (Bấm giờ nghiêm ngặt 60 phút)`,
              benefit: "Giải trọn vẹn 1 đề Reading 3 Passage dưới áp lực 60 phút để giữ phong độ phòng thi.",
              url: "reading/reading.html",
              duration: { fast: 50, normal: 60, slow: 70 },
              coachHours: 0.5,
              tags: ["READ_MAINTENANCE"]
            };
            calendarDays.push({
              dayNumber: currentDayIndex,
              totalMinutes: 60,
              nodes: [{ ...readReview, assignedDurationMinutes: 60 }]
            });
            currentDayIndex++;
            reviewCount++;
            continue;
          } else {
            // NGÀY ÔN LISTENING: CHIẾM ĐÚNG 30 PHÚT
            const lisReview = {
              id: `S4_REV_LIS_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4",
              domain: "LISTENING",
              type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Nghe lại 1 Đề Listening Cambridge Cũ (Bấm giờ 30 phút)`,
              benefit: "Nghe liên tục 40 câu không tạm dừng để duy trì độ nhạy phản xạ âm thanh.",
              url: "listening/listening.html",
              duration: { fast: 25, normal: 30, slow: 35 },
              coachHours: 0.25,
              tags: ["LIS_MAINTENANCE"]
            };
            dayNodes.push({ ...lisReview, assignedDurationMinutes: 30 });
            dayMinutes += 30;
            usedDomainsThisDay.add('LISTENING');
            reviewCount++;
          }
        }
      }

      // =====================================================================
      // 1. MỤC BẮT BUỘC SỐ 1: NGỮ PHÁP (MỖI NGÀY ĐÚNG 1 BÀI LIÊN TỤC ĐẾN KHI HẾT)
      // =====================================================================
      if (qGrammar.length > 0) {
        dayMinutes += pickUniqueDomainTask(qGrammar, dayNodes, usedDomainsThisDay, dayMinutes, 30);
      }

      // =====================================================================
      // 2. MỤC BẮT BUỘC SỐ 2: NHÁNH NGHE (PRE-LIS ➔ XONG THÌ LÊN ĐỀ LISTENING NGAY)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes && !usedDomainsThisDay.has('LISTENING')) {
        if (qPreLis.length > 0) {
          dayMinutes += pickUniqueDomainTask(qPreLis, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 5);
        } else if (qOffLis.length > 0) {
          dayMinutes += pickUniqueDomainTask(qOffLis, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 5);
        }
      }

      // =====================================================================
      // 3. MỤC SỐ 3: TỪ VỰNG HOẶC NHÁNH ĐỌC (PRE-READ ➔ XONG LÊN ĐỀ READING NGAY)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        // Luân phiên ngày chẵn ngày lẻ giữa Từ vựng và Đọc để không bị dồn cục
        if (currentDayIndex % 2 === 1 && qVocab.length > 0 && !usedDomainsThisDay.has('VOCABULARY')) {
          dayMinutes += pickUniqueDomainTask(qVocab, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        } else if (!usedDomainsThisDay.has('READING')) {
          if (qPreRead.length > 0) {
            dayMinutes += pickUniqueDomainTask(qPreRead, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
          } else if (qOffRead.length > 0) {
            dayMinutes += pickUniqueDomainTask(qOffRead, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
          }
        }
      }

      // =====================================================================
      // 4. MỤC BỔ TRỢ: PRE-WRITING (56 BÀI) HOẶC PRE-SPEAKING (SHADOWING)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreWrite.length > 0 && !usedDomainsThisDay.has('WRITING')) {
          dayMinutes += pickUniqueDomainTask(qPreWrite, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        } else if (qPreSpk.length > 0 && !usedDomainsThisDay.has('SPEAKING')) {
          dayMinutes += pickUniqueDomainTask(qPreSpk, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 5. GIAI ĐOẠN VIẾT & NÓI CHÍNH THỨC (KHI PRE TƯƠNG ỨNG ĐÃ XONG SẠCH)
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreWrite.length === 0 && qOffWrite.length > 0 && !usedDomainsThisDay.has('WRITING')) {
          dayMinutes += pickUniqueDomainTask(qOffWrite, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 15);
        } else if (qPreSpk.length === 0 && qOffSpk.length > 0 && !usedDomainsThisDay.has('SPEAKING')) {
          dayMinutes += pickUniqueDomainTask(qOffSpk, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // =====================================================================
      // 6. MOCK TESTS GIAI ĐOẠN CUỐI
      // =====================================================================
      if (dayMinutes < dailyTargetMinutes && qMock.length > 0 && !usedDomainsThisDay.has('MOCK_TEST')) {
        dayMinutes += pickUniqueDomainTask(qMock, dayNodes, usedDomainsThisDay, dayMinutes, 180);
      }

      // NẾU VẪN CÒN DƯ THỜI GIAN TRONG NGÀY MÀ CÁC QUEUE ƯU TIÊN ĐÃ HẾT:
      // Bốc tiếp từ bất kỳ queue nào còn bài (miễn là không trùng môn)
      if (dayMinutes < 45) {
        const remainingQueues = [qVocab, qPreSpk, qPreWrite, qOffWrite, qOffSpk, qOffRead, qOffLis];
        for (const rq of remainingQueues) {
          if (rq.length > 0) {
            const added = pickUniqueDomainTask(rq, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
            dayMinutes += added;
            if (dayMinutes >= 50) break;
          }
        }
      }

      // ĐẨY NGÀY VÀO LỊCH NẾU CÓ BÀI
      if (dayNodes.length > 0) {
        calendarDays.push({
          dayNumber: currentDayIndex,
          totalMinutes: dayMinutes,
          nodes: dayNodes
        });
        currentDayIndex++;
      } else {
        // Thoát an toàn nếu đã hết sạch bài
        break;
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
