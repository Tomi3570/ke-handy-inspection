/* ============================================
   Handy Inspection Prototype — App Logic
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // State
  // ============================================
  const state = {
    currentScreen: 'intro',
    cameraStream: null,
    scanTimer: null,
    isCameraReady: false,
  };

  // ============================================
  // Element refs
  // ============================================
  const screens = document.querySelectorAll('.screen');
  const statusTime = document.getElementById('status-time');

  // ============================================
  // Status bar clock
  // ============================================
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    statusTime.textContent = `${h}:${m}`;
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ============================================
  // Screen navigation
  // ============================================
  function gotoScreen(targetId) {
    const current = document.querySelector(`.screen[data-screen="${state.currentScreen}"]`);
    const target = document.querySelector(`.screen[data-screen="${targetId}"]`);

    if (!target) return;

    // Exit current
    if (current) {
      current.classList.remove('active');
      current.classList.add('exiting');
      setTimeout(() => current.classList.remove('exiting'), 500);
    }

    // Enter target
    setTimeout(() => {
      target.classList.add('active');
      state.currentScreen = targetId;
      onEnterScreen(targetId);
    }, 50);
  }

  function onEnterScreen(id) {
    switch (id) {
      case 'drawing-scan':
        startCamera('cam-feed-drawing');
        resetDrawingScan();
        break;
      case 'list-confirm':
        stopCamera();
        break;
      case 'object-scan-prep':
        startCamera('cam-feed-object');
        break;
      case 'object-scan-active':
        startCamera('cam-feed-active');
        startObjectScan();
        break;
      case 'results':
        stopCamera();
        break;
      case 'report':
        stopCamera();
        setReportDateTime();
        break;
      case 'intro':
        stopCamera();
        break;
    }
  }

  // ============================================
  // Camera (getUserMedia)
  // ============================================
  async function startCamera(videoId) {
    const video = document.getElementById(videoId);
    if (!video) return;

    // If already streaming to this video, skip
    if (state.cameraStream && video.srcObject === state.cameraStream) return;

    // Stop previous
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // No camera API — show fallback
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      state.cameraStream = stream;
      state.isCameraReady = true;
      video.srcObject = stream;
      video.setAttribute('data-active', 'true');
      // Mark viewport as having active cam
      video.closest('.scan-viewport')?.setAttribute('data-cam', 'active');
    } catch (err) {
      // Permission denied or not available
      console.warn('Camera unavailable:', err.message);
      state.isCameraReady = false;
    }
  }

  function stopCamera() {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((t) => t.stop());
      state.cameraStream = null;
    }
    document.querySelectorAll('.cam-feed').forEach((v) => {
      v.srcObject = null;
      v.removeAttribute('data-active');
      v.closest('.scan-viewport')?.removeAttribute('data-cam');
    });
  }

  // ============================================
  // Drawing scan: capture flash + processing
  // ============================================
  function resetDrawingScan() {
    const overlay = document.getElementById('drawing-detection-overlay');
    overlay?.classList.remove('detected');
    document.getElementById('drawing-processing')?.classList.remove('active');
  }

  function captureDrawing() {
    // Flash
    const flash = document.getElementById('capture-flash');
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 400);

    // Detection pulse
    const overlay = document.getElementById('drawing-detection-overlay');
    overlay?.classList.add('detected');

    // Processing overlay with stepped messages
    setTimeout(() => {
      const proc = document.getElementById('drawing-processing');
      const stepEl = document.getElementById('processing-step');
      proc.classList.add('active');

      const steps = [
        '輪郭を検出',
        '台形補正中',
        'バルーンを検出',
        '寸法・公差を読み取り',
        '検査リストを生成',
      ];
      let i = 0;
      stepEl.textContent = steps[0];
      const stepTimer = setInterval(() => {
        i++;
        if (i < steps.length) {
          stepEl.textContent = steps[i];
        } else {
          clearInterval(stepTimer);
          proc.classList.remove('active');
          gotoScreen('list-confirm');
        }
      }, 700);
    }, 500);
  }

  // ============================================
  // Object scan: animated progression
  // ============================================
  const SCAN_TIMELINE = [
    { time: 0,    progress: 15, count: 0, message: 'ワークの周囲をゆっくりスキャンしてください', acquired: [], ng: [] },
    { time: 1500, progress: 32, count: 0, message: '上面を取得しています',                       acquired: [], ng: [] },
    { time: 3000, progress: 48, count: 1, message: '①外幅 を取得しました',                       acquired: [1], ng: [] },
    { time: 4500, progress: 62, count: 2, message: '②高さ を取得しました',                       acquired: [1, 2], ng: [] },
    { time: 6000, progress: 75, count: 3, message: '③段差：上面と側面が見える角度にしてください', acquired: [1, 2], ng: [] },
    { time: 7500, progress: 88, count: 3, message: '③段差 NG候補：公差を超過しています',         acquired: [1, 2], ng: [3] },
    { time: 9000, progress: 95, count: 3, message: '④穴位置：正面側をもう少し近づけてください',  acquired: [1, 2], ng: [3] },
    { time: 10500, progress: 100, count: 3, message: 'スキャン完了。④穴位置は未取得です',       acquired: [1, 2], ng: [3], done: true },
  ];

  function startObjectScan() {
    if (state.scanTimer) {
      state.scanTimer.forEach(clearTimeout);
    }
    state.scanTimer = [];

    const progressText = document.getElementById('hud-progress-text');
    const progressBar = document.getElementById('hud-bar-fill');
    const itemsCount = document.getElementById('hud-items-count');
    const guide = document.getElementById('hud-guide');
    const finishBtn = document.getElementById('btn-finish-scan');
    const finishLabel = finishBtn?.querySelector('.btn-label');

    // Reset all chips
    document.querySelectorAll('.hud-chip').forEach((c) => {
      c.classList.remove('acquired', 'ng');
    });

    finishBtn.disabled = true;
    finishLabel.textContent = 'スキャン中...';

    SCAN_TIMELINE.forEach((step) => {
      const t = setTimeout(() => {
        progressText.textContent = `${step.progress}%`;
        progressBar.style.width = `${step.progress}%`;
        itemsCount.textContent = `${step.count}/4`;
        guide.textContent = step.message;

        // Update chips
        document.querySelectorAll('.hud-chip').forEach((chip) => {
          const n = parseInt(chip.getAttribute('data-chip'), 10);
          chip.classList.remove('acquired', 'ng');
          if (step.ng.includes(n)) {
            chip.classList.add('ng');
          } else if (step.acquired.includes(n)) {
            chip.classList.add('acquired');
          }
        });

        if (step.done) {
          finishBtn.disabled = false;
          finishLabel.textContent = '結果を確認 →';
        }
      }, step.time);
      state.scanTimer.push(t);
    });
  }

  function stopObjectScan() {
    if (state.scanTimer) {
      state.scanTimer.forEach(clearTimeout);
      state.scanTimer = [];
    }
  }

  // ============================================
  // Report datetime
  // ============================================
  function setReportDateTime() {
    const el = document.getElementById('report-datetime');
    if (!el) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  // ============================================
  // Event delegation
  // ============================================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const target = btn.getAttribute('data-target');

    switch (action) {
      case 'goto':
        if (target === 'object-scan-active') stopObjectScan();
        gotoScreen(target);
        break;
      case 'back':
        stopObjectScan();
        gotoScreen(target);
        break;
      case 'capture-drawing':
        captureDrawing();
        break;
      case 'simulate-drawing':
        // Skip camera, go directly to capture
        captureDrawing();
        break;
      case 'simulate-object':
        // Just hide the fallback; scan proceeds anyway
        btn.closest('.cam-fallback').style.display = 'none';
        break;
    }
  });

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    stopCamera();
    stopObjectScan();
  });

})();
