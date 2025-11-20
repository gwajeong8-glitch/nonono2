// --- 1. 색상 팔레트 및 편집 기능 변수 설정 (이전과 동일) ---

const colors = [
    '#FF0000', '#FF4500', '#FFA500', '#FFFF00', '#ADFF2F', '#00FF00', '#3CB371', '#00FFFF',
    '#1E90FF', '#0000FF', '#8A2BE2', '#9400D3', '#FF00FF', '#FF69B4', '#FFC0CB', '#FFFFFF',
    '#CCCCCC', '#999999', '#666666', '#333333', '#000000', 
    '#800000', '#8B4513', '#D2B48C', '#F5DEB3', '#9ACD32', '#556B2F', '#008080', '#4682B4',
    '#4169E1', '#800080', '#DDA0DD', '#F08080', '#2F4F4F', '#A9A9A9', '#778899', '#C0C0C0', 
    '#228B22', '#CD5C5C', '#6A5ACD' 
];

const colorPalette = document.querySelector('.color-palette');
const dataTable = document.querySelector('.data-table');
const applyFontSizeBtn = document.getElementById('applyFontSizeBtn');
const fontSizeInput = document.getElementById('fontSizeInput');
let selectedCells = [];


// 팔레트 생성 
colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.addEventListener('click', () => applyColor(color)); 
    colorPalette.appendChild(swatch);
});

// 셀 클릭 이벤트 
dataTable.addEventListener('click', (e) => {
    if (e.target.tagName === 'TD') {
        const cell = e.target;
        
        if (cell.closest('.data-table').classList.contains('resizing')) return;

        if (!e.shiftKey) {
            selectedCells.forEach(c => c.classList.remove('selected'));
            selectedCells = [];
        }

        if (cell.classList.contains('selected')) {
            cell.classList.remove('selected');
            selectedCells = selectedCells.filter(c => c !== cell);
        } else {
            cell.classList.add('selected');
            selectedCells.push(cell);
        }
    }
});


// 색상 적용 함수 
function applyColor(color) {
    const target = document.querySelector('input[name="colorTarget"]:checked').value; 
    
    selectedCells.forEach(cell => {
        if (target === 'background') {
            cell.style.backgroundColor = color;
        } else {
            cell.style.color = color;
        }
    });
}


// 글꼴 크기 적용 함수 
applyFontSizeBtn.addEventListener('click', () => {
    const newSize = fontSizeInput.value + 'px';
    selectedCells.forEach(cell => {
        cell.style.fontSize = newSize;
        cell.style.lineHeight = '1.2';
    });
});


// --- 2. 🖼️ 이미지 다운로드 기능 (이전과 동일) ---

function downloadImage(elementId, filename) {
    const element = document.getElementById(elementId);
    const settingPanel = document.getElementById('settingPanel');
    settingPanel.style.display = 'none';

    html2canvas(element, {
        scale: 2, 
        backgroundColor: null, 
        useCORS: true 
    }).then(canvas => {
        settingPanel.style.display = 'block';

        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(error => {
        console.error('이미지 캡처 중 오류 발생:', error);
        settingPanel.style.display = 'block'; 
    });
}


// --- 3. 📐 셀 크기 조절 (Resizer) 로직 ---

let currentResizer = null; 
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let isRowResizer = false;

// 초기화: 각 셀에 리사이저 추가 (맨 마지막 행도 포함하도록 수정)
function initializeResizers() {
    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        
        // 열 크기 조절기 (세로선) - 마지막 열 제외
        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        // 🚀 행 크기 조절기 (가로선) - tr.nextElementSibling 체크 제거하여 마지막 행 포함
        // 병합 셀이 없는 경우에만 resizer 추가
        if (td.getAttribute('colspan') === null) {
            let rowResizer = document.createElement('div');
            rowResizer.className = 'row-resizer';
            td.appendChild(rowResizer);
            rowResizer.addEventListener('mousedown', startResize);
        }
    });
}

// 리사이즈 시작
function startResize(e) {
    e.preventDefault(); 
    
    currentResizer = e.target;
    startX = e.clientX;
    startY = e.clientY;
    
    const cell = currentResizer.parentElement;
    
    if (currentResizer.classList.contains('col-resizer')) {
        isRowResizer = false;
        startWidth = cell.offsetWidth;
        dataTable.classList.add('resizing');
    } else if (currentResizer.classList.contains('row-resizer')) {
        isRowResizer = true;
        startHeight = cell.offsetHeight;
        dataTable.classList.add('resizing');
    }
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

// 리사이즈 중
function handleResize(e) {
    if (!currentResizer) return;

    const cell = currentResizer.parentElement;
    
    if (!isRowResizer) {
        // 열(너비) 조절
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        if (newWidth > 30) {
            cell.style.width = newWidth + 'px';
            cell.style.minWidth = newWidth + 'px';
        }
    } else {
        // 행(높이) 조절
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;
        if (newHeight > 10) {
            const row = cell.parentElement;
            row.style.height = newHeight + 'px'; 
            row.querySelectorAll('td').forEach(td => {
                td.style.height = newHeight + 'px';
            });
        }
    }
}

// 리사이즈 종료
function stopResize() {
    currentResizer = null;
    dataTable.classList.remove('resizing');
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}


// 페이지 로드 시 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeResizers(); 
    
    document.querySelector('.download-button').onclick = () => downloadImage('capture-area', 'noblesse_data_capture.png');
});

// --- 4. 🖱️ 왼쪽 메뉴 항목 색상 토글 기능 추가 ---

document.addEventListener('DOMContentLoaded', () => {
    // ... (기존 initializeResizers 호출 등은 유지) ... 
    
    const leftMenuItems = document.querySelectorAll('.left-item');

    leftMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 1. 모든 항목의 'active' 클래스를 제거합니다.
            leftMenuItems.forEach(i => i.classList.remove('active'));
            
            // 2. 현재 클릭된 항목에만 'active' 클래스를 추가합니다.
            this.classList.add('active');
        });
    });
});
