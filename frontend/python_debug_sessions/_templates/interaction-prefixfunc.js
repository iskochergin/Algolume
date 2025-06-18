/*  ░░  Prefix-function visualiser ─ компактная версия (v2) ░░  */

/* ── util ──────────────────────────────────────────────── */
const okStruct = (s, p) => typeof s === 'string' && Array.isArray(p) && s.length === p.length;

function qs(sel) {
    return document.querySelector(sel);
}

function qsa(sel) {
    return document.querySelectorAll(sel);
}

function cell(row, col) {
    return qs(`#pf-table tr[data-row="${row}"] td[data-col="${col}"]`);
}

function wipeArcs() {
    qsa('svg[id^="pf-arc"]').forEach(x => x.remove());
}

function clearHL() {
    qsa('#pf-table td.pf-prefix, #pf-table td.pf-suffix, #pf-table td.pf-current, #pf-table td.pf-overlap')
        .forEach(td => td.className = td.className.replace(/\bpf-\w+\b/g, '').trim());
    wipeArcs();
}

/* ── arcs ──────────────────────────────────────────────── */
function drawArc(startCol, endCol, row, height, id, container, color = '#60a5fa') {
    if (startCol === void 0 || endCol === void 0) return;
    const sRect = cell(row, startCol).getBoundingClientRect();
    const eRect = cell(row, endCol).getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const x1 = sRect.left + sRect.width / 2 - cRect.left;
    const x2 = eRect.left + eRect.width / 2 - cRect.left;
    const y = sRect.top - cRect.top - 8;
    const mid = (x1 + x2) / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = id;
    Object.assign(svg.style, {position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'visible'});
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1} ${y} Q ${mid} ${y - height} ${x2} ${y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    container.appendChild(svg);
}

/* ── highlight logic ───────────────────────────────────── */
function highlight(idx, s, p, cont) {
    clearHL();
    const k = p[idx];
    if (!k) return;

    const preEnd = k - 1,
        sufBeg = idx - k + 1;

    /* prefix */
    for (let i = 0; i <= preEnd; i++) {
        cell(0, i).classList.add('pf-prefix');
    }
    /* suffix + overlap */
    for (let i = sufBeg; i <= idx; i++) {
        const td = cell(0, i);
        if (td.classList.contains('pf-prefix')) {
            td.classList.remove('pf-prefix');
            td.classList.add('pf-overlap');
        } else td.classList.add('pf-suffix');
    }
    /* current p[i] */
    cell(1, idx).classList.add('pf-current');

    /* arcs */
    wipeArcs();
    drawArc(0, preEnd, 0, 35, 'pf-arc-prefix', cont);          // над префиксом
    drawArc(sufBeg, idx, 0, 28, 'pf-arc-suffix', cont, '#4ade80'); // над суффиксом
}

/* ── main render ───────────────────────────────────────── */
function renderPF() {
    const vars = debugLog[currentStep]?.variables;
    const box = qs('#pf-visualization');
    if (!box) return;
    if (!vars) {
        box.innerHTML = '';
        return;
    }

    const s = searchVariableRecursively(vars, sVar);
    const p = searchVariableRecursively(vars, pVar);
    if (!okStruct(s, p)) {
        box.innerHTML = 'String/P-array invalid.';
        return;
    }
    if (s.length > 60) {
        box.innerHTML = 'Too long to visualise.';
        return;
    }

    /* build table */
    box.innerHTML = '';
    box.style.position = 'relative';
    const tbl = document.createElement('table');
    tbl.id = 'pf-table';

    const rowChars = document.createElement('tr');
    rowChars.dataset.row = '0';
    [...s].forEach((ch, j) => {
        const td = document.createElement('td');
        td.dataset.col = j;
        td.textContent = ch;
        td.onmouseenter = () => highlight(j, s, p, box);
        td.onmouseleave = clearHL;
        rowChars.appendChild(td);
    });
    tbl.appendChild(rowChars);

    const rowP = document.createElement('tr');
    rowP.dataset.row = '1';
    p.forEach((v, j) => {
        const td = document.createElement('td');
        td.dataset.col = j;
        td.textContent = v;
        td.onmouseenter = () => highlight(j, s, p, box);
        td.onmouseleave = clearHL;
        rowP.appendChild(td);
    });
    tbl.appendChild(rowP);
    box.appendChild(tbl);
}

/* ── hook into global step switcher ────────────────────── */
(() => {
    const orig = displayStep;
    displayStep = function (step) {
        orig(step);
        renderPF();
    };
})();
