/**
 * curriculum-system/manifest-s3-s4-system.js
 * CHUỖI ĐỐT SỐNG GIAI ĐOẠN 3 (IELTS SKILL-BUILDING) & GIAI ĐOẠN 4 (ADVANCED MASTERY)
 * Ánh xạ chuẩn xác tới kho đề Cambridge, Writing Task 1-2 & Speaking Forecast
 */

export const STAGE_3_NODES = [
  // =========================================================================
  // GIAI ĐOẠN 3: IELTS SKILL-BUILDING (BAND 5.5 ➔ 6.5)
  // TRỌNG TÂM: READING & LISTENING CÓ MỚM TỪ KHÓA + VIẾT NÓI 2 TẦNG
  // =========================================================================

  // --- IELTS READING CÓ MỚM (CAMBRIDGE 17 & 18) ---
  {
    id: "S3_READ_0900",
    stage: "S3",
    title: "Reading Cam 17 Test 1 - Passage 1 (Dạng Gap Fill & TFNG có mớm)",
    domain: "READING",
    type: "PRACTICE",
    url: "reading/runner-reading.html?test=data-r/cam17-test1/cam17-test1-p1.json",
    duration: { fast: 12, normal: 15, slow: 20 },
    coachHours: 0,
    tags: ["READ_P1", "TFNG", "GAP_FILL"]
  },
  {
    id: "S3_READ_0910",
    stage: "S3",
    title: "Reading Cam 17 Test 1 - Passage 2 (Dạng Matching Information có mớm)",
    domain: "READING",
    type: "PRACTICE",
    url: "reading/runner-reading.html?test=data-r/cam17-test1/cam17-test1-p2.json",
    duration: { fast: 15, normal: 18, slow: 25 },
    coachHours: 0.25,
    tags: ["READ_P2", "MATCH_INFO"]
  },
  {
    id: "S3_READ_0920",
    stage: "S3",
    title: "Reading Cam 17 Test 1 - Passage 3 (Dạng Multiple Choice có mớm)",
    domain: "READING",
    type: "PRACTICE",
    url: "reading/runner-reading.html?test=data-r/cam17-test1/cam17-test1-p3.json",
    duration: { fast: 18, normal: 20, slow: 30 },
    coachHours: 0.5,
    tags: ["READ_P3", "MCQ", "YNNG"]
  },
  {
    id: "S3_READ_0930",
    stage: "S3",
    title: "Reading Cam 18 Test 1 - Passage 1 (Kỹ thuật Scan có mớm)",
    domain: "READING",
    type: "PRACTICE",
    url: "reading/runner-reading.html?test=data-r/cam18-test1/cam18-test1-p1.json",
    duration: { fast: 12, normal: 15, slow: 20 },
    coachHours: 0,
    tags: ["READ_P1", "TFNG"]
  },
  {
    id: "S3_READ_0940",
    stage: "S3",
    title: "Reading Cam 18 Test 1 - Passage 2 (Cắt câu phức Sentence Stripping)",
    domain: "READING",
    type: "PRACTICE",
    url: "reading/runner-reading.html?test=data-r/cam18-test1/cam18-test1-p2.json",
    duration: { fast: 15, normal: 18, slow: 25 },
    coachHours: 0.25,
    tags: ["READ_P2", "MATCH_HEAD"]
  },

  // --- IELTS LISTENING CÓ MỚM (CAMBRIDGE 19 & 20) ---
  {
    id: "S3_LIS_0950",
    stage: "S3",
    title: "Listening Cam 19 Test 1 - Part 1 (Điền biểu mẫu Form Completion có mớm)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "listening/runner-listening.html?test=cam19-lis-test1-p1",
    duration: { fast: 8, normal: 10, slow: 15 },
    coachHours: 0,
    tags: ["LIS_P1", "FORM_COMP"]
  },
  {
    id: "S3_LIS_0960",
    stage: "S3",
    title: "Listening Cam 19 Test 1 - Part 2 (Bẫy Map & Multiple Choice có mớm)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "listening/runner-listening.html?test=cam19-lis-test1-p2",
    duration: { fast: 8, normal: 10, slow: 15 },
    coachHours: 0.25,
    tags: ["LIS_P2", "MAP_PLAN"]
  },
  {
    id: "S3_LIS_0970",
    stage: "S3",
    title: "Listening Cam 19 Test 1 - Part 3 (Hội thoại học thuật 2-3 người có mớm)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "listening/runner-listening.html?test=cam19-lis-test1-p3",
    duration: { fast: 10, normal: 12, slow: 18 },
    coachHours: 0.25,
    tags: ["LIS_P3", "ACAD_DISC"]
  },
  {
    id: "S3_LIS_0980",
    stage: "S3",
    title: "Listening Cam 19 Test 1 - Part 4 (Bài thuyết trình dài Note Completion)",
    domain: "LISTENING",
    type: "PRACTICE",
    url: "listening/runner-listening.html?test=cam19-lis-test1-p4",
    duration: { fast: 10, normal: 12, slow: 18 },
    coachHours: 0.5,
    tags: ["LIS_P4", "NOTE_COMP"]
  },

  // --- TỪ VỰNG NÂNG CAO (BỘ 540 TỪ: UNIT 1 - 6) ---
  {
    id: "S3_VOCAB_1000",
    stage: "S3",
    title: "Từ vựng Nâng cao Unit 1: Global Economy & Trade",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=11",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_540_U01"]
  },
  {
    id: "S3_VOCAB_1010",
    stage: "S3",
    title: "Từ vựng Nâng cao Unit 2: Technology & Artificial Intelligence",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=12",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_540_U02"]
  },

  // --- WRITING TASK 1 CHÍNH THỨC (CÁC DẠNG CƠ BẢN) ---
  {
    id: "S3_WT1_1050",
    stage: "S3",
    title: "Writing Task 1: [01.01] Line Graph - Giá nhà trung bình tại 3 quốc gia",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_LINE"]
  },
  {
    id: "S3_WT1_1060",
    stage: "S3",
    title: "Writing Task 1: [02.01] Bar Chart - Tỉ lệ phim phát hành & vé bán ra",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_BAR"]
  },
  {
    id: "S3_WT1_1070",
    stage: "S3",
    title: "Writing Task 1: [03.01] Pie Chart - Đánh giá cơ sở vật chất đại học",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_PIE"]
  },
  {
    id: "S3_WT1_1080",
    stage: "S3",
    title: "Writing Task 1: [04.01] Table - Sinh viên quốc tế đến Canada và Mỹ",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_TABLE"]
  },

  // --- WRITING TASK 2 CHÍNH THỨC (OPINION & DISCUSSION) ---
  {
    id: "S3_WT2_1100",
    stage: "S3",
    title: "Writing Task 2: [01.01] Opinion - Tăng trưởng kinh tế có hủy hoại tự nhiên?",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing task 2/index-t2.html",
    duration: { fast: 40, normal: 50, slow: 65 },
    coachHours: 1.0,
    tags: ["WT2_OPINION"]
  },
  {
    id: "S3_WT2_1110",
    stage: "S3",
    title: "Writing Task 2: [02.01] Discussion - Mạng xã hội: Kết nối hay Làm hỏng quan hệ?",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing task 2/index-t2.html",
    duration: { fast: 40, normal: 50, slow: 65 },
    coachHours: 1.0,
    tags: ["WT2_DISCUSSION"]
  },

  // --- SPEAKING FORECAST (PART 1 & CUE CARDS PART 2) ---
  {
    id: "S3_SPK_1150",
    stage: "S3",
    title: "Speaking Part 1: [p1_boredom] Feeling bored (Full set 4 câu AREA)",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 10, normal: 15, slow: 20 },
    coachHours: 0.25,
    tags: ["SPK_P1"]
  },
  {
    id: "S3_SPK_1160",
    stage: "S3",
    title: "Speaking Part 1: [p1_computers_tablets] Computers & Tablets (Full set)",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 10, normal: 15, slow: 20 },
    coachHours: 0.25,
    tags: ["SPK_P1"]
  },
  {
    id: "S3_SPK_1170",
    stage: "S3",
    title: "Speaking Part 2: [p2_time_saving_change] A change that saves time (Cue Card)",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 15, normal: 20, slow: 30 },
    coachHours: 0.5,
    tags: ["SPK_P2"]
  },
  {
    id: "S3_SPK_1180",
    stage: "S3",
    title: "Speaking Part 2: [p2_person_met_once] A person you only met once",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 15, normal: 20, slow: 30 },
    coachHours: 0.5,
    tags: ["SPK_P2"]
  }
];

export const STAGE_4_NODES = [
  // =========================================================================
  // GIAI ĐOẠN 4: ADVANCED MASTERY & FULL MOCK TEST (BAND 6.5 ➔ 7.5+)
  // TRỌNG TÂM: ĐỀ KHÔNG MỚM, ÉP THỜI GIAN, DẠNG KHÓ & BẤM GIỜ THI THẬT
  // =========================================================================

  // --- READING KHÔNG MỚM (CAMBRIDGE 19, 20 & 21) ---
  {
    id: "S4_READ_1300",
    stage: "S4",
    title: "Reading Cam 19 Test 1 - Passage 1 (Tự gạch từ khóa - Bấm giờ cứng 15p)",
    domain: "READING",
    type: "TEST",
    url: "reading/runner-reading.html?test=data-r/cam19-test1/cam19-test1-p1.json",
    duration: { fast: 15, normal: 18, slow: 22 },
    coachHours: 0,
    tags: ["READ_UNPROMPTED"]
  },
  {
    id: "S4_READ_1310",
    stage: "S4",
    title: "Reading Cam 19 Test 1 - Passage 2 (Tự khoanh vùng đoạn văn - Bấm giờ 18p)",
    domain: "READING",
    type: "TEST",
    url: "reading/runner-reading.html?test=data-r/cam19-test1/cam19-test1-p2.json",
    duration: { fast: 18, normal: 20, slow: 25 },
    coachHours: 0.25,
    tags: ["READ_UNPROMPTED"]
  },
  {
    id: "S4_READ_1320",
    stage: "S4",
    title: "Reading Cam 19 Test 1 - Passage 3 (Passage dài triết học/khoa học - 20p)",
    domain: "READING",
    type: "TEST",
    url: "reading/runner-reading.html?test=data-r/cam19-test1/cam19-test1-p3.json",
    duration: { fast: 20, normal: 22, slow: 30 },
    coachHours: 0.5,
    tags: ["READ_UNPROMPTED"]
  },

  // --- LISTENING KHÔNG MỚM (CAMBRIDGE 20 & 21 - TĂNG TỐC 1.1x) ---
  {
    id: "S4_LIS_1350",
    stage: "S4",
    title: "Listening Cam 20 Test 1 - Part 1 & 2 (Không mớm - Tốc độ 1.1x)",
    domain: "LISTENING",
    type: "TEST",
    url: "listening/runner-listening.html?test=cam20-lis-test1-p1",
    duration: { fast: 15, normal: 18, slow: 22 },
    coachHours: 0.25,
    tags: ["LIS_UNPROMPTED"]
  },
  {
    id: "S4_LIS_1360",
    stage: "S4",
    title: "Listening Cam 20 Test 1 - Part 3 & 4 (Bẫy từ vựng & Không dừng audio)",
    domain: "LISTENING",
    type: "TEST",
    url: "listening/runner-listening.html?test=cam20-lis-test1-p3",
    duration: { fast: 18, normal: 20, slow: 25 },
    coachHours: 0.5,
    tags: ["LIS_UNPROMPTED"]
  },

  // --- WRITING TASK 1 NÂNG CAO (MAP, PROCESS, FLOOR, MIXED) ---
  {
    id: "S4_WT1_1400",
    stage: "S4",
    title: "Writing Task 1: [06.01] Map - Khu vực bờ biển tại Úc (1950 vs Nay)",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_MAP"]
  },
  {
    id: "S4_WT1_1410",
    stage: "S4",
    title: "Writing Task 1: [07.01] Floor Plan - Mặt bằng phòng sinh hoạt sinh viên",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_FLOOR"]
  },
  {
    id: "S4_WT1_1420",
    stage: "S4",
    title: "Writing Task 1: [08.01] Process - Quy trình sản xuất dây kim loại",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_PROCESS"]
  },
  {
    id: "S4_WT1_1430",
    stage: "S4",
    title: "Writing Task 1: [05.01] Mixed Charts - Nhiệt độ & Lượng mưa tại Úc",
    domain: "WRITING_T1",
    type: "PRACTICE",
    url: "writing task 1/index-t1.html",
    duration: { fast: 20, normal: 30, slow: 40 },
    coachHours: 0.75,
    tags: ["WT1_MIXED"]
  },

  // --- WRITING TASK 2 CÁC THỂ LOẠI NÂNG CAO ---
  {
    id: "S4_WT2_1450",
    stage: "S4",
    title: "Writing Task 2: [03.01] Outweigh - Du lịch đại trà: Lợi có hơn Hại?",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing task 2/index-t2.html",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 1.0,
    tags: ["WT2_OUTWEIGH"]
  },
  {
    id: "S4_WT2_1460",
    stage: "S4",
    title: "Writing Task 2: [04.01] Cause/Effect - Tội phạm gia tăng dù luật nghiêm khắc",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing task 2/index-t2.html",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 1.0,
    tags: ["WT2_CAUSE_SOLUTION"]
  },
  {
    id: "S4_WT2_1470",
    stage: "S4",
    title: "Writing Task 2: [05.01] Two-part - Kẹt xe đô thị & Biện pháp chính phủ",
    domain: "WRITING_T2",
    type: "PRACTICE",
    url: "writing task 2/index-t2.html",
    duration: { fast: 40, normal: 50, slow: 60 },
    coachHours: 1.0,
    tags: ["WT2_TWOPART"]
  },

  // --- SPEAKING CHUYÊN SÂU (PART 3 & SHADOWING C1) ---
  {
    id: "S4_SPK_1500",
    stage: "S4",
    title: "Speaking Part 3: [p3_time_management] Time Management & Success (Framework 4 bước)",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 15, normal: 20, slow: 30 },
    coachHours: 0.5,
    tags: ["SPK_P3"]
  },
  {
    id: "S4_SPK_1510",
    stage: "S4",
    title: "Speaking Part 3: [p3_artificial_intelligence_future] AI & Future Education",
    domain: "SPEAKING",
    type: "PRACTICE",
    url: "speaking/index-s.html",
    duration: { fast: 15, normal: 20, slow: 30 },
    coachHours: 0.5,
    tags: ["SPK_P3"]
  },
  {
    id: "S4_SPK_1520",
    stage: "S4",
    title: "Pre-Speaking C1.01: Shadowing Barack Obama (Diễn thuyết truyền cảm hứng)",
    domain: "PRE_SPEAKING",
    type: "PRACTICE",
    url: "pre-speaking/index-ps.html",
    duration: { fast: 15, normal: 25, slow: 35 },
    coachHours: 0.25,
    tags: ["PRE_SPK_C1"]
  },
  {
    id: "S4_SPK_1530",
    stage: "S4",
    title: "Pre-Speaking C1.30: Shadowing Steve Jobs - Business Vocabulary",
    domain: "PRE_SPEAKING",
    type: "PRACTICE",
    url: "pre-speaking/index-ps.html",
    duration: { fast: 15, normal: 25, slow: 35 },
    coachHours: 0.25,
    tags: ["PRE_SPK_C1"]
  },

  // --- FULL MOCK TESTS (BẤM GIỜ THI THẬT TRỌN BỘ) ---
  {
    id: "S4_MOCK_1600",
    stage: "S4",
    title: "Full Mock Test: Reading Cambridge 21 Test 1 (Full 3 Passages - 60 phút)",
    domain: "MOCK_TEST",
    type: "TEST",
    url: "reading/runner-reading.html?test=cam21-test1-full",
    duration: { fast: 55, normal: 60, slow: 70 },
    coachHours: 1.5,
    tags: ["MOCK_READING"]
  },
  {
    id: "S4_MOCK_1610",
    stage: "S4",
    title: "Full Mock Test: Listening Cambridge 21 Test 1 (Full 40 câu - 40 phút)",
    domain: "MOCK_TEST",
    type: "TEST",
    url: "listening/runner-listening.html?test=cam21-lis-test1-full",
    duration: { fast: 35, normal: 40, slow: 45 },
    coachHours: 1.0,
    tags: ["MOCK_LISTENING"]
  },
  {
    id: "S4_MOCK_1620",
    stage: "S4",
    title: "Full Mock Test: Speaking Simulation 3 Parts (Ghi âm liền mạch 14 phút)",
    domain: "MOCK_TEST",
    type: "TEST",
    url: "speaking/index-s.html?mode=full_mock",
    duration: { fast: 25, normal: 30, slow: 40 },
    coachHours: 1.0,
    tags: ["MOCK_SPEAKING"]
  }
];
