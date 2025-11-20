// ==========================================================
// 전역 변수 및 헬퍼 함수
// ==========================================================

let currentActiveCells = []; // 현재 활성 셀 그룹 (Shift+클릭으로 선택된 셀)
let currentColorTarget = 'text'; // 색상 적용 대상
let isResizing = false; // 🌟 열 크기 조절 중인지 확인
let currentResizer = null; // 🌟 현재 드래그 중인 리사이저 헤더

// ==========================================================
// 🌟 열 크기 조절 (Column Resizing) 로직 🌟
// ==========================================================

function setupColumnResizing() {
    const table = document.querySelector('.data-table');
    if (!table) return;

    // 1. 헤더 셀에 클래스를 추가하여 드래그 가능하게 만듭니다.
    const headerRow = table.querySelector('.top-data-header');
    if (!headerRow) return;

    headerRow.querySelectorAll('td').forEach((header, index) => {
        // 마지막 열은 조절 핸들을 추가하지 않음 (테이블 전체 너비 고정 유지)
        if (index < headerRow.querySelectorAll('td').length - 1) {
            header.classList.add('resizable-col');
        }
    });

    // 2. 마우스 이벤트 리스너를 document에 연결
    table.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function startResize(e) {
    // 마우스가 셀의 우측 5px 이내에 있고, 커서가 col-resize일 때만 시작
    const targetCell = e.target.closest('.resizable-col');
    if (!targetCell || e.buttons !== 1) return;

    const rect = targetCell.getBoundingClientRect();
    // 마우스 포인터가 셀의 오른쪽 끝 5px 이내에 있는지 확인
    const isEdge = rect.right - e.clientX < 5;

    if (isEdge) {
        isResizing = true;
        currentResizer = targetCell;
        document.body.style.cursor = 'col-resize';
        e.preventDefault(); 
    }
}

function resize(e) {
    if (!isResizing || !currentResizer) return;
    
    const table = document.querySelector('.data-table');
    const minWidth = 30; // 최소 너비 설정

    // 현재 셀의 인덱스를 찾습니다.
    const colIndex = currentResizer.cellIndex;
    const allCellsInRow = currentResizer.closest('tr').querySelectorAll('td');
    
    const nextCell = allCellsInRow[colIndex + 1];

    if (nextCell) {
        const currentWidth = currentResizer.offsetWidth;
        const nextWidth = nextCell.offsetWidth;
        const delta = e.movementX; // 마우스 이동량
        
        const proposedCurrentWidth = currentWidth + delta;
        const proposedNextWidth = nextWidth - delta;

        if (proposedCurrentWidth >= minWidth && proposedNextWidth >= minWidth) {
            
            // 헤더 및 데이터 행에 너비 적용
            const dataRows = table.querySelectorAll('tr');
            dataRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > colIndex && cells.length > colIndex + 1) {
                    cells[colIndex].style.width = proposedCurrentWidth + 'px';
                    cells[colIndex].style.minWidth = proposedCurrentWidth + 'px';
                    cells[colIndex + 1].style.width = proposedNextWidth + 'px';
                    cells[colIndex + 1].style.minWidth = proposedNextWidth + 'px';
                }
            });
        }
    }
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        currentResizer = null;
        document.body.style.cursor = 'default';
    }
}


// ==========================================================
// 공통: 이미지 다운로드 함수 (html2canvas 사용)
// ==========================================================

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
// 유틸리티 및 데이터 관리
// ==========================================================

function getCellId(cell) {
    const rowIndex = cell.closest('tr').rowIndex;
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

// ==========================================================
// 다중 셀 편집 로직 (색상, 글꼴 크기)
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
    // 🌟 크기 조절 중이면 셀 선택 이벤트 무시
    if (isResizing) return; 

    const cell = event.currentTarget;

    if (event.shiftKey) {
        if (cell.classList.contains('active-cell')) {
            cell.classList.remove('active-cell');
            currentActiveCells = currentActiveCells.filter(c => c !== cell);
        } else {
            cell.classList.add('active-cell');
            currentActiveCells.push(cell);
        }
    } else {
        currentActiveCells.forEach(c => c.classList.remove('active-cell'));
        currentActiveCells = [];
        
        cell.classList.add('active-cell');
        currentActiveCells.push(cell);
    }
}

// ==========================================================
// 행 조절 로직 (행 추가/삭제)
// ==========================================================

function addRow() {
    const tableBody = document.querySelector('.data-table tbody');
    const lastRow = tableBody.querySelector('.top-data-row:last-of-type');
    
    if (!lastRow) {
        alert("추가할 행의 기준이 될 데이터 행이 없습니다.");
        return;
    }

    const newRow = lastRow.cloneNode(true);
    newRow.removeAttribute('style'); 
    
    // 헤더 행의 너비를 가져와 새 행에 적용 (열 크기 조절 상태 유지)
    const headerCells = document.querySelector('.top-data-header').querySelectorAll('td');

    newRow.querySelectorAll('td').forEach((cell, index) => {
        cell.textContent = ''; 
        cell.removeAttribute('style');
        cell.classList.remove('active-cell');
        
        // 너비 스타일 적용
        if (headerCells[index].style.width) {
            cell.style.width = headerCells[index].style.width;
            cell.style.minWidth = headerCells[index].style.minWidth;
        }

        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });

    const middleTitleRow = tableBody.querySelector('.middle-title-row');
    if (middleTitleRow) {
        tableBody.insertBefore(newRow, middleTitleRow);
    } else {
        tableBody.appendChild(newRow);
    }
    alert("새로운 데이터 행이 추가되었습니다.");
}

function deleteRow() {
    const tableBody = document.querySelector('.data-table tbody');
    const allTopRows = tableBody.querySelectorAll('.top-data-row');
    
    if (allTopRows.length > 1) { 
        const rowToDelete = allTopRows[allTopRows.length - 1]; 

        rowToDelete.querySelectorAll('td').forEach(cell => {
            const id = getCellId(cell);
            let styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
            delete styles[id];
            localStorage.setItem('customCellStyles', JSON.stringify(styles));
        });

        rowToDelete.remove();
        alert("마지막 데이터 행이 삭제되었습니다.");
        currentActiveCells = currentActiveCells.filter(cell => !rowToDelete.contains(cell));
        
    } else {
        alert("최소 하나의 데이터 행은 유지해야 합니다.");
    }
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
        if (!cell.hasAttribute('contenteditable')) {
            cell.setAttribute('contenteditable', 'true'); 
        }
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });
}

// ==========================================================
// 초기화 및 DOM 로드
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    window.downloadImage = downloadImage; 

    // 1. 셀 스타일 로드 및 contenteditable 설정
    loadCustomCellStyles();

    // 2. 🌟 열 크기 조절 기능 설정 🌟
    setupColumnResizing();

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

    // 4. 색상 적용 대상 라디오 버튼 이벤트 리스너
    document.getElementsByName('colorTarget').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentColorTarget = e.target.value;
        });
    });
    
    // 5. 글꼴 크기 적용 버튼 리스너
    document.getElementById('applyFontSizeBtn').addEventListener('click', () => {
        const size = document.getElementById('fontSizeInput').value;
        if (size) {
            applyFontSizeToActiveCells(parseInt(size));
        }
    });

    // 6. 행 추가/삭제 버튼 리스너
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('deleteRowBtn').addEventListener('click', deleteRow);
    
    // 7. 기타 UI 로직: 왼쪽 메뉴 active 토글
    document.querySelectorAll(".left-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".left-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });
});
