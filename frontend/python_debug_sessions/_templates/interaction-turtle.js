function check2DArrayStructure(arr, n, m) {
    if (!Array.isArray(arr) || arr.length !== n) return false;
    for (let i = 0; i < n; i++) {
        if (!Array.isArray(arr[i]) || arr[i].length !== m) return false;
    }
    return true;
}

function computeDPPath(i, j, parentData) {
    let pathCells = [];
    let curRow = i, curCol = j;
    while (true) {
        if (curRow < 0 || curCol < 0) break;
        pathCells.push({ row: curRow, col: curCol });
        if ((curRow === 0 && curCol === 0) || (parentData[curRow][curCol] !== "D" && parentData[curRow][curCol] !== "R")) {
            break;
        }
        let direction = parentData[curRow][curCol];
        if (direction === 'D') {
            curRow--;
        } else if (direction === 'R') {
            curCol--;
        } else {
            break;
        }
    }
    return pathCells;
}

function highlightDPPathCell(i, j, dpData, parentData) {
    if (dpData[i][j] === undefined || dpData[i][j] === null) return;
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
    if (!Array.isArray(dpData) || dpData.length === 0 || !Array.isArray(dpData[0])) {
        container.innerHTML = 'Таблица DP не определена (dp не является корректным массивом).';
        return;
    }
    const n = dpData.length;
    const m = dpData[0].length;
    if (n > 8 || m > 8) {
        container.innerHTML = 'Размер таблицы превышает 8 (текущие размеры: ' + n + 'x' + m + ').';
        return;
    }
    if (!check2DArrayStructure(dpData, n, m) || !check2DArrayStructure(parentData, n, m)) {
        container.innerHTML = 'Таблица DP не определена (dp и parent не совпадают по размерам).';
        return;
    }
    container.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'dp-table';
    for (let i = 0; i < n; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < m; j++) {
            const td = document.createElement('td');
            td.dataset.row = i;
            td.dataset.col = j;
            td.textContent = (dpData[i][j] !== undefined && dpData[i][j] !== null) ? dpData[i][j] : '';
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
