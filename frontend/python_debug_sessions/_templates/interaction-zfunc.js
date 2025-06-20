/* ─ util ──────────────────────────────────────────────── */
const okStruct = (s, z) =>
    typeof s === 'string' &&
    Array.isArray(z) &&
    s.length === z.length;

function qs(sel) {
    return document.querySelector(sel);
}

function qsa(sel) {
    return document.querySelectorAll(sel);
}

function cell(row, col) {
    return qs(`#zf-table tr[data-row="${row}"] td[data-col="${col}"]`);
}

function wipeArcs() {
    qsa('svg[id^="zf-arc"]').forEach(x => x.remove());
}

function clearHL() {
    qsa(
        '#zf-table td.zf-prefix, ' +
        '#zf-table td.zf-substr, ' +
        '#zf-table td.zf-current, ' +
        '#zf-table td.zf-overlap'
    ).forEach(td =>
        td.className = td.className.replace(/\bzf-\w+\b/g, '').trim()
    );
    wipeArcs();
}

/* ─ arcs ──────────────────────────────────────────────── */
function drawArc(startCol, endCol, row, height, id, container, color = '#60a5fa') {
    if (startCol === void 0 || endCol === void 0) return;
    const a = cell(row, startCol).getBoundingClientRect();
    const b = cell(row, endCol).getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - c.left;
    const x2 = b.left + b.width / 2 - c.left;
    const y = a.top - c.top - 8;
    const mid = (x1 + x2) / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = id;
    Object.assign(svg.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        overflow: 'visible'
    });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1} ${y} Q ${mid} ${y - height} ${x2} ${y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    container.appendChild(svg);
}

/* ─ highlight logic ───────────────────────────────────── */
function highlight(i, s, z, container) {
    clearHL();
    const v = z[i];
    if (!v) return;

    const preEnd = v - 1;
    const subStart = i;
    const subEnd = i + v - 1;

    // prefix [0…preEnd]
    for (let j = 0; j <= preEnd; j++) {
        cell(0, j).classList.add('zf-prefix');
    }
    // substring [i…i+v-1] + overlap
    for (let j = subStart; j <= subEnd; j++) {
        const td = cell(0, j);
        if (td.classList.contains('zf-prefix')) {
            td.classList.remove('zf-prefix');
            td.classList.add('zf-overlap');
        } else {
            td.classList.add('zf-substr');
        }
    }
    // current z[i]
    cell(1, i).classList.add('zf-current');

    // draw arcs (одинаковая высота)
    const h = 35;
    wipeArcs();
    drawArc(0, preEnd, 0, h, 'zf-arc-prefix', container, '#4ade80');
    drawArc(subStart, subEnd, 0, h, 'zf-arc-substr', container, '#60a5fa');
}

/* ─ main render ───────────────────────────────────────── */
function renderZF() {
    const vars = debugLog[currentStep]?.variables;
    const box = qs('#zf-visualization');
    if (!box) return;
    if (!vars) {
        box.innerHTML = '';
        return;
    }

    const s = searchVariableRecursively(vars, sVar);
    const z = searchVariableRecursively(vars, zVar);
    if (!okStruct(s, z)) {
        box.innerHTML = 'String/Z-array invalid.';
        return;
    }
    if (s.length > 60) {
        box.innerHTML = 'Too long to visualise.';
        return;
    }

    box.innerHTML = '';
    box.style.position = 'relative';

    const tbl = document.createElement('table');
    tbl.id = 'zf-table';

    // row0 – символы
    const tr0 = document.createElement('tr');
    tr0.dataset.row = '0';
    [...s].forEach((ch, j) => {
        const td = document.createElement('td');
        td.dataset.col = j;
        td.textContent = ch;
        td.onmouseenter = () => highlight(j, s, z, box);
        td.onmouseleave = clearHL;
        tr0.appendChild(td);
    });
    tbl.appendChild(tr0);

    // row1 – z-values
    const tr1 = document.createElement('tr');
    tr1.dataset.row = '1';
    z.forEach((val, j) => {
        const td = document.createElement('td');
        td.dataset.col = j;
        td.textContent = val;
        td.onmouseenter = () => highlight(j, s, z, box);
        td.onmouseleave = clearHL;
        tr1.appendChild(td);
    });
    tbl.appendChild(tr1);

    box.appendChild(tbl);
}

/* ─ hook into step ────────────────────────────────────── */
(() => {
    const orig = displayStep;
    displayStep = function (step) {
        orig(step);
        renderZF();
    };
})();
