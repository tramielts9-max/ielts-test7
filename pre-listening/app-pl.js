/**
 * pre-listening/app-pl.js
 * BỘ ĐIỀU KHIỂN DANH SÁCH BÀI NGHE THEO LEVEL CEFR DUOLINGO 3D
 */

import { initDB, getAllSubmissions } from './db-pl.js';
import { initModal, openModal } from './modal-pl.js';
import { exportReport } from './export-pl.js';

let listeningData = {};
let currentLevel = 'A1';
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

async function start() {
  await initDB();
  initModal(() => renderLessons());

  // Đọc dữ liệu từ file data-pl.json
  try {
    const res = await fetch('./data-pl.json');
    listeningData = await res.json();
  } catch (err) {
    console.error("Lỗi đọc data-pl.json:", err);
  }

  buildLevelTabs();
  document.getElementById('searchInput').addEventListener('input', () => renderLessons());
  window.exportSummaryPL = exportReport;
  window.openSubmitModalPL = (id, title) => openModal(id, title, currentLevel);
}

function buildLevelTabs() {
  const container = document.getElementById('level-container');
  container.innerHTML = '';

  LEVELS.forEach(lvl => {
    const btn = document.createElement('button');
    const isActive = lvl === currentLevel;
    btn.className = `pl-level-btn ${isActive ? 'active' : ''}`;
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
  const lessons = listeningData[currentLevel] || [];

  const allSubs = await getAllSubmissions();
  const subMap = new Map(allSubs.map(s => [s.id, s]));

  let completedCount = 0;
  let filtered = [];

  lessons.forEach((l, idx) => {
    const id = `listening_${currentLevel}_${idx}`;
    const sub = subMap.get(id);
    if (sub) completedCount++;
    if (l.title.toLowerCase().includes(search)) {
      filtered.push({ ...l, id, sub, index: idx + 1 });
    }
  });

  document.getElementById('progress-badge').innerText = `${completedCount}/${lessons.length} Đã nộp`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); font-weight: 800; font-size: 15px; background: #FFFFFF; border-radius: 20px; border: 2px dashed var(--border-color);">
        🔍 Không tìm thấy bài tập nào phù hợp!
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isDone = !!item.sub;
    const scorePct = isDone && item.sub.total > 0 ? Math.round((item.sub.correct / item.sub.total) * 100) : 0;
    
    return `
      <div class="pl-lesson-card ${isDone ? 'is-done' : ''}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span class="pl-card-tag" style="background: ${isDone ? '#DCFCE7' : '#F1ECE6'}; color: ${isDone ? '#166534' : '#475569'};">
              Bài ${item.index} • ${currentLevel}
            </span>
            ${isDone 
              ? `<span style="font-size: 13px; font-weight: 900; color: #166534; display: flex; align-items: center; gap: 4px;">
                   <i class="fa-solid fa-circle-check"></i> ${item.sub.correct}/${item.sub.total} (${scorePct}%)
                 </span>` 
              : `<span style="font-size: 12.5px; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                   <i class="fa-regular fa-clock"></i> Chưa làm
                 </span>`
            }
          </div>

          <h4 class="pl-card-title">
            ${item.title}
          </h4>
        </div>

        <div style="padding-top: 14px; border-top: 2px dashed var(--border-color); display: flex; gap: 8px; align-items: center;">
          <a href="${item.url}" target="_blank" class="btn-3d btn-3d-white" style="flex: 1; padding: 10px 14px; font-size: 13px;">
            Làm bài <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 11px;"></i>
          </a>
          <button onclick="window.openSubmitModalPL('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="btn-3d ${isDone ? 'btn-3d-green' : 'btn-3d-red'}" style="flex: 1; padding: 10px 14px; font-size: 13px;">
            <i class="fa-solid ${isDone ? 'fa-pen-to-square' : 'fa-upload'}"></i> ${isDone ? 'Sửa điểm' : 'Nộp bài'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', start);
