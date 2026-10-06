/**
 * curriculum-system/manifest-s1-s2-system.js
 * CHUỖI ĐỐT SỐNG GIAI ĐOẠN 1 (FOUNDATION) & GIAI ĐOẠN 2 (PRE-IELTS)
 * Định dạng mã nhảy bước: S1_xxx_0010, S2_xxx_0100 (Dễ dàng chèn bài mới)
 */

export const STAGE_1_NODES = [
  // =========================================================================
  // GIAI ĐOẠN 1: NỀN TẢNG NGỮ PHÁP CƠ BẢN (BAND 0 ➔ 3.5/4.0)
  // =========================================================================
  {
    id: "S1_GRAM_0010",
    stage: "S1",
    title: "1. Danh từ số ít & số nhiều (Concept Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=present-simple&type=theory",
    duration: { fast: 5, normal: 10, slow: 15 },
    coachHours: 0,
    tags: ["G_NOUNS"]
  },
  {
    id: "S1_GRAM_0020",
    stage: "S1",
    title: "1. Danh từ số ít & số nhiều (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=present-simple&type=exercises",
    duration: { fast: 5, normal: 10, slow: 15 },
    coachHours: 0.25,
    tags: ["G_NOUNS"]
  },
  {
    id: "S1_GRAM_0030",
    stage: "S1",
    title: "2. Thì Hiện tại đơn: To Be & Động từ thường (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=present-simple&type=theory",
    duration: { fast: 10, normal: 15, slow: 30 },
    coachHours: 0,
    tags: ["G_PRES_SIMPLE"]
  },
  {
    id: "S1_GRAM_0040",
    stage: "S1",
    title: "2. Thì Hiện tại đơn (Bài tập phản xạ)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=present-simple&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_PRES_SIMPLE"]
  },
  {
    id: "S1_GRAM_0050",
    stage: "S1",
    title: "3. Thì Hiện tại tiếp diễn (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=present-continuous&type=theory",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0,
    tags: ["G_PRES_CONT"]
  },
  {
    id: "S1_GRAM_0060",
    stage: "S1",
    title: "3. Thì Hiện tại tiếp diễn (Bài tập chia động từ)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=present-continuous&type=exercises",
    duration: { fast: 12, normal: 20, slow: 35 },
    coachHours: 0.25,
    tags: ["G_PRES_CONT"]
  },
  {
    id: "S1_GRAM_0070",
    stage: "S1",
    title: "4. Động từ bất quy tắc V2 (Lý thuyết 54 động từ cốt lõi)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=irregular-v2&type=theory",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0,
    tags: ["G_IRREG_V2"]
  },
  {
    id: "S1_GRAM_0080",
    stage: "S1",
    title: "4. Động từ bất quy tắc V2 (Khảo bài & Bài tập phản xạ)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=irregular-v2&type=exercises",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0.25,
    tags: ["G_IRREG_V2"]
  },
  {
    id: "S1_GRAM_0090",
    stage: "S1",
    title: "5. Thì Quá khứ đơn: Was/Were & Did (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=past-simple&type=theory",
    duration: { fast: 10, normal: 20, slow: 35 },
    coachHours: 0,
    tags: ["G_PAST_SIMPLE"]
  },
  {
    id: "S1_GRAM_0100",
    stage: "S1",
    title: "5. Thì Quá khứ đơn (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=past-simple&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_PAST_SIMPLE"]
  },
  {
    id: "S1_GRAM_0110",
    stage: "S1",
    title: "6. Thì Tương lai đơn: Will + V0 (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=simple-future&type=theory",
    duration: { fast: 5, normal: 10, slow: 18 },
    coachHours: 0,
    tags: ["G_FUTURE_SIMPLE"]
  },
  {
    id: "S1_GRAM_0120",
    stage: "S1",
    title: "6. Thì Tương lai đơn (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=simple-future&type=exercises",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0.25,
    tags: ["G_FUTURE_SIMPLE"]
  },
  {
    id: "S1_GRAM_0130",
    stage: "S1",
    title: "7. Giới từ cơ bản In - On - At (Lý thuyết Tam giác giới từ)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=prepositions&type=theory",
    duration: { fast: 5, normal: 8, slow: 15 },
    coachHours: 0,
    tags: ["G_PREP_BASIC"]
  },
  {
    id: "S1_GRAM_0140",
    stage: "S1",
    title: "7. Giới từ cơ bản In - On - At (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=prepositions&type=exercises",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0.25,
    tags: ["G_PREP_BASIC"]
  },
  {
    id: "S1_GRAM_0150",
    stage: "S1",
    title: "8. Mạo từ: A / An / The / Rỗng (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=articles&type=theory",
    duration: { fast: 10, normal: 18, slow: 30 },
    coachHours: 0,
    tags: ["G_ARTICLES"]
  },
  {
    id: "S1_GRAM_0160",
    stage: "S1",
    title: "8. Mạo từ: A / An / The (Bài tập phân biệt)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=articles&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.25,
    tags: ["G_ARTICLES"]
  },

  // =========================================================================
  // TỪ VỰNG CỐT LÕI (BỘ 300 TỪ HỌC THUẬT: UNIT 1 - 4)
  // =========================================================================
  {
    id: "S1_VOCAB_0200",
    stage: "S1",
    title: "Từ vựng Học thuật Unit 1: Positive Attitude & Impact",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=1",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U01"]
  },
  {
    id: "S1_VOCAB_0210",
    stage: "S1",
    title: "Từ vựng Học thuật Unit 2: Negative Attitude & Impact",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=2",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U02"]
  },
  {
    id: "S1_VOCAB_0220",
    stage: "S1",
    title: "Từ vựng Học thuật Unit 3: Daily Routines & Actions",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=3",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U03"]
  },
  {
    id: "S1_VOCAB_0230",
    stage: "S1",
    title: "Từ vựng Học thuật Unit 4: Communication & Relationships",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=4",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U04"]
  },

  // =========================================================================
  // PRE-SKILLS NỀN TẢNG (LEVEL A1 & A2)
  // =========================================================================
  {
    id: "S1_PLIS_0300",
    stage: "S1",
    title: "Pre-Listening Level A1: Luyện nghe số đếm, tên riêng & Bắt âm #01",
    domain: "PRE_LISTENING",
    type: "PRACTICE",
    url: "pre-listening/index-pl.html",
    duration: { fast: 10, normal: 15, slow: 25 },
    coachHours: 0,
    tags: ["PRE_LIS_A1"]
  },
  {
    id: "S1_PREAD_0310",
    stage: "S1",
    title: "Pre-Reading Level A1: Kỹ thuật Scanning định vị từ khóa cơ bản #01",
    domain: "PRE_READING",
    type: "PRACTICE",
    url: "pre-reading/index-pr.html",
    duration: { fast: 10, normal: 15, slow: 25 },
    coachHours: 0.25,
    tags: ["PRE_READ_A1"]
  },
  {
    id: "S1_PSPK_0320",
    stage: "S1",
    title: "Pre-Speaking A1.01: Shadowing Family and Relationships",
    domain: "PRE_SPEAKING",
    type: "PRACTICE",
    url: "pre-speaking/index-ps.html",
    duration: { fast: 15, normal: 25, slow: 35 },
    coachHours: 0.25,
    tags: ["PRE_SPK_A1"]
  },
  {
    id: "S1_PSPK_0330",
    stage: "S1",
    title: "Pre-Speaking A1.02: Shadowing Travel and Holidays",
    domain: "PRE_SPEAKING",
    type: "PRACTICE",
    url: "pre-speaking/index-ps.html",
    duration: { fast: 15, normal: 25, slow: 35 },
    coachHours: 0.25,
    tags: ["PRE_SPK_A1"]
  }
];

export const STAGE_2_NODES = [
  // =========================================================================
  // GIAI ĐOẠN 2: PRE-IELTS - CÂU PHỨC & NGỮ PHÁP TRUNG CẤP (BAND 4.0 ➔ 5.5)
  // =========================================================================
  {
    id: "S2_GRAM_0400",
    stage: "S2",
    title: "9. Thì Quá khứ tiếp diễn: When & While (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=past-continuous&type=theory",
    duration: { fast: 8, normal: 15, slow: 25 },
    coachHours: 0,
    tags: ["G_PAST_CONT"]
  },
  {
    id: "S2_GRAM_0410",
    stage: "S2",
    title: "9. Thì Quá khứ tiếp diễn (Bài tập phối thì)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=past-continuous&type=exercises",
    duration: { fast: 12, normal: 20, slow: 35 },
    coachHours: 0.25,
    tags: ["G_PAST_CONT"]
  },
  {
    id: "S2_GRAM_0420",
    stage: "S2",
    title: "10. Động từ bất quy tắc V3 cho các thì Hoàn thành (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=irregular-v3&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_IRREG_V3"]
  },
  {
    id: "S2_GRAM_0430",
    stage: "S2",
    title: "10. Động từ bất quy tắc V3 (Bài tập khảo bài & Chia thì)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=irregular-v3&type=exercises",
    duration: { fast: 8, normal: 12, slow: 20 },
    coachHours: 0.25,
    tags: ["G_IRREG_V3"]
  },
  {
    id: "S2_GRAM_0440",
    stage: "S2",
    title: "11. Thì Hiện tại hoàn thành: Have/Has + V3 (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=present-perfect&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_PRES_PERF"]
  },
  {
    id: "S2_GRAM_0450",
    stage: "S2",
    title: "11. Thì Hiện tại hoàn thành (Bài tập)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=present-perfect&type=exercises",
    duration: { fast: 18, normal: 30, slow: 50 },
    coachHours: 0.5,
    tags: ["G_PRES_PERF"]
  },
  {
    id: "S2_GRAM_0460",
    stage: "S2",
    title: "12. Thì Quá khứ hoàn thành: Had + V3 (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=past-perfect&type=theory",
    duration: { fast: 10, normal: 15, slow: 30 },
    coachHours: 0,
    tags: ["G_PAST_PERF"]
  },
  {
    id: "S2_GRAM_0470",
    stage: "S2",
    title: "12. Thì Quá khứ hoàn thành (Bài tập phối thì Before/After)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=past-perfect&type=exercises",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0.25,
    tags: ["G_PAST_PERF"]
  },
  {
    id: "S2_GRAM_0480",
    stage: "S2",
    title: "13. Câu điều kiện IF: Loại 1, 2, 3 (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=conditionals&type=theory",
    duration: { fast: 15, normal: 30, slow: 50 },
    coachHours: 0,
    tags: ["G_CONDITIONALS"]
  },
  {
    id: "S2_GRAM_0490",
    stage: "S2",
    title: "13. Câu điều kiện IF (Bài tập viết lại câu)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=conditionals&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_CONDITIONALS"]
  },
  {
    id: "S2_GRAM_0500",
    stage: "S2",
    title: "14. Câu bị động (Passive Voice) - 5 bước cốt lõi (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=passive-voice&type=theory",
    duration: { fast: 12, normal: 20, slow: 40 },
    coachHours: 0,
    tags: ["G_PASSIVE_VOICE"]
  },
  {
    id: "S2_GRAM_0510",
    stage: "S2",
    title: "14. Câu bị động (Bài tập chuyển đổi)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=passive-voice&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_PASSIVE_VOICE"]
  },
  {
    id: "S2_GRAM_0520",
    stage: "S2",
    title: "15. Cấu trúc So sánh: Hơn, Nhất & Kép (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=13-comparison&type=theory",
    duration: { fast: 10, normal: 20, slow: 35 },
    coachHours: 0,
    tags: ["G_COMPARISON"]
  },
  {
    id: "S2_GRAM_0530",
    stage: "S2",
    title: "15. Cấu trúc So sánh (Bài tập chia dạng đúng)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=13-comparison&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.25,
    tags: ["G_COMPARISON"]
  },
  {
    id: "S2_GRAM_0540",
    stage: "S2",
    title: "16. Mệnh đề quan hệ: Who, Which, That, Whose, Where (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=14-relative-clauses&type=theory",
    duration: { fast: 10, normal: 18, slow: 30 },
    coachHours: 0,
    tags: ["G_RELATIVE_CLAUSE"]
  },
  {
    id: "S2_GRAM_0550",
    stage: "S2",
    title: "16. Mệnh đề quan hệ (Bài tập ghép câu phức)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=14-relative-clauses&type=exercises",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0.5,
    tags: ["G_RELATIVE_CLAUSE"]
  },
  {
    id: "S2_GRAM_0560",
    stage: "S2",
    title: "17. Giới từ nâng cao: Vị trí & Hướng chuyển động (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=prepositions-adv&type=theory",
    duration: { fast: 15, normal: 25, slow: 45 },
    coachHours: 0,
    tags: ["G_PREP_ADV"]
  },
  {
    id: "S2_GRAM_0570",
    stage: "S2",
    title: "17. Giới từ nâng cao (Bài tập thực hành)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=prepositions-adv&type=exercises",
    duration: { fast: 25, normal: 45, slow: 80 },
    coachHours: 0.5,
    tags: ["G_PREP_ADV"]
  },
  {
    id: "S2_GRAM_0580",
    stage: "S2",
    title: "18. Cấu tạo từ / Loại từ (Word Form): 15 Vị trí vàng (Lý thuyết)",
    domain: "GRAMMAR",
    type: "THEORY",
    url: "grammar/lesson-g.html?tense=15-word-form&type=theory",
    duration: { fast: 18, normal: 30, slow: 50 },
    coachHours: 0,
    tags: ["G_WORD_FORM"]
  },
  {
    id: "S2_GRAM_0590",
    stage: "S2",
    title: "18. Cấu tạo từ / Loại từ (Bài tập 50 câu)",
    domain: "GRAMMAR",
    type: "PRACTICE",
    url: "grammar/lesson-g.html?tense=15-word-form&type=exercises",
    duration: { fast: 20, normal: 35, slow: 60 },
    coachHours: 0.5,
    tags: ["G_WORD_FORM"]
  },

  // =========================================================================
  // TỪ VỰNG HỌC THUẬT (BỘ 300 TỪ: UNIT 5 - 10)
  // =========================================================================
  {
    id: "S2_VOCAB_0600",
    stage: "S2",
    title: "Từ vựng Học thuật Unit 5: Education & Academic Success",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=5",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U05"]
  },
  {
    id: "S2_VOCAB_0610",
    stage: "S2",
    title: "Từ vựng Học thuật Unit 6: Environmental Issues & Climate",
    domain: "VOCABULARY",
    type: "PRACTICE",
    url: "vocab/index-v.html?unit=6",
    duration: { fast: 15, normal: 25, slow: 40 },
    coachHours: 0,
    tags: ["VOCAB_U06"]
  },

  // =========================================================================
  // PRE-WRITING KHỞI ĐỘNG (DỊCH CÂU SỐ LIỆU & LẬP LUẬN SONG NGỮ)
  // =========================================================================
  {
    id: "S2_PWT1_0700",
    stage: "S2",
    title: "Pre-Writing T1: [01.1] Line - Thất nghiệp giới trẻ Anh (1993-2012)",
    domain: "PRE_WRITING_T1",
    type: "PRACTICE",
    url: "pre-writing/index-pwt1.html",
    duration: { fast: 15, normal: 20, slow: 35 },
    coachHours: 0.5,
    tags: ["PWT1_LINE"]
  },
  {
    id: "S2_PWT1_0710",
    stage: "S2",
    title: "Pre-Writing T1: [02.1] Bar - Lượng khách du lịch đến 5 quốc gia",
    domain: "PRE_WRITING_T1",
    type: "PRACTICE",
    url: "pre-writing/index-pwt1.html",
    duration: { fast: 15, normal: 20, slow: 35 },
    coachHours: 0.5,
    tags: ["PWT1_BAR"]
  },
  {
    id: "S2_PWT2_0800",
    stage: "S2",
    title: "Pre-Writing T2: [01.1] OP - Environment (Trách nhiệm cá nhân vs Thể chế)",
    domain: "PRE_WRITING_T2",
    type: "PRACTICE",
    url: "pre-writing/index-pwt2.html",
    duration: { fast: 20, normal: 30, slow: 45 },
    coachHours: 0.5,
    tags: ["PWT2_OPINION"]
  },
  {
    id: "S2_PWT2_0810",
    stage: "S2",
    title: "Pre-Writing T2: [02.1] DIS - Work & Employment (Gắn bó hay Nhảy việc)",
    domain: "PRE_WRITING_T2",
    type: "PRACTICE",
    url: "pre-writing/index-pwt2.html",
    duration: { fast: 20, normal: 30, slow: 45 },
    coachHours: 0.5,
    tags: ["PWT2_DISCUSSION"]
  }
];
