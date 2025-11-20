// --- 1. 색상 팔레트 및 편집 기능 변수 설정 ---

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

// 📐 [수정된 변수] 그룹별 높이 입력 필드 변수
const topRowHeightInput = document.getElementById('topRowHeightInput');
const middleRowHeightInput = document.getElementById('middleRowHeightInput');
const bottomRowHeightInput = document.getElementById('bottomRowHeightInput');
// 📐 [수정된 변수] 그룹별 적용 버튼 변수
const applyTopRowHeightBtn = document.getElementById('applyTopRowHeightBtn');
const applyMiddleRowHeightBtn = document.getElementById('applyMiddleRowHeightBtn');
const applyBottomRowHeightBtn = document.getElementById('applyBottomRowHeightBtn');


const resizerDisplay = document.getElementById('resizerDisplay'); 


// 🚀 LocalStorage에 테이블 내용을 저장하는 함수
function saveSettings() {
    const captureArea = document.getElementById('capture-area');
    if (captureArea) {
        localStorage.setItem('noblesseTableState', captureArea.innerHTML);
        
        // 📐 [수정된 저장 로직] 세 가지 높이 입력값 모두 저장
        if (topRowHeightInput) localStorage.setItem('topRowHeightValue', topRowHeightInput.value);
        if (middleRowHeightInput) localStorage.setItem('middleRowHeightValue', middleRowHeightInput.value);
        if (bottomRowHeightInput) localStorage.setItem('bottomRowHeightValue', bottomRowHeightInput.value);
    }
}

// 🚀 LocalStorage에서 저장된 내용을 불러와 적용하는 함수
function loadSettings() {
    const savedState = localStorage.getItem('noblesseTableState');
    if (savedState) {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            captureArea.innerHTML = savedState;
            
            // 📐 [수정된 로드 로직] 세 가지 높이 입력값 모두 로드 및 적용
            const savedTopHeight = localStorage.getItem('topRowHeightValue');
            const savedMiddleHeight = localStorage.getItem('middleRowHeightValue');
            const savedBottomHeight = localStorage.getItem('bottomRowHeightValue');

            if (topRowHeightInput && savedTopHeight) {
                topRowHeightInput.value = savedTopHeight;
                applyRowHeight('.top-data-header, .top-data-row', savedTopHeight + 'px');
            }
            if (middleRowHeightInput && savedMiddleHeight) {
                middleRowHeightInput.value = savedMiddleHeight;
                applyRowHeight('.middle-notice-row, .middle-title-row', savedMiddleHeight + 'px');
            }
            if (bottomRowHeightInput && savedBottomHeight) {
                bottomRowHeightInput.value = savedBottomHeight;
                applyRowHeight('.bottom-data-header, .bottom-data-row', savedBottomHeight + 'px');
            }

            console.log('이전 설정이 성공적으로 로드되었습니다.');
        }
    }
}


// 팔레트 생성 (색상 스와치 화면에 표시) - (변동 없음)
colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    swatch.addEventListener('click', () => {
        applyColor(color);
        saveSettings();
    }); 
    colorPalette.appendChild(swatch);
});

// 셀 클릭 이벤트 (Shift를 누르면 다중 선택) - (변동 없음)
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

// 셀 내용 편집 이벤트: 입력이 끝날 때마다 저장 - (변동 없음)
dataTable.addEventListener('input', (e) => {
    if (e.target.tagName === 'TD' && e.target.contentEditable === 'true') {
        saveSettings();
    }
});


// 🚀 색상 적용 함수 - (변동 없음)
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


// 📏 글꼴 크기 적용 함수 - (변동 없음)
applyFontSizeBtn.addEventListener('click', () => {
    const newSize = fontSizeInput.value + 'px';
    selectedCells.forEach(cell => {
        cell.style.fontSize = newSize;
        cell.style.lineHeight = '1.2'; 
    });
    saveSettings();
});


// --- 2. 🖼️ 이미지 다운로드 기능 --- (변동 없음)

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


// --- 3. 📐 셀 크기 조절 (Resizer) 로직 --- (개별 드래그 조절 기능 유지)

let currentResizer = null; 
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let isRowResizer = false;

// 초기화: 각 셀에 리사이저 추가 - (변동 없음)
function initializeResizers() {
    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        
        if (td.querySelector('.col-resizer') || td.querySelector('.row-resizer')) return;

        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        const tr = td.parentElement;
        if (!tr.classList.contains('middle-notice-row') && td.getAttribute('colspan') === null) {
            let rowResizer = document.createElement('div');
            rowResizer.className = 'row-resizer';
            td.appendChild(rowResizer);
            rowResizer.addEventListener('mousedown', startResize);
        }
    });
}

// 리사이즈 시작 - (변동 없음)
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
        if (resizerDisplay) resizerDisplay.style.opacity = 1;
    } else if (currentResizer.classList.contains('row-resizer')) {
        isRowResizer = true;
        startHeight = cell.offsetHeight;
        dataTable.classList.add('resizing');
        if (resizerDisplay) resizerDisplay.style.opacity = 1;
    }
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

// 리사이즈 중 - (변동 없음)
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
        
        if (resizerDisplay) {
            resizerDisplay.textContent = `${Math.round(newWidth)} px (가로)`;
            resizerDisplay.style.left = (e.clientX + 10) + 'px';
            resizerDisplay.style.top = (e.clientY + 10) + 'px';
        }

    } else {
        // 행(높이) 조절
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;
        
        if (newHeight > 20) { 
            const row = cell.parentElement;
            row.style.height = newHeight + 'px'; 
            row.querySelectorAll('td').forEach(td => {
                td.style.height = newHeight + 'px';
            });
        }
        
        if (resizerDisplay) {
            resizerDisplay.textContent = `${Math.round(newHeight)} px (세로)`;
            resizerDisplay.style.left = (e.clientX + 10) + 'px';
            resizerDisplay.style.top = (e.clientY + 10) + 'px';
        }
    }
}

// 리사이즈 종료 - (변동 없음)
function stopResize() {
    currentResizer = null;
    dataTable.classList.remove('resizing');
    
    if (resizerDisplay) resizerDisplay.style.opacity = 0; 
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    saveSettings(); 
}


// --- 4. 🖱️ 왼쪽 메뉴 항목 색상 토글 기능 --- (변동 없음)

function initializeLeftMenu() {
    const leftMenuItems = document.querySelectorAll('.left-item');

    leftMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            leftMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            saveSettings(); 
        });
    });
}


// 🚀 [수정된 함수] 특정 행 선택자에 강제 높이 스타일을 적용하는 함수
function applyRowHeight(selector, newHeight) {
    const styleId = 'dynamic-row-height';
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    
    // 특정 행 그룹과 그 내부의 TD에 높이를 !important로 강제 적용
    style.textContent += `
        ${selector}, ${selector} td {
            height: ${newHeight} !important;
            line-height: 100% !important;
            padding-top: 0px !important;
            padding-bottom: 0px !important;
        }
    `;
    
    // 인라인 스타일로도 적용 (DOM에 저장됨)
    document.querySelectorAll(selector).forEach(row => {
        row.style.height = newHeight;
        row.querySelectorAll('td').forEach(td => td.style.height = newHeight);
    });
}


// --- 5. 📏 그룹별 행 높이 조절 기능 (기존 로직 대폭 수정) ---

function initializeRowHeightControl() {
    
    // 1. 상단 데이터 행 그룹 조절
    if (applyTopRowHeightBtn && topRowHeightInput) {
        applyTopRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = topRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            applyRowHeight('.top-data-header, .top-data-row', newHeight);
            saveSettings();
        });
    }

    // 2. 중단 공지/제목 행 그룹 조절
    if (applyMiddleRowHeightBtn && middleRowHeightInput) {
        applyMiddleRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = middleRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            // middle-notice-row와 middle-title-row를 모두 포함
            applyRowHeight('.middle-notice-row, .middle-title-row', newHeight);
            saveSettings();
        });
    }

    // 3. 하단 데이터 행 그룹 조절
    if (applyBottomRowHeightBtn && bottomRowHeightInput) {
        applyBottomRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = bottomRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            applyRowHeight('.bottom-data-header, .bottom-data-row', newHeight);
            saveSettings();
        });
    }
}


// 페이지 로드 시 기능 초기화 - (변동 없음)
document.addEventListener('DOMContentLoaded', () => {
    // 1. 저장된 설정을 먼저 로드 (DOM 구조 변경 발생 가능)
    loadSettings(); 
    
    // 2. 새로운 DOM 구조에 맞춰 모든 이벤트와 리사이저를 초기화
    initializeResizers(); 
    initializeLeftMenu(); 
    initializeRowHeightControl();
    
    // 다운로드 버튼에 이벤트 핸들러 할당
    document.querySelector('.download-button').onclick = () => downloadImage('capture-area', 'noblesse_data_capture.png');
});
