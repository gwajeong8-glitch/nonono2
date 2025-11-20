// =======================================================
// Global Variables for State Management
// =======================================================
let selectedCells = [];
let isMouseDown = false;
let startCell = null;
let currentCell = null;

// =======================================================
// Utility Functions
// =======================================================

/**
 * Creates and appends color palette buttons to the setting panel.
 */
function createColorPalette() {
    const palette = document.querySelector('.color-palette');
    const colors = [
        '#FFFFFF', '#C0C0C0', '#808080', '#404040', '#000000',
        '#FF0000', '#FF8080', '#FFC000', '#FFFF00', '#80FF00',
        '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF',
        '#8000FF', '#FF00FF', '#FF0080', '#800000', '#FF8000',
        '#808000', '#008000', '#008080', '#000080', '#800080',
        '#C0D9D9', '#E6C3E6', '#F7B7B7', '#D4F4FA', '#FFF0B5',
        '#D0D0FF', '#FFA07A', '#98FB98', '#B0E0E6', '#FAFAD2',
        '#696969', '#A9A9A9', '#D3D3D3', '#F5F5F5', '#191970'
    ];

    colors.forEach(color => {
        const button = document.createElement('button');
        button.className = 'color-btn';
        button.style.backgroundColor = color;
        button.dataset.color = color;
        button.addEventListener('click', applyColor);
        palette.appendChild(button);
    });
}

/**
 * Downloads the specified HTML element as a PNG image.
 * @param {string} elementId - The ID of the element to capture.
 * @param {string} fileName - The name of the downloaded file.
 */
function downloadImage(elementId, fileName) {
    const element = document.getElementById(elementId);
    
    // 선택된 셀 스타일을 잠시 제거 (캡처 시 선택 표시를 없애기 위함)
    selectedCells.forEach(cell => cell.classList.remove('selected'));

    // html2canvas 설정: 캡처 영역 스크롤바 무시, 배경 투명도 유지
    html2canvas(element, {
        useCORS: true, 
        backgroundColor: null, // body의 배경은 포함하지 않음
        windowWidth: document.body.scrollWidth, // 전체 너비 캡처
        windowHeight: document.body.scrollHeight // 전체 높이 캡처
    }).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 캡처 후 선택된 셀 스타일을 다시 적용
        selectedCells.forEach(cell => cell.classList.add('selected'));
        alert('테이블 캡처가 완료되었습니다! (배경 이미지는 포함되지 않습니다)');
    });
}


// =======================================================
// Cell Selection Logic (Ctrl/Shift/Mouse)
// =======================================================

/**
 * Handles cell selection based on user click (single, shift, or ctrl/cmd).
 * @param {Event} e - The mouse event.
 */
function handleCellMouseDown(e) {
    const cell = e.currentTarget;
    startCell = cell;
    isMouseDown = true;
    
    // Prevent dragging from starting contenteditable mode
    e.preventDefault(); 
    
    // Shift-click for multiple selection
    if (e.shiftKey) {
        if (selectedCells.length === 0) {
             toggleCellSelection(cell);
        } else {
            // Select range from the first selected cell to the current cell
            selectCellRange(selectedCells[0], cell);
        }
    } 
    // Single click (replaces current selection)
    else {
        clearSelection();
        toggleCellSelection(cell);
    }

    // Set a global mouse move listener for dragging selection
    document.addEventListener('mousemove', handleCellMouseMove);
    document.addEventListener('mouseup', handleCellMouseUp);
}

/**
 * Clears the current cell selection.
 */
function clearSelection() {
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    selectedCells = [];
}

/**
 * Toggles the selection state of a single cell.
 * @param {HTMLElement} cell - The cell to toggle.
 */
function toggleCellSelection(cell) {
    if (cell.classList.contains('selected')) {
        cell.classList.remove('selected');
        selectedCells = selectedCells.filter(c => c !== cell);
    } else {
        cell.classList.add('selected');
        selectedCells.push(cell);
    }
}

/**
 * Handles mouse movement for drag-selection.
 * @param {Event} e - The mouse event.
 */
function handleCellMouseMove(e) {
    if (!isMouseDown) return;
    
    const targetCell = e.target.closest('td');
    if (!targetCell || targetCell === currentCell) return;
    
    currentCell = targetCell;
    selectCellRange(startCell, currentCell);
}

/**
 * Handles mouse up event, finalizing drag-selection.
 */
function handleCellMouseUp() {
    isMouseDown = false;
    startCell = null;
    currentCell = null;
    document.removeEventListener('mousemove', handleCellMouseMove);
    document.removeEventListener('mouseup', handleCellMouseUp);
}

/**
 * Selects all cells within a rectangular range defined by two corner cells.
 * @param {HTMLElement} cellA - The first corner cell.
 * @param {HTMLElement} cellB - The second corner cell.
 */
function selectCellRange(cellA, cellB) {
    const table = document.querySelector('.data-table');
    const cells = Array.from(table.querySelectorAll('td[contenteditable="true"]'));
    if (cells.length === 0) return;

    const allRows = Array.from(table.querySelectorAll('tr'));
    
    const getCoords = (cell) => {
        const row = cell.closest('tr');
        if (!row) return null;
        return {
            row: allRows.indexOf(row),
            col: Array.from(row.querySelectorAll('td')).indexOf(cell)
        };
    };

    const coordA = getCoords(cellA);
    const coordB = getCoords(cellB);
    
    if (!coordA || !coordB) return;

    const startRow = Math.min(coordA.row, coordB.row);
    const endRow = Math.max(coordA.row, coordB.row);
    const startCol = Math.min(coordA.col, coordB.col);
    const endCol = Math.max(coordA.col, coordB.col);

    clearSelection();

    for (let r = startRow; r <= endRow; r++) {
        const row = allRows[r];
        const rowCells = Array.from(row.querySelectorAll('td'));
        for (let c = startCol; c <= endCol; c++) {
            if (c < rowCells.length) {
                const cell = rowCells[c];
                if (cell.getAttribute('contenteditable') === 'true') {
                    cell.classList.add('selected');
                    selectedCells.push(cell);
                }
            }
        }
    }
}

// =======================================================
// Style Application Logic
// =======================================================

/**
 * Applies the selected color to the selected cells (text or background).
 * @param {Event} e - The click event from the color button.
 */
function applyColor(e) {
    if (selectedCells.length === 0) {
        alert('먼저 색상을 적용할 셀을 Shift + 클릭으로 선택해 주세요.');
        return;
    }

    const color = e.currentTarget.dataset.color;
    const target = document.querySelector('input[name="colorTarget"]:checked').value;

    selectedCells.forEach(cell => {
        if (target === 'text') {
            cell.style.color = color;
        } else if (target === 'background') {
            cell.style.backgroundColor = color;
        }
    });
}

/**
 * Applies the specified font size to the selected cells.
 */
function applyFontSize() {
    if (selectedCells.length === 0) {
        alert('먼저 글꼴 크기를 변경할 셀을 Shift + 클릭으로 선택해 주세요.');
        return;
    }

    const fontSize = document.getElementById('fontSizeInput').value;
    if (fontSize < 8 || fontSize > 48 || isNaN(fontSize)) {
        alert('글꼴 크기는 8px에서 48px 사이의 값으로 입력해주세요.');
        return;
    }

    selectedCells.forEach(cell => {
        cell.style.fontSize = `${fontSize}px`;
    });
}

// =======================================================
// Resizing Logic (Column & Row)
// =======================================================

let resizeTarget = null;
let resizeType = null; // 'col' or 'row'
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

/**
 * Starts the column or row resizing process.
 * @param {Event} e - The mouse event.
 */
function startResize(e) {
    resizeTarget = e.target.closest('td');
    
    // Determine if it's a column or row resize based on class and proximity
    // We only allow resizing on column headers and data rows, not the top/middle rows.
    if (!resizeTarget) return;

    // Col Resize: Check for class indicating the right border
    if (e.target.classList.contains('col-resizer')) {
        resizeType = 'col';
        startX = e.clientX;
        startWidth = resizeTarget.offsetWidth;
        // Prevent default text selection
        e.preventDefault(); 
        
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    } 
    // Row Resize: Check for class indicating the bottom border
    else if (e.target.classList.contains('row-resizer')) {
        resizeType = 'row';
        startY = e.clientY;
        startHeight = resizeTarget.offsetHeight;
        // Prevent default text selection
        e.preventDefault(); 
        
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }
}

/**
 * Performs the resizing action on mouse move.
 * @param {Event} e - The mouse event.
 */
function doResize(e) {
    if (!resizeTarget) return;

    if (resizeType === 'col') {
        const newWidth = startWidth + (e.clientX - startX);
        if (newWidth > 30) { // Minimum width constraint
            resizeTarget.style.width = `${newWidth}px`;
            // Apply width to the whole column by targeting all cells in that column's index
            const colIndex = Array.from(resizeTarget.parentNode.children).indexOf(resizeTarget);
            const table = resizeTarget.closest('table');
            const rows = table.querySelectorAll('tr');
            
            // Apply width to the data cells (not headers, since the resizer is on header)
            rows.forEach(row => {
                const cell = row.children[colIndex];
                if (cell && row.classList.contains('top-data-header')) {
                    cell.style.width = `${newWidth}px`;
                }
            });
        }
    } else if (resizeType === 'row') {
        const newHeight = startHeight + (e.clientY - startY);
        if (newHeight > 15) { // Minimum height constraint
            resizeTarget.style.height = `${newHeight}px`;
            // Apply height to all cells in the row
            Array.from(resizeTarget.parentNode.children).forEach(cell => {
                if (cell !== resizeTarget) {
                    cell.style.height = `${newHeight}px`;
                }
            });
        }
    }
}

/**
 * Stops the resizing process.
 */
function stopResize() {
    resizeTarget = null;
    resizeType = null;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
}


// =======================================================
// Initialization (DOM Ready)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. 셀 선택 이벤트 리스너 추가
    document.querySelectorAll('.data-table td[contenteditable="true"]').forEach(cell => {
        // Prevent default right-click behavior from interfering with selection
        cell.addEventListener('contextmenu', e => e.stopPropagation());
        cell.addEventListener('mousedown', handleCellMouseDown);
    });

    // 2. 글꼴 크기 적용 버튼 리스너
    const applyFontSizeBtn = document.getElementById('applyFontSizeBtn');
    if (applyFontSizeBtn) {
        applyFontSizeBtn.addEventListener('click', applyFontSize);
    }

    // 3. 색상 팔레트 생성
    createColorPalette();

    // 4. 리사이저 요소 생성 및 이벤트 리스너 추가
    document.querySelectorAll('.data-table td').forEach(cell => {
        
        // 열(Column) 리사이저 (td의 오른쪽 경계선)
        const colResizer = document.createElement('div');
        colResizer.className = 'col-resizer';
        cell.appendChild(colResizer);
        
        // 행(Row) 리사이저 (td의 아래쪽 경계선)
        const rowResizer = document.createElement('div');
        rowResizer.className = 'row-resizer';
        cell.appendChild(rowResizer);

        // 리사이즈 이벤트 리스너
        colResizer.addEventListener('mousedown', startResize);
        rowResizer.addEventListener('mousedown', startResize);
    });

    // 5. 테이블 외부 클릭 시 선택 해제
    document.addEventListener('click', (e) => {
        // 클릭된 요소가 설정 패널, 테이블 내부, 또는 색상 버튼이 아닌 경우에만 해제
        if (!e.target.closest('.setting-panel') && !e.target.closest('.data-table')) {
            clearSelection();
        }
    });
});
