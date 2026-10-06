/**
 * curriculum-system/manifest-system.js
 * SỔ CÁI TỔNG HỢP TOÀN BỘ CHUỖI ĐỐT SỐNG (MASTER CURRICULUM REGISTRY)
 * Kết nối độc lập toàn bộ các phân hệ từ Mất gốc (0.0) lên 7.5+
 */

import { STAGE_1_NODES, STAGE_2_NODES } from './manifest-s1-s2-system.js';
import { STAGE_3_NODES, STAGE_4_NODES } from './manifest-s3-s4-system.js';

// TỔNG HỢP TOÀN BỘ CÁC ĐỐT SỐNG THEO TIẾN TRÌNH TUYẾN TÍNH
export const MASTER_CURRICULUM_SYSTEM = [
  ...STAGE_1_NODES,
  ...STAGE_2_NODES,
  ...STAGE_3_NODES,
  ...STAGE_4_NODES
];

// =========================================================================
// HÀM TIỆN ÍCH DÀNH CHO BỘ NÃO ENGINE & CON AI ĐIỀU PHỐI
// =========================================================================

/**
 * Lấy chi tiết một đốt sống theo mã ID
 * @param {string} nodeId - Ví dụ: 'S1_GRAM_0010'
 */
export function getNodeById(nodeId) {
  return MASTER_CURRICULUM_SYSTEM.find(n => n.id === nodeId) || null;
}

/**
 * Lấy danh sách đốt theo từng giai đoạn (S1, S2, S3, S4)
 * @param {'S1' | 'S2' | 'S3' | 'S4'} stage
 */
export function getNodesByStage(stage) {
  return MASTER_CURRICULUM_SYSTEM.filter(n => n.stage === stage);
}

/**
 * Lấy danh sách đốt theo phân hệ môn học
 * @param {string} domain - 'GRAMMAR' | 'VOCABULARY' | 'READING' | 'LISTENING' | 'WRITING_T1' | 'WRITING_T2' | 'SPEAKING'
 */
export function getNodesByDomain(domain) {
  return MASTER_CURRICULUM_SYSTEM.filter(n => n.domain === domain);
}

/**
 * Thống kê tổng số lượng bài và định mức toàn bộ kho
 */
export function getMasterCurriculumStats() {
  const totalNodes = MASTER_CURRICULUM_SYSTEM.length;
  let totalCoachHours = 0;
  let totalNormalMinutes = 0;

  MASTER_CURRICULUM_SYSTEM.forEach(n => {
    totalCoachHours += (n.coachHours || 0);
    totalNormalMinutes += (n.duration?.normal || 20);
  });

  return {
    totalNodes,
    totalSelfStudyHours: Math.round((totalNormalMinutes / 60) * 10) / 10,
    totalCoachHours: Math.round(totalCoachHours * 10) / 10,
    stages: {
      S1: STAGE_1_NODES.length,
      S2: STAGE_2_NODES.length,
      S3: STAGE_3_NODES.length,
      S4: STAGE_4_NODES.length
    }
  };
}
