// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const wheelHub = document.getElementById("wheelHub");
const spinInstruction = document.getElementById("spinInstruction");

const entriesTextarea = document.getElementById("entriesTextarea");
const entriesCountBadge = document.getElementById("entriesCountBadge");
const resultsCountBadge = document.getElementById("resultsCountBadge");
const resultsList = document.getElementById("resultsList");
const clearResultsBtn = document.getElementById("clearResultsBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const sortBtn = document.getElementById("sortBtn");
const paletteSelect = document.getElementById("paletteSelect");

const secretRigBtn = document.getElementById("secretRigBtn");
const rigIndicatorDot = document.getElementById("rigIndicatorDot");
const rigToggleCheckbox = document.getElementById("rigToggleCheckbox");
const rigFormControls = document.getElementById("rigFormControls");
const rigModeSelect = document.getElementById("rigModeSelect");
const rigTargetSelect = document.getElementById("rigTargetSelect");

const soundToggleBtn = document.getElementById("soundToggleBtn");
const soundIcon = document.getElementById("soundIcon");
const tickAudio = document.getElementById("tickAudio");

const winnerModal = document.getElementById("winnerModal");
const winnerNameDisplay = document.getElementById("winnerNameDisplay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const closeDialogBtn = document.getElementById("closeDialogBtn");
const removeWinnerBtn = document.getElementById("removeWinnerBtn");
const modalBackdrop = document.getElementById("modalBackdrop");

// State
let entries = ['Ali', 'Beatriz', 'Charles', 'Diya', 'Eric', 'Fatima', 'Gabriel', 'Hanna'];
let results = [];
let isSpinning = false;
let currentAngle = 0; // Radians
let soundEnabled = false;

// Color Palettes
const palettes = {
    classic: ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ca8a04', '#db2777'],
    neon: ['#ff0055', '#00ffff', '#00ff66', '#ffff00', '#aa00ff', '#ff6600', '#0099ff', '#ff00aa'],
    pastel: ['#fda4af', '#93c5fd', '#86efac', '#fde047', '#d8b4fe', '#67e8f9', '#fca5a5', '#c4b5fd'],
    gold: ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#78350f', '#92400e', '#fde68a', '#e1a100']
};
let activePalette = palettes.classic;

// Rigging State
let rigState = {
    enabled: false,
    mode: 'force', // 'force' or 'avoid'
    targetIndex: 0
};

// Initialize App
function init() {
    entriesTextarea.value = entries.join('\n');
    updateEntriesCount();
    populateRigDropdown();
    drawWheel();

    // Event Listeners
    entriesTextarea.addEventListener("input", onEntriesChange);
    wheelHub.addEventListener("click", spinWheel);
    canvas.addEventListener("click", spinWheel);

    // Toolbar
    shuffleBtn.addEventListener("click", () => {
        entries = entries.sort(() => Math.random() - 0.5);
        entriesTextarea.value = entries.join('\n');
        populateRigDropdown();
        drawWheel();
    });

    sortBtn.addEventListener("click", () => {
        entries = entries.sort((a, b) => a.localeCompare(b));
        entriesTextarea.value = entries.join('\n');
        populateRigDropdown();
        drawWheel();
    });

    paletteSelect.addEventListener("change", (e) => {
        activePalette = palettes[e.target.value] || palettes.classic;
        drawWheel();
    });

    clearResultsBtn.addEventListener("click", () => {
        results = [];
        updateResultsUI();
    });

    // Sound
    soundToggleBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundIcon.className = soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
    });

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    secretRigBtn.addEventListener("click", () => switchTab('rigging'));

    // Rigging Controls
    rigToggleCheckbox.addEventListener("change", (e) => {
        rigState.enabled = e.target.checked;
        rigFormControls.className = rigState.enabled ? "rig-form active" : "rig-form";
        rigIndicatorDot.className = rigState.enabled ? "status-dot active" : "status-dot";
    });

    rigModeSelect.addEventListener("change", (e) => {
        rigState.mode = e.target.value;
    });

    rigTargetSelect.addEventListener("change", (e) => {
        rigState.targetIndex = parseInt(e.target.value);
    });

    // Modal buttons
    modalCloseBtn.addEventListener("click", closeModal);
    closeDialogBtn.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);
    removeWinnerBtn.addEventListener("click", () => {
        if (lastWinnerName) {
            const idx = entries.indexOf(lastWinnerName);
            if (idx > -1) {
                entries.splice(idx, 1);
                entriesTextarea.value = entries.join('\n');
                updateEntriesCount();
                populateRigDropdown();
                drawWheel();
            }
        }
        closeModal();
    });

    // Global Hotkeys
    window.addEventListener("keydown", (e) => {
        if (document.activeElement === entriesTextarea) {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                spinWheel();
            }
            return; // Don't trigger secret hotkeys while typing names
        }

        if (e.key === "Enter") {
            e.preventDefault();
            spinWheel();
        } else if (e.key.toLowerCase() === "r" && !e.ctrlKey) {
            e.preventDefault();
            switchTab('rigging');
        } else if (e.key >= "1" && e.key <= "9") {
            const idx = parseInt(e.key) - 1;
            if (idx < entries.length) {
                rigState.enabled = true;
                rigState.targetIndex = idx;
                rigToggleCheckbox.checked = true;
                rigFormControls.className = "rig-form active";
                rigIndicatorDot.className = "status-dot active";
                rigTargetSelect.value = idx.toString();
                playClickTick();
            }
        } else if (e.key === "0") {
            rigState.enabled = false;
            rigToggleCheckbox.checked = false;
            rigFormControls.className = "rig-form";
            rigIndicatorDot.className = "status-dot";
            playClickTick();
        }
    });
}

function onEntriesChange() {
    const raw = entriesTextarea.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    entries = raw.length > 0 ? raw : ['Empty'];
    updateEntriesCount();
    populateRigDropdown();
    drawWheel();
}

function updateEntriesCount() {
    entriesCountBadge.textContent = entries.length;
}

function populateRigDropdown() {
    const currVal = rigTargetSelect.value;
    rigTargetSelect.innerHTML = "";
    entries.forEach((name, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = `#${idx + 1}: ${name}`;
        rigTargetSelect.appendChild(opt);
    });
    if (currVal < entries.length) {
        rigTargetSelect.value = currVal;
    } else {
        rigTargetSelect.value = "0";
        rigState.targetIndex = 0;
    }
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.toggle("active", pane.id === `${tabId}Pane`);
    });
}

// Drawing Wheel
function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 10;
    const n = entries.length;
    const sliceAngle = (2 * Math.PI) / n;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    for (let i = 0; i < n; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // Draw Slice
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        const colorIdx = i % activePalette.length;
        ctx.fillStyle = activePalette[colorIdx];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#12141d";
        ctx.stroke();

        // Draw Text
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        
        // Dynamic font size
        let fontSize = Math.max(16, Math.min(32, Math.floor(220 / Math.sqrt(n))));
        ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
        
        const text = entries[i];
        const maxLen = Math.floor(radius * 0.75);
        ctx.fillText(text, radius - 25, 0, maxLen);
        ctx.restore();
    }

    ctx.restore();
}

// Spin Physics & Rigging
let lastWinnerName = "";

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    spinInstruction.style.opacity = "0";
    wheelHub.style.pointerEvents = "none";

    const n = entries.length;
    const sliceAngle = (2 * Math.PI) / n;

    // Determine winning slice index
    let winningIndex = Math.floor(Math.random() * n);

    if (rigState.enabled) {
        if (rigState.mode === 'force') {
            winningIndex = Math.min(rigState.targetIndex, n - 1);
        } else if (rigState.mode === 'avoid' && n > 1) {
            let possible = [];
            for (let i = 0; i < n; i++) {
                if (i !== rigState.targetIndex) possible.push(i);
            }
            winningIndex = possible[Math.floor(Math.random() * possible.length)];
        }
    }

    // Pointer is fixed at angle 0 (right side pointing left).
    // In canvas rotation `currentAngle + finalAngle`, slice `winningIndex` center angle is:
    // `winningCenter = winningIndex * sliceAngle + sliceAngle / 2`.
    // We want `(currentAngle + finalRotation + winningCenter) % (2*PI) === 0` (or `2*PI`).
    // Let's calculate the target offset.
    const winningCenter = winningIndex * sliceAngle + sliceAngle / 2;
    const revolutions = 5 * (2 * Math.PI); // 5 full spins
    
    // We want `(currentAngle + finalRotation + winningCenter) = revolutions + k * 2*PI`.
    // Let's compute exact target finalAngle.
    const currentMod = currentAngle % (2 * Math.PI);
    let neededRotation = (2 * Math.PI - (currentMod + winningCenter) % (2 * Math.PI)) % (2 * Math.PI);
    
    // Add small random jitter inside the slice (± 35% of sliceAngle) so it looks 100% natural!
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.7);
    const targetAngleChange = revolutions + neededRotation + jitter;

    const duration = 4500; // 4.5s
    const startAngle = currentAngle;
    const startTime = performance.now();
    let lastTickAngle = currentAngle;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Quintic ease out for realistic carnival wheel friction
        const easeOut = 1 - Math.pow(1 - progress, 5);
        currentAngle = startAngle + targetAngleChange * easeOut;

        drawWheel();

        // Sound tick on slice boundaries
        if (Math.floor(currentAngle / sliceAngle) !== Math.floor(lastTickAngle / sliceAngle)) {
            playTick();
            lastTickAngle = currentAngle;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            wheelHub.style.pointerEvents = "auto";
            spinInstruction.style.opacity = "1";
            
            // Normalize angle
            currentAngle = currentAngle % (2 * Math.PI);
            
            // Celebrate
            lastWinnerName = entries[winningIndex];
            recordResult(lastWinnerName);
            showWinnerModal(lastWinnerName);
        }
    }

    requestAnimationFrame(animate);
}

function playTick() {
    if (!soundEnabled) return;
    tickAudio.currentTime = 0;
    tickAudio.play().catch(() => {});
}

function playClickTick() {
    playTick();
}

function recordResult(winner) {
    results.unshift(winner);
    resultsCountBadge.textContent = results.length;
    updateResultsUI();
}

function updateResultsUI() {
    if (results.length === 0) {
        resultsList.innerHTML = `<li class="empty-state">No winners yet. Spin the wheel!</li>`;
        return;
    }
    resultsList.innerHTML = "";
    results.forEach((r, idx) => {
        const li = document.createElement("li");
        li.className = "result-item";
        li.innerHTML = `<span><i class="fa-solid fa-trophy" style="color:var(--accent);margin-right:8px;"></i> ${r}</span> <small style="color:var(--text-muted)">#${results.length - idx}</small>`;
        resultsList.appendChild(li);
    });
}

function showWinnerModal(winner) {
    winnerNameDisplay.textContent = winner;
    winnerModal.classList.add("open");

    // Confetti
    if (typeof confetti === "function") {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function closeModal() {
    winnerModal.classList.remove("open");
}

// Run
init();
