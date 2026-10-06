const DB_NAME = "PreListeningHomeworkDB";
const STORE_NAME = "ListeningSubmissions";
let db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_NAME)) {
        d.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e);
  });
}

export function getSubmission(id) {
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export function saveSubmission(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data);
    req.onsuccess = () => {
      try {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} - ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
        const sName = localStorage.getItem('ielts_student_name') || 'Học viên';
        const sEmail = localStorage.getItem('ielts_student_email') || '';

        const attemptSnapshot = {
          id: "attempt_pl_" + Date.now(),
          timestamp: timeStr,
          testTitle: `Pre-Listening: ${data.title || data.id}`,
          studentName: sName,
          studentEmail: sEmail,
          score: `${data.correct || 0}/${data.total || 0}`,
          timeSpent: "N/A",
          details: `Đã nộp bài mức độ ${data.level || ''}. Điểm đạt: ${data.correct || 0}/${data.total || 0}`,
          pageUrl: "pre-listening/index-pl.html"
        };

        // 1. Lưu LocalStorage
        const localHist = JSON.parse(localStorage.getItem('ielts_local_history') || '[]');
        localHist.unshift(attemptSnapshot);
        localStorage.setItem('ielts_local_history', JSON.stringify(localHist));

        // 2. Bắn lên Google Drive
        fetch("https://script.google.com/macros/s/AKfycbyNErQQFdciAQM0k9KUrACtpX7rxKkopjChYAC2Ubwj5MGzFOeekDEGs8C1n7P9cNR6vg/exec", {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "save_attempt", attempt: attemptSnapshot })
        }).catch(() => {});
      } catch (err) {}

      resolve();
    };
    req.onerror = (e) => reject(e);
  });
}

export function getAllSubmissions() {
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}
