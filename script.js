// ==========================================================
// 전역 변수 및 헬퍼 함수
// ==========================================================

let currentActiveCells = []; // 현재 활성 셀 그룹 (Shift+클릭으로 선택된 셀)
let currentColorTarget = 'text'; // 색상 적용 대상

// 열 크기 조절 변수
let isColResizing = false; 
let currentColResizer = null; 

// 행 높이 조절 변수
let isRowResizing = false;
let currentRowResizer = null;
let startY;
let startHeight;

// ==========================================================
// 유틸리티 및 데이터 관리
// ==========================================================

function getCellId(cell) {
    // 모든 셀에 대해 고유 ID 생성 (행 인덱스 + 열 인덱스)
    const row = cell.closest('tr');
    // rowIndex를 사용하여 고유성 확보
    const rowIndex = Array.from(row.parentNode.children).indexOf(row); 
    const colIndex = cell.cellIndex;
    return `cell-${rowIndex}-${colIndex}`;
}

function saveCellCustomStyle(cell, type, value) {
    const id = getCellId(cell);
    let styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
    
    if (!styles[id]) {
        styles[id] = {};
    }
    styles[id][type] = value; 
    
    localStorage.setItem('customCellStyles', JSON.stringify(styles));
}

function loadCustomCellStyles() {
    const styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
    const allCells = document.querySelectorAll('.data-table td'); 

    allCells.forEach(cell => {
        const id = getCellId(cell);
        if (styles[id]) {
            cell.style.color = styles[id].color || '';
            cell.style.backgroundColor = styles[id].backgroundColor || '';
            cell.style.fontSize = styles[id].fontSize || '';
        }
        
        // 저장된 행 높이 스타일 로드
        if (styles[id] && styles[id].rowHeight) {
            cell.closest('tr').style.height = styles[id].rowHeight;
        }

        if (!cell.hasAttribute('contenteditable')) {
            cell.setAttribute('contenteditable', 'true'); 
        }
        
        // 🌟 모든 셀에 클릭 리스너 재부착 (다중 편집 활성화) 🌟
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });
}


// ==========================================================
// 행 높이 조절 (Row Resizing) 로직
// ==========================================================

function setupRowResizing() {
    const table = document.querySelector('.data-table');
    table.addEventListener('mousedown', startRowResize);
}

function startRowResize(e) {
    // 행 높이 조절은 셀의 하단 5px 이내에서만 작동
    const targetCell = e.target.closest('td');
    // colspan을 가진 셀 (공지사항/제목)도 조절 가능하게 수정
    if (!targetCell || e.buttons !== 1) return; 
    
    const rect = targetCell.getBoundingClientRect();
    const isBottomEdge = rect.bottom - e.clientY < 5;

    if (isBottomEdge) {
        isColResizing = false; 
        isRowResizing = true;
        currentRowResizer = targetCell.closest('tr');
        startY = e.clientY;
        startHeight = currentRowResizer.offsetHeight;
        document.body.style.cursor = 'row-resize';
        e.preventDefault(); 
        
        document.addEventListener('mousemove', resizeRow);
        document.addEventListener('mouseup', stopRowResize);
    }
}

function resizeRow(e) {
    if (!isRowResizing || !currentRowResizer) return;
    
    const newHeight = startHeight + (e.clientY - startY);
    const minHeight = 15;

    if (newHeight >= minHeight) {
        currentRowResizer.style.height = newHeight + 'px';
        
        // 해당 행의 모든 셀에 높이 스타일 저장
        currentRowResizer.querySelectorAll('td').forEach(cell => {
             saveCellCustomStyle(cell, 'rowHeight', newHeight + 'px');
        });
    }
}

function stopRowResize() {
    isRowResizing = false;
    currentRowResizer = null;
    document.body.style.cursor = 'default';
    
    document.removeEventListener('mousemove', resizeRow);
    document.removeEventListener('mouseup', stopRowResize);
}

// ==========================================================
// 열 크기 조절 (Column Resizing) 로직
// ==========================================================

function setupColumnResizing() {
    const table = document.querySelector('.data-table');
    if (!table) return;

    // 모든 열 헤더 행에 클래스를 추가
    const headerRows = table.querySelectorAll('.top-data-header, .bottom-data-header'); 
    
    headerRows.forEach(row => {
        row.querySelectorAll('td').forEach((header, index, list) => {
            if (index < list.length - 1) {
                header.classList.add('resizable-col');
            }
        });
    });

    table.addEventListener('mousedown', startColResize);
    document.addEventListener('mouseup', stopColResize);
}

function startColResize(e) {
    if (isRowResizing) return; 
    
    const targetCell = e.target.closest('.resizable-col');
    if (!targetCell || e.buttons !== 1) return;

    const rect = targetCell.getBoundingClientRect();
    const isEdge = rect.right - e.clientX < 5;

    if (isEdge) {
        isColResizing = true;
        currentColResizer = targetCell;
        document.body.style.cursor = 'col-resize';
        e.preventDefault(); 
        document.addEventListener('mousemove', resizeCol); 
    }
}

function resizeCol(e) {
    if (!isColResizing || !currentColResizer) return;
    
    const table = document.querySelector('.data-table');
    const minWidth = 30;

    const colIndex = currentColResizer.cellIndex;
    const allCellsInRow = currentColResizer.closest('tr').querySelectorAll('td');
    const nextCell = allCellsInRow[colIndex + 1];

    if (nextCell) {
        const currentWidth = currentColResizer.offsetWidth;
        const nextWidth = nextCell.offsetWidth;
        const delta = e.movementX; 
        
        const proposedCurrentWidth = currentWidth + delta;
        const proposedNextWidth = nextWidth - delta;

        if (proposedCurrentWidth >= minWidth && proposedNextWidth >= minWidth) {
            
            // 모든 5열 행에 너비 적용
            table.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 5) { 
                    cells[colIndex].style.width = proposedCurrentWidth + 'px';
                    cells[colIndex].style.minWidth = proposedCurrentWidth + 'px';
                    cells[colIndex + 1].style.width = proposedNextWidth + 'px';
                    cells[colIndex + 1].style.minWidth = proposedNextWidth + 'px';
                }
            });
        }
    }
}

function stopColResize() {
    if (isColResizing) {
        isColResizing = false;
        currentColResizer = null;
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', resizeCol);
    }
}

// ==========================================================
// 다중 셀 편집 및 행 조절 (핵심 기능)
// ==========================================================

function applyColorToActiveTarget(color) {
    if (currentActiveCells.length === 0) return;
    const styleProp = currentColorTarget === 'text' ? 'color' : 'backgroundColor';
    currentActiveCells.forEach(cell => {
        cell.style[styleProp] = color;
        saveCellCustomStyle(cell, styleProp, color);
    });
}

function applyFontSizeToActiveCells(size) {
    if (currentActiveCells.length === 0) return;
    currentActiveCells.forEach(cell => {
        cell.style.fontSize = size + 'px'; 
        saveCellCustomStyle(cell, 'fontSize', size + 'px');
    });
}

function handleCellClick(event) {
    // 🌟 이 부분이 다중 편집 기능의 핵심입니다. 🌟
    if (isColResizing || isRowResizing) return; 

    const cell = event.currentTarget;

    if (event.shiftKey) {
        // Shift 키를 누르면 추가/제거 (다중 선택)
        if (cell.classList.contains('active-cell')) {
            cell.classList.remove('active-cell');
            currentActiveCells = currentActiveCells.filter(c => c !== cell);
        } else {
            cell.classList.add('active-cell');
            currentActiveCells.push(cell);
        }
    } else {
        // Shift 키를 누르지 않으면 단일 선택
        currentActiveCells.forEach(c => c.classList.remove('active-cell'));
        currentActiveCells = [];
        cell.classList.add('active-cell');
        currentActiveCells.push(cell);
    }
}

// 🌟 행 추가 로직 수정 (작동 오류 해결) 🌟
function addRow() {
    const tableBody = document.querySelector('.data-table tbody');
    // 복제할 기준 행: 마지막 top-data-row
    const lastRow = tableBody.querySelector('.top-data-row:last-of-type');
    
    if (!lastRow) {
        alert("데이터 행이 최소 하나는 필요합니다.");
        return;
    }

    // cloneNode(true)를 사용하여 모든 자식 노드를 복제
    const newRow = lastRow.cloneNode(true); 
    newRow.removeAttribute('style'); 
    
    const headerCells = document.querySelector('.top-data-header').querySelectorAll('td');

    newRow.querySelectorAll('td').forEach((cell, index) => {
        cell.textContent = ''; // 내용 비우기
        cell.removeAttribute('style'); // 기존 스타일 제거
        cell.classList.remove('active-cell');
        
        // 너비 스타일 적용
        if (headerCells[index] && headerCells[index].style.width) {
            cell.style.width = headerCells[index].style.width;
            cell.style.minWidth = headerCells[index].style.minWidth;
        }

        // 🌟 새로 생성된 셀에 클릭 이벤트 리스너 재부착 🌟
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });

    // middle-title-row 바로 위에 새 행을 삽입
    const middleTitleRow = tableBody.querySelector('.middle-title-row');
    if (middleTitleRow) {
        tableBody.insertBefore(newRow, middleTitleRow);
    } else {
        tableBody.appendChild(newRow); 
    }
    alert("새로운 데이터 행이 추가되었습니다.");
}

// 🌟 행 삭제 로직 수정 (작동 오류 해결) 🌟
function deleteRow() {
    const tableBody = document.querySelector('.data-table tbody');
    const allTopRows = tableBody.querySelectorAll('.top-data-row');
    
    if (allTopRows.length > 1) { 
        const rowToDelete = allTopRows[allTopRows.length - 1]; 

        // 로컬 스토리지 스타일 제거
        rowToDelete.querySelectorAll('td').forEach(cell => {
            let styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
            delete styles[getCellId(cell)];
            localStorage.setItem('customCellStyles', JSON.stringify(styles));
        });

        rowToDelete.remove();
        alert("마지막 데이터 행이 삭제되었습니다.");
        // 활성 셀 목록에서 삭제된 셀 제거
        currentActiveCells = currentActiveCells.filter(cell => !rowToDelete.contains(cell));
        
    } else {
        alert("최소 하나의 데이터 행은 유지해야 합니다.");
    }
}

// 캡처 함수 (이전과 동일)
function downloadImage(elementId, fileName) {
    const captureElement = document.getElementById(elementId);
    
    currentActiveCells.forEach(cell => cell.classList.remove('active-cell'));

    const button = document.querySelector('.download-button');
    const originalText = button.textContent;
    button.textContent = '이미지 생성 중... 잠시만 기다려주세요.';
    button.disabled = true;

    html2canvas(captureElement, {
        scale: 2, 
        allowTaint: true,
        useCORS: true
    }).then(canvas => {
        const image = canvas.toDataURL('image/png');

        const a = document.createElement('a');
        a.href = image;
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        button.textContent = originalText;
        button.disabled = false;
        
        currentActiveCells.forEach(cell => cell.classList.add('active-cell'));

    }).catch(error => {
        console.error('이미지 생성 중 오류 발생:', error);
        button.textContent = '❌ 오류 발생 (콘솔 확인)';
        button.disabled = false;
        currentActiveCells.forEach(cell => cell.classList.add('active-cell'));
        alert('이미지 생성에 실패했습니다.');
    });
}


// ==========================================================
// 초기화 및 DOM 로드
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    window.downloadImage = downloadImage; 

    // 1. 셀 스타일 로드 및 contenteditable 설정 (다중 편집 기능 활성화됨)
    loadCustomCellStyles();

    // 2. 열/행 크기 조절 기능 설정
    setupColumnResizing();
    setupRowResizing(); 

    // 3. 색상 팔레트 초기화
    const colorPaletteElement = document.querySelector(".color-palette");
    const presetColors = [
        '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500', 
        '#800080', '#00FFFF', '#FFC0CB', '#FFFFFF', '#000000', 
        '#808080', '#A52A2A', '#00FF00', '#FFD700', '#FF4500',
        '#9932CC', '#4682B4', '#DAA520', '#2F4F4F', '#1B5E20', 
        '#7FFFD4', '#F08080', '#DDA0DD', '#7B68EE', '#B0C4DE', 
        '#D2B48C', '#E6E6FA', '#FFFACD', '#8B0000', '#4B0082', 
        '#228B22', '#CD853F', '#F0E68C', '#ADD8E6', '#FF6347', 
        '#9ACD32', '#6495ED', '#D8BFD8', '#BA55D3', '#00CED1'  
    ];
    
    presetColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        
        swatch.addEventListener('click', () => {
            applyColorToActiveTarget(color);
        });
        colorPaletteElement.appendChild(swatch);
    });

    // 4. 이벤트 리스너 설정
    document.getElementsByName('colorTarget').forEach(radio => {
        radio.addEventListener('change', (e) => { currentColorTarget = e.target.value; });
    });
    document.getElementById('applyFontSizeBtn').addEventListener('click', () => {
        const size = document.getElementById('fontSizeInput').value;
        if (size) { applyFontSizeToActiveCells(parseInt(size)); }
    });
    // 🌟 버튼 리스너 재설정 🌟
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('deleteRowBtn').addEventListener('click', deleteRow);
    
    document.querySelectorAll(".left-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".left-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });
});
