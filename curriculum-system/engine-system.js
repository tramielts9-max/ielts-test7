/**
 * curriculum-system/engine-system.js
 * BỘ MÁY ĐIỀU PHỐI MA TRẬN 2 ĐẦU (START BAND ➔ TARGET BAND),
 * CHUẨN 1.5H/NGÀY & TỰ ĐỘNG TÍNH BUỔI HỌC (3 BUỔI/TUẦN × 2H)
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
    if (d === 'WRITING_T2') return "Viết bài luận học thuật 250 từ chuẩn 4 đoạn PEEL, nâng cấp từ vựng C1 chuẩn xác.";
    if (d === 'SPEAKING') return "Phản xạ trả lời trôi chảy theo cấu trúc AREA, không bị khựng quá 3 giây.";
    if (d === 'MOCK_TEST') return "Rèn luyện thể lực và tâm lý phòng thi dưới áp lực làm bài liên tục 3 tiếng.";
    return "Củng cố phản xạ và độ chính xác ngôn ngữ học thuật.";
  }

  /**
   * MA TRẬN CẮT 2 ĐẦU DỰA VÀO START BAND & TARGET BAND
   */
  pruneCurriculumByBands(startBand = 0.0, targetBand = 7.0, weakTags = []) {
    const sBand = parseFloat(startBand) || 0.0;
    const tBand = Math.min(7.0, parseFloat(targetBand) || 7.0); // Trần cao nhất là 7.0

    return this.allNodes.filter((node, idx) => {
      // Nếu bài này chữa đúng lỗ hổng học sinh khai báo ➔ Giữ lại 100%
      if (weakTags.length > 0 && node.tags && node.tags.some(tag => weakTags.includes(tag))) {
        return true;
      }

      const stg = node.stage || 'S1';
      const d = (node.domain || '').toUpperCase();

      // 1. CẮT ĐẦU (HEAD-CUT) THEO START BAND
      if (sBand >= 2.0 && stg === 'S1' && (d === 'GRAMMAR' && idx % 3 === 0)) return false; // Cắt bớt bài vỡ lòng quá dễ
      if (sBand >= 3.5 && stg === 'S1') return false; // 3.5 trở lên: Cắt 100% Giai đoạn 1
      if (sBand >= 4.5 && stg === 'S2' && d === 'GRAMMAR') return false; // 4.5 trở lên: Bỏ ngữ pháp câu phức
      if (sBand >= 5.0 && stg === 'S2' && !d.includes('PRE_WRITING')) return false; // 5.0 trở lên: Bỏ hết S2 trừ Pre-Writing
      if (sBand >= 5.5 && stg === 'S2') return false; // 5.5 trở lên: Cắt sạch 100% Giai đoạn 2
      if (sBand >= 6.0 && stg === 'S3' && (t.includes('có mớm') || d.includes('PRE_'))) return false; // 6.0 trở lên: Bỏ bài có mớm

      // 2. CẮT ĐUÔI (TAIL-CUT) THEO TARGET BAND
      if (tBand <= 5.0 && (stg === 'S3' || stg === 'S4')) return false; // Chỉ cần 5.0: Cắt sạch S3 & S4
      if (tBand <= 5.5 && stg === 'S4') return false; // Chỉ cần 5.5: Cắt sạch S4
      if (tBand <= 5.5 && stg === 'S3' && (d === 'WRITING_T2' || d === 'MOCK_TEST')) return false;
      if (tBand <= 6.0 && stg === 'S4') return false; // Chỉ cần 6.0: Cắt sạch S4
      if (tBand <= 6.5 && stg === 'S4' && (idx % 2 === 0)) return false; // 6.5: Lọc mỏng 50% đề khó của S4

      // 3. LỌC MỎNG TRÙNG DẠNG (THINNING 20%) ĐỂ TRÁNH QUÁ TẢI
      if ((d === 'WRITING_T1' || d === 'WRITING_T2') && idx % 5 === 0) return false;

      return true;
    });
  }

  /**
   * TÍNH TOÁN THỜI LƯỢNG & SỐ BUỔI HỌC VỚI GIÁO VIÊN (1 TUẦN 3 BUỔI × 2H)
   */
  calculateTotals(retainedNodes, speedProfile = 'normal', dailyHours = 1.5) {
    let totalMinutes = 0;

    retainedNodes.forEach(node => {
      const dur = node.duration?.[speedProfile] || node.duration?.normal || 20;
      totalMinutes += dur;
    });

    const totalSelfStudyHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalDays = Math.max(1, Math.ceil(totalMinutes / (dailyHours * 60))); // Chia cho 1.5h/ngày (90p)
    const estimatedMonths = Math.round((totalDays / 26) * 10) / 10; // 26 ngày học thực tế/tháng
    const totalWeeks = Math.round(estimatedMonths * 4); // 1 tháng = 4 tuần
    const totalLiveSessions = totalWeeks * 3; // 1 tuần = 3 buổi
    const totalTeacherHours = totalLiveSessions * 2; // 1 buổi = 2 tiếng

    return {
      totalSelfStudyHours,
      totalDays,
      estimatedMonths,
      totalWeeks,
      totalLiveSessions,
      totalTeacherHours,
      nodeCount: retainedNodes.length
    };
  }

  /**
   * XẾP LỊCH HỌC BTVN: 1.5 TIẾNG (90 PHÚT) / NGÀY, TRỘN 2-3 KỸ NĂNG, KHÔNG LẶP MÔN
   */
  generateDailyCalendar(retainedNodes, speedProfile = 'normal', dailyHours = 1.5) {
    const dailyTargetMinutes = Math.round(dailyHours * 60); // 90 phút/ngày
    const calendarDays = [];

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

    const pickUniqueDomainTask = (queue, dayNodes, usedDomains, currentMinutes, maxAllowed) => {
      if (!queue || queue.length === 0) return 0;
      const candidate = queue[0];
      const domainKey = (candidate.domain || '').toUpperCase().replace('PRE_', '').replace('_T1', '').replace('_T2', '');

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

    while (hasPendingTasks() && currentDayIndex <= 600) {
      let dayMinutes = 0;
      const dayNodes = [];
      const usedDomainsThisDay = new Set();

      // VÒNG LẶP DUY TRÌ (CỨ 2-3 NGÀY KHI LISTENING & READING ĐÃ XONG)
      const isLisReadDone = (qPreLis.length === 0 && qOffLis.length === 0 && qPreRead.length === 0 && qOffRead.length === 0);

      if (isLisReadDone && (qOffWrite.length > 0 || qOffSpk.length > 0)) {
        daysSinceLastReview++;

        if (daysSinceLastReview >= 3) {
          daysSinceLastReview = 0;
          reviewTypeToggle++;

          if (reviewTypeToggle % 2 === 1) {
            // NGÀY ÔN READING: CHIẾM TRỌN 60 PHÚT
            const readReview = {
              id: `S4_REV_READ_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4", domain: "READING", type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Giải Đề Reading Cambridge Cũ (Bấm giờ 60 phút full test)`,
              benefit: "Giải trọn vẹn 1 đề Reading 3 Passage dưới áp lực 60 phút để giữ phong độ phòng thi.",
              url: "reading/reading.html",
              duration: { fast: 50, normal: 60, slow: 70 },
              coachHours: 0.5, tags: ["READ_MAINTENANCE"]
            };
            dayNodes.push({ ...readReview, assignedDurationMinutes: 60 });
            dayMinutes += 60;
            usedDomainsThisDay.add('READING');
            reviewCount++;
          } else {
            // NGÀY ÔN LISTENING: CHIẾM ĐÚNG 30 PHÚT
            const lisReview = {
              id: `S4_REV_LIS_${String(reviewCount).padStart(2, '0')}`,
              stage: "S4", domain: "LISTENING", type: "TEST",
              title: `[ÔN TẬP DUY TRÌ #${reviewCount}] Nghe lại 1 Đề Listening Cambridge Cũ (Bấm giờ 30 phút)`,
              benefit: "Nghe liên tục 40 câu không tạm dừng để duy trì độ nhạy phản xạ âm thanh.",
              url: "listening/listening.html",
              duration: { fast: 25, normal: 30, slow: 35 },
              coachHours: 0.25, tags: ["LIS_MAINTENANCE"]
            };
            dayNodes.push({ ...lisReview, assignedDurationMinutes: 30 });
            dayMinutes += 30;
            usedDomainsThisDay.add('LISTENING');
            reviewCount++;
          }
        }
      }

      // 1. NGỮ PHÁP (MỖI NGÀY 1 BÀI LIÊN TỤC ĐẾN KHI HẾT)
      if (qGrammar.length > 0) {
        dayMinutes += pickUniqueDomainTask(qGrammar, dayNodes, usedDomainsThisDay, dayMinutes, 30);
      }

      // 2. NHÁNH NGHE (PRE-LIS ➔ XONG THÌ LÊN ĐỀ CHÍNH THỨC)
      if (dayMinutes < dailyTargetMinutes && !usedDomainsThisDay.has('LISTENING')) {
        if (qPreLis.length > 0) {
          dayMinutes += pickUniqueDomainTask(qPreLis, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 5);
        } else if (qOffLis.length > 0) {
          dayMinutes += pickUniqueDomainTask(qOffLis, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 5);
        }
      }

      // 3. TỪ VỰNG HOẶC NHÁNH ĐỌC (PRE-READ ➔ XONG LÊN ĐỀ CHÍNH THỨC)
      if (dayMinutes < dailyTargetMinutes) {
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

      // 4. BỔ TRỢ: PRE-WRITING HOẶC PRE-SPEAKING
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreWrite.length > 0 && !usedDomainsThisDay.has('WRITING')) {
          dayMinutes += pickUniqueDomainTask(qPreWrite, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        } else if (qPreSpk.length > 0 && !usedDomainsThisDay.has('SPEAKING')) {
          dayMinutes += pickUniqueDomainTask(qPreSpk, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // 5. VIẾT & NÓI CHÍNH THỨC
      if (dayMinutes < dailyTargetMinutes) {
        if (qPreWrite.length === 0 && qOffWrite.length > 0 && !usedDomainsThisDay.has('WRITING')) {
          dayMinutes += pickUniqueDomainTask(qOffWrite, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 15);
        } else if (qPreSpk.length === 0 && qOffSpk.length > 0 && !usedDomainsThisDay.has('SPEAKING')) {
          dayMinutes += pickUniqueDomainTask(qOffSpk, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
        }
      }

      // 6. MOCK TESTS GIAI ĐOẠN CUỐI
      if (dayMinutes < dailyTargetMinutes && qMock.length > 0 && !usedDomainsThisDay.has('MOCK_TEST')) {
        dayMinutes += pickUniqueDomainTask(qMock, dayNodes, usedDomainsThisDay, dayMinutes, 180);
      }

      // BỐC THÊM NẾU CHƯA ĐỦ 70 PHÚT TRONG NGÀY
      if (dayMinutes < 70) {
        const fallbackQueues = [qVocab, qPreSpk, qPreWrite, qOffWrite, qOffSpk, qOffRead, qOffLis];
        for (const fq of fallbackQueues) {
          if (fq.length > 0) {
            const added = pickUniqueDomainTask(fq, dayNodes, usedDomainsThisDay, dayMinutes, dailyTargetMinutes + 10);
            dayMinutes += added;
            if (dayMinutes >= 80) break;
          }
        }
      }

      if (dayNodes.length > 0) {
        calendarDays.push({
          dayNumber: currentDayIndex,
          totalMinutes: dayMinutes,
          nodes: dayNodes
        });
        currentDayIndex++;
      } else {
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
