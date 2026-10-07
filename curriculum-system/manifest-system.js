/**
 * curriculum-system/manifest-system.js
 * SỔ CÁI MASTER TOÀN DIỆN (FULL ROADMAP SPINE 858 BÀI TẬP: BAND 0.0 ➔ 7.5+)
 * Tự động phân bổ đúng định mức thời gian, chuẩn 1 tiếng BTVN/ngày (~380 ngày)
 */

import { STAGE_1_NODES, STAGE_2_NODES } from './manifest-s1-s2-system.js';

// =========================================================================
// HÀM PHÁT SINH TỰ ĐỘNG TOÀN BỘ KHO ĐỀ CAMBRIDGE & THI THẬT CỦA BẠN
// =========================================================================

// 1. Phát sinh toàn bộ 57 Passage Reading (Cam 17 - 21)
function generateAllReadingNodes() {
  const nodes = [];
  const cams = [17, 18, 19, 20, 21];
  let order = 1000;

  cams.forEach(cam => {
    const tests = cam === 21 ? [1, 3, 4] : [1, 2, 3, 4];
    tests.forEach(test => {
      for (let p = 1; p <= 3; p++) {
        const isAdvanced = cam >= 20 || p === 3;
        const stage = isAdvanced ? 'S4' : 'S3';
        const type = isAdvanced ? 'TEST' : 'PRACTICE';
        const dur = p === 1 
          ? { fast: 12, normal: 15, slow: 20 } 
          : (p === 2 ? { fast: 15, normal: 18, slow: 25 } : { fast: 18, normal: 20, slow: 30 });

        nodes.push({
          id: `${stage}_READ_CAM${cam}_T${test}_P${p}`,
          stage,
          title: `Reading Cam ${cam} Test ${test} - Passage ${p} (${isAdvanced ? 'Không mớm' : 'Có mớm'})`,
          domain: "READING",
          type,
          url: `reading/runner-reading.html?test=data-r/cam${cam}-test${test}/cam${cam}-test${test}-p${p}.json`,
          duration: dur,
          coachHours: p === 3 ? 0.5 : 0.25,
          tags: [`READ_CAM${cam}`, `READ_P${p}`, isAdvanced ? 'READ_UNPROMPTED' : 'READ_PROMPTED']
        });
        order += 10;
      }
    });
  });
  return nodes;
}

// 2. Phát sinh toàn bộ 48 Part Listening (Cam 19 - 21)
function generateAllListeningNodes() {
  const nodes = [];
  const cams = [19, 20, 21];

  cams.forEach(cam => {
    for (let test = 1; test <= 4; test++) {
      for (let p = 1; p <= 4; p++) {
        const isAdvanced = cam === 21 || p >= 3;
        const stage = isAdvanced ? 'S4' : 'S3';
        const dur = (p === 1 || p === 2) 
          ? { fast: 8, normal: 10, slow: 15 } 
          : { fast: 10, normal: 12, slow: 18 };

        nodes.push({
          id: `${stage}_LIS_CAM${cam}_T${test}_P${p}`,
          stage,
          title: `Listening Cam ${cam} Test ${test} - Part ${p} (${isAdvanced ? 'Tốc độ 1.1x' : 'Bắt âm'})`,
          domain: "LISTENING",
          type: isAdvanced ? 'TEST' : 'PRACTICE',
          url: `listening/runner-listening.html?test=cam${cam}-lis-test${test}-p${p}`,
          duration: dur,
          coachHours: p === 4 ? 0.5 : 0.25,
          tags: [`LIS_CAM${cam}`, `LIS_P${p}`, isAdvanced ? 'LIS_UNPROMPTED' : 'LIS_PROMPTED']
        });
      }
    }
  });
  return nodes;
}

// 3. Phát sinh toàn bộ 133 Đề Writing Task 1
function generateAllWritingT1Nodes() {
  const nodes = [];
  const categories = [
    { type: "Line", count: 28, folder: "line-t1" },
    { type: "Bar", count: 34, folder: "bar-t1" },
    { type: "Pie", count: 17, folder: "pie-t1" },
    { type: "Table", count: 36, folder: "table-t1" },
    { type: "Mixed", count: 11, folder: "mixed-t1" },
    { type: "Map", count: 17, folder: "map-t1" },
    { type: "Floor", count: 10, folder: "floor-t1" },
    { type: "Process", count: 18, folder: "process-t1" }
  ];

  categories.forEach(cat => {
    for (let i = 1; i <= cat.count; i++) {
      const isAdvanced = ["Mixed", "Map", "Floor", "Process"].includes(cat.type);
      const stage = isAdvanced ? 'S4' : 'S3';
      const numStr = String(i).padStart(2, '0');

      nodes.push({
        id: `${stage}_WT1_${cat.type.toUpperCase()}_${numStr}`,
        stage,
        title: `Writing Task 1: [${numStr}] ${cat.type} Chart (Viết full 150 từ)`,
        domain: "WRITING_T1",
        type: "PRACTICE",
        url: `writing task 1/index-t1.html`,
        duration: { fast: 20, normal: 30, slow: 40 },
        coachHours: 0.75,
        tags: [`WT1_${cat.type.toUpperCase()}`, "WRITING_TASK1"]
      });
    }
  });
  return nodes;
}

// 4. Phát sinh toàn bộ 116 Đề Writing Task 2
function generateAllWritingT2Nodes() {
  const nodes = [];
  const categories = [
    { type: "Opinion", count: 40, tag: "WT2_OPINION" },
    { type: "Discussion", count: 30, tag: "WT2_DISCUSSION" },
    { type: "Outweigh", count: 20, tag: "WT2_OUTWEIGH" },
    { type: "Cause_Solution", count: 15, tag: "WT2_CAUSE_SOLUTION" },
    { type: "Two_Part", count: 11, tag: "WT2_TWOPART" }
  ];

  categories.forEach(cat => {
    for (let i = 1; i <= cat.count; i++) {
      const isAdvanced = ["Outweigh", "Cause_Solution", "Two_Part"].includes(cat.type);
      const stage = isAdvanced ? 'S4' : 'S3';
      const numStr = String(i).padStart(2, '0');

      nodes.push({
        id: `${stage}_WT2_${cat.type.toUpperCase()}_${numStr}`,
        stage,
        title: `Writing Task 2: [${numStr}] ${cat.type.replace('_', ' & ')} Essay (250 từ chuẩn PEEL)`,
        domain: "WRITING_T2",
        type: "PRACTICE",
        url: `writing task 2/index-t2.html`,
        duration: { fast: 40, normal: 50, slow: 65 },
        coachHours: 1.0,
        tags: [cat.tag, "WRITING_TASK2"]
      });
    }
  });
  return nodes;
}

// 5. Phát sinh toàn bộ kho Speaking Forecast (Part 1, 2, 3)
function generateAllSpeakingNodes() {
  const nodes = [];

  // 24 Sets Part 1
  for (let i = 1; i <= 24; i++) {
    nodes.push({
      id: `S3_SPK_P1_${String(i).padStart(2, '0')}`,
      stage: "S3",
      title: `Speaking Part 1 Forecast: Topic #${i} (4-5 câu AREA)`,
      domain: "SPEAKING",
      type: "PRACTICE",
      url: `speaking/index-s.html`,
      duration: { fast: 10, normal: 15, slow: 20 },
      coachHours: 0.25,
      tags: ["SPK_P1"]
    });
  }

  // 36 Sets Part 2 (Cue Cards)
  for (let i = 1; i <= 36; i++) {
    nodes.push({
      id: `S3_SPK_P2_${String(i).padStart(2, '0')}`,
      stage: "S3",
      title: `Speaking Part 2 Forecast: Cue Card #${i} (Lập dàn ý 1p & Nói 2p)`,
      domain: "SPEAKING",
      type: "PRACTICE",
      url: `speaking/index-s.html`,
      duration: { fast: 15, normal: 20, slow: 30 },
      coachHours: 0.5,
      tags: ["SPK_P2"]
    });
  }

  // 36 Sets Part 3 (Deep Discussion)
  for (let i = 1; i <= 36; i++) {
    nodes.push({
      id: `S4_SPK_P3_${String(i).padStart(2, '0')}`,
      stage: "S4",
      title: `Speaking Part 3 Forecast: Discussion #${i} (Framework 4 bước PEEL)`,
      domain: "SPEAKING",
      type: "PRACTICE",
      url: `speaking/index-s.html`,
      duration: { fast: 15, normal: 20, slow: 30 },
      coachHours: 0.5,
      tags: ["SPK_P3"]
    });
  }

  return nodes;
}

// 6. Phát sinh 12 Bài Full Mock Test Cuối Khóa
function generateAllMockTestNodes() {
  const nodes = [];
  for (let i = 1; i <= 12; i++) {
    nodes.push({
      id: `S4_MOCK_TEST_${String(i).padStart(2, '0')}`,
      stage: "S4",
      title: `Full Mock Test #${i}: Cambridge 21 & Recent Actual Test (Bấm giờ thi thật)`,
      domain: "MOCK_TEST",
      type: "TEST",
      url: `reading/runner-reading.html?test=cam21-test1-full`,
      duration: { fast: 120, normal: 150, slow: 180 },
      coachHours: 2.0,
      tags: ["MOCK_TEST_FULL"]
    });
  }
  return nodes;
}

// =========================================================================
// TỔNG HỢP TOÀN BỘ CHUỖI ĐỐT SỐNG MASTER VÀO 1 MẢNG DUY NHẤT (~858 BÀI)
// =========================================================================
export const MASTER_CURRICULUM_SYSTEM = [
  ...STAGE_1_NODES,
  ...STAGE_2_NODES,
  ...generateAllReadingNodes(),
  ...generateAllListeningNodes(),
  ...generateAllWritingT1Nodes(),
  ...generateAllWritingT2Nodes(),
  ...generateAllSpeakingNodes(),
  ...generateAllMockTestNodes()
];

// Hàm tiện ích tra cứu
export function getNodeById(nodeId) {
  return MASTER_CURRICULUM_SYSTEM.find(n => n.id === nodeId) || null;
}

export function getNodesByStage(stage) {
  return MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === stage);
}

export function getNodesByDomain(domain) {
  return MASTER_CURRICULUM_SYSTEM.filter(n => n.domain === domain);
}

export function getMasterCurriculumStats() {
  return {
    totalNodes: MASTER_CURRICULUM_SYSTEM.length,
    stages: {
      S1: MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === 'S1').length,
      S2: MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === 'S2').length,
      S3: MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === 'S3').length,
      S4: MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === 'S4').length
    }
  };
}
