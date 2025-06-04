function check1DArrayStructure(arr, n) {
    if (!Array.isArray(arr) || arr.length !== n) return false;
    return true;
}

function computeDPPath(i, j, parentData) {
    let pathCells = [];
    let curRow = i, curCol = j;
    while (true) {
        pathCells.push({ row: curRow, col: curCol });

        newColl = parentData[curCol];

        if (newColl < 0) break;

        if (newColl == 1 || newColl == 0) {
            pathCells.push({ row: curRow, col: newColl });
            break;
        }

        curCol = newColl;
    }

    return pathCells;
}

function highlightDPPathCell(i, j, dpData, parentData) {
    if (dpData[j] === undefined || dpData[j] === null) return;
    const pathCells = computeDPPath(i, j, parentData);
    pathCells.forEach(cell => {
        const td = document.querySelector(
            `#dp-table tr:nth-child(${cell.row + 1}) td:nth-child(${cell.col + 1})`
        );
        if (td) {
            td.classList.add('dp-highlight');
        }
    });
}

function clearDPHighlight() {
    const highlighted = document.querySelectorAll('#dp-table td.dp-highlight');
    highlighted.forEach(cell => cell.classList.remove('dp-highlight'));
}

function renderDPVisualization() {
    const currentVars = debugLog[currentStep] && debugLog[currentStep].variables;
    const container = document.getElementById('dp-visualization');
    if (!currentVars || !container) {
        if (container) container.innerHTML = '';
        return;
    }
    const dpData = searchVariableRecursively(currentVars, dpVar);
    const parentData = searchVariableRecursively(currentVars, parentVar);
    if (dpData === undefined || parentData === undefined) {
        container.innerHTML = 'Таблица DP не определена (dp или parent отсутствуют).';
        return;
    }
    if (!Array.isArray(dpData) || dpData.length === 0) {
        container.innerHTML = 'Таблица DP не определена (dp не является корректным массивом).';
        return;
    }
    const n = dpData.length;
    if (n > 30) {
        container.innerHTML = 'Размер таблицы превышает 30 (текущий размер: '+ n +').';
        return;
    }
    if (!check1DArrayStructure(dpData, n) || !check1DArrayStructure(parentData, n)) {
        // console.log(dpData, parentData);
        // console.log(n);
        container.innerHTML = 'Таблица DP не определена (dp и parent не совпадают по размерам).';
        return;
    }
    container.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'dp-table';
    for (let i = 0; i < 1; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < n; j++) {
            const td = document.createElement('td');
            td.dataset.row = i;
            td.dataset.col = j;
            td.textContent = (dpData[j] !== undefined && dpData[j] !== null) ? dpData[j] : '';
            td.addEventListener('mouseenter', function() {
                highlightDPPathCell(i, j, dpData, parentData);
            });
            td.addEventListener('mouseleave', function() {
                clearDPHighlight();
            });
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

(function() {
    const originalDisplayStep = displayStep;
    displayStep = function(step) {
        originalDisplayStep(step);
        renderDPVisualization();
    };
})();
