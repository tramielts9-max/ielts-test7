/**
 * pre-listening/modal-pl.js
 * ĐIỀU KHIỂN POPUP DÁN ẢNH BẰNG CHỨNG (CTRL + V) DUOLINGO STYLE
 */

import { getSubmission, saveSubmission } from './db-pl.js';

let activeLessonId = null;
let currentLevel = 'A1';
let tempWrongImages = [];
let tempFullImage = null;
let onSaveCallback = null;
let currentPasteTarget = 'wrong';

export function initModal(onSaved) {
  onSaveCallback = onSaved;

  // Lắng nghe chọn file truyền thống
  document.getElementById('mWrongImgs').addEventListener('change', (e) => {
    handleFileSelect(Array.from(e.target.files), 'wrong');
  });

  document.getElementById('mFullImg').addEventListener('change', (e) => {
    if (e.target.files[0]) {
      handleFileSelect([e.target.files[0]], 'full');
    }
  });

  const zoneWrong = document.getElementById('pasteZoneWrong');
  const zoneFull = document.getElementById('pasteZoneFull');

  zoneWrong.addEventListener('click', () => setPasteTarget('wrong'));
  zoneFull.addEventListener('click', () => setPasteTarget('full'));

  // LẮNG NGHE CTRL + V TOÀN CỤC KHI MODAL MỞ
  window.addEventListener('paste', (e) => {
    const modal = document.getElementById('submitModal');
    if (modal.classList.contains('hidden')) return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let foundImage = false;

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        foundImage = true;
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          if (currentPasteTarget === 'wrong') {
            tempWrongImages.push(event.target.result);
            renderWrongPreview();
          } else {
            tempFullImage = event.target.result;
            renderFullPreview();
          }
        };
        reader.readAsDataURL(blob);
      }
    }

    if (foundImage) {
      e.preventDefault();
    }
  });

  window.removeWrongImgPL = (idx) => {
    tempWrongImages.splice(idx, 1);
    renderWrongPreview();
  };

  window.removeFullImgPL = () => {
    tempFullImage = null;
    renderFullPreview();
  };

  window.closeModalPL = () => closeModal();
  window.submitFormPL = () => handleSave();
}

function setPasteTarget(target) {
  currentPasteTarget = target;
  const zoneWrong = document.getElementById('pasteZoneWrong');
  const zoneFull = document.getElementById('pasteZoneFull');

  if (target === 'wrong') {
    zoneWrong.classList.add('active-paste');
    zoneFull.classList.remove('active-paste');
  } else {
    zoneFull.classList.add('active-paste');
    zoneWrong.classList.remove('active-paste');
  }
}

function handleFileSelect(files, target) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'wrong') {
        tempWrongImages.push(event.target.result);
        renderWrongPreview();
      } else {
        tempFullImage = event.target.result;
        renderFullPreview();
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function openModal(id, title, level) {
  activeLessonId = id;
  currentLevel = level;
  document.getElementById('mTitle').innerText = title;
  document.getElementById('mLevel').innerText = `LISTENING - ${level}`;

  // Reset form
  document.getElementById('mCorrect').value = '';
  document.getElementById('mTotal').value = '';
  document.getElementById('mWrongList').value = '';
  document.getElementById('mWrongImgs').value = '';
  document.getElementById('mFullImg').value = '';
  document.getElementById('previewWrong').innerHTML = '';
  document.getElementById('previewFull').innerHTML = '';
  tempWrongImages = [];
  tempFullImage = null;

  setPasteTarget('full');

  const existing = await getSubmission(id);
  if (existing) {
    document.getElementById('mCorrect').value = existing.correct;
    document.getElementById('mTotal').value = existing.total;
    document.getElementById('mWrongList').value = existing.wrongNotes || '';
    if (existing.fullProof) {
      tempFullImage = existing.fullProof;
      renderFullPreview();
    }
    if (existing.wrongProofs && existing.wrongProofs.length > 0) {
      tempWrongImages = existing.wrongProofs;
      renderWrongPreview();
    }
  }

  document.getElementById('submitModal').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('submitModal').classList.add('hidden');
  activeLessonId = null;
}

function renderWrongPreview() {
  const container = document.getElementById('previewWrong');
  container.innerHTML = tempWrongImages.map((src, idx) => `
    <div style="position: relative; width: 68px; height: 68px; border-radius: 12px; border: 2px solid var(--border-color); overflow: hidden; background: #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
      <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">
      <button onclick="window.removeWrongImgPL(${idx})" style="position: absolute; top: 0; right: 0; background: #DC2626; color: white; border: none; width: 20px; height: 20px; font-size: 11px; font-weight: 900; cursor: pointer; border-bottom-left-radius: 6px;">&times;</button>
    </div>
  `).join('');
}

function renderFullPreview() {
  const container = document.getElementById('previewFull');
  if (!tempFullImage) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div style="position: relative; display: inline-block; border: 2.5px solid var(--border-color); border-bottom: 4px solid var(--border-shadow); border-radius: 14px; overflow: hidden; margin-top: 8px; background: #FFFFFF;">
      <img src="${tempFullImage}" style="height: 120px; object-fit: contain; background: #FAF7F2;">
      <button onclick="window.removeFullImgPL()" style="position: absolute; top: 4px; right: 4px; background: #DC2626; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 13px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
    </div>
  `;
}

async function handleSave() {
  const correct = document.getElementById('mCorrect').value.trim();
  const total = document.getElementById('mTotal').value.trim();
  const wrongNotes = document.getElementById('mWrongList').value.trim();

  if (correct === '' || total === '') {
    alert("⚠️ Vui lòng nhập số câu đúng và tổng số câu!");
    return;
  }
  if (!tempFullImage) {
    alert("⚠️ Bắt buộc phải tải hoặc dán (Ctrl+V) ảnh chụp FULL màn hình kết quả làm bài!");
    return;
  }

  const submission = {
    id: activeLessonId,
    skill: "listening",
    level: currentLevel,
    correct: parseInt(correct, 10),
    total: parseInt(total, 10),
    wrongNotes: wrongNotes || 'Không có',
    wrongProofs: tempWrongImages,
    fullProof: tempFullImage,
    timestamp: new Date().toLocaleString("vi-VN")
  };

  await saveSubmission(submission);
  closeModal();
  if (onSaveCallback) onSaveCallback();
}
