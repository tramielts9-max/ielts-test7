/**
 * pre-reading/app-pr.js
 * BỘ ĐIỀU KHIỂN DANH SÁCH BÀI ĐỌC THEO LEVEL CEFR DUOLINGO 3D
 * ĐÃ BỎ 100% CÁC BIỂU TƯỢNG GÂY LỖI Ô VUÔNG
 */

import { initDB, getAllSubmissions } from './db-pr.js';
import { initModal, openModal } from './modal-pr.js';
import { exportReport } from './export-pr.js';

let readingData = {};
let currentLevel = 'A1';
const LEVELS = ["A1", "A2", "B1", "B1+", "B2", "C1"];

async function start() {
  await initDB();
  initModal(() => renderLessons());

  try {
    const res = await fetch('./data-pr.json');
    readingData = await res.json();
  } catch (err) {
    console.error("Lỗi đọc data-pr.json:", err);
  }

  buildLevelTabs();
  document.getElementById('searchInput').addEventListener('input', () => renderLessons());
  window.exportSummaryPR = exportReport;
  window.openSubmitModalPR = (id, title) => openModal(id, title, currentLevel);
}

function buildLevelTabs() {
  const container = document.getElementById('level-container');
  container.innerHTML = '';

  LEVELS.forEach(lvl => {
    const btn = document.createElement('button');
    const isActive = lvl === currentLevel;
    const lvlClass = lvl.replace('+', 'plus'); // Đổi B1+ thành lvl-B1plus
    btn.className = `pr-level-btn lvl-${lvlClass} ${isActive ? 'active' : ''}`;
    btn.innerText = lvl;
    btn.onclick = () => {
      currentLevel = lvl;
      buildLevelTabs();
    };
    container.appendChild(btn);
  });

  renderLessons();
}

async function renderLessons() {
  const container = document.getElementById('lessonList');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const lessons = readingData[currentLevel] || [];

  const allSubs = await getAllSubmissions();
  const subMap = new Map(allSubs.map(s => [s.id, s]));

  let completedCount = 0;
  let filtered = [];

  lessons.forEach((l, idx) => {
    const id = `reading_${currentLevel}_${idx}`;
    const sub = subMap.get(id);
    if (sub) completedCount++;
    if (l.title.toLowerCase().includes(search)) {
      filtered.push({ ...l, id, sub, index: idx + 1 });
    }
  });

  document.getElementById('progress-badge').innerText = `${completedCount}/${lessons.length} Đã nộp`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); font-weight: 800; font-size: 16px; background: #FFFFFF; border-radius: 22px; border: 2.5px dashed var(--border-color);">
        Không tìm thấy bài tập nào phù hợp!
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isDone = !!item.sub;
    const scorePct = isDone && item.sub.total > 0 ? Math.round((item.sub.correct / item.sub.total) * 100) : 0;
    
    return `
      <div class="pr-lesson-card ${isDone ? 'is-done' : ''}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span class="pr-card-tag" style="background: ${isDone ? '#DCFCE7' : '#F1ECE6'}; color: ${isDone ? '#166534' : '#475569'};">
              Bài ${item.index} • ${currentLevel}
            </span>
            ${isDone 
              ? `<span style="font-size: 13.5px; font-weight: 900; color: #166534;">
                   ✓ ${item.sub.correct}/${item.sub.total} (${scorePct}%)
                 </span>` 
              : `<span style="font-size: 13px; font-weight: 800; color: var(--text-muted);">
                   ● Chưa làm
                 </span>`
            }
          </div>

          <h4 class="pr-card-title">
            ${item.title}
          </h4>
        </div>

        <div style="padding-top: 16px; border-top: 2px dashed var(--border-color); display: flex; gap: 10px; align-items: center;">
          <a href="${item.url}" target="_blank" class="btn-3d btn-3d-white" style="flex: 1; padding: 11px 14px; font-size: 13.5px;">
            Làm bài →
          </a>
          <button onclick="window.openSubmitModalPR('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="btn-3d ${isDone ? 'btn-3d-green' : 'btn-3d-amber'}" style="flex: 1; padding: 11px 14px; font-size: 13.5px;">
            ${isDone ? 'Sửa điểm' : 'Nộp bài'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', start);
