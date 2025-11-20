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

const rowHeightInput = document.getElementById('rowHeightInput');
const applyRowHeightBtn = document.getElementById('applyRowHeightBtn');

const resizerDisplay = document.getElementById('resizerDisplay'); 


// 🚀 [신규 기능] LocalStorage에 테이블 내용을 저장하는 함수
function saveSettings() {
    // 캡처 영역(.wrap)의 전체 HTML 내용을 저장하여 색상, 크기, 내용, 높이 등 모든 변경 사항을 보존
    const captureArea = document.getElementById('capture-area');
    if (captureArea) {
        localStorage.setItem('noblesseTableState', captureArea.innerHTML);
    }
}

// 🚀 [신규 기능] LocalStorage에서 저장된 내용을 불러와 적용하는 함수
function loadSettings() {
    const savedState = localStorage.getItem('noblesseTableState');
    if (savedState) {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            // 기존 테이블 내용을 저장된 내용으로 교체
            captureArea.innerHTML = savedState;
            
            // DOM이 변경되었으므로, 리사이저와 기타 요소들을 다시 초기화해야 함
            // (DOMContentLoaded에서 호출되므로 이 함수 내에서 다시 호출하지 않음)
            console.log('이전 설정이 성공적으로 로드되었습니다.');
        }
    }
}


// 팔레트 생성 (색상 스와치 화면에 표시)
colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    // 클릭 시 색상 적용 및 저장
    swatch.addEventListener('click', () => {
        applyColor(color);
        saveSettings(); // 🚀 색상 변경 후 저장
    }); 
    colorPalette.appendChild(swatch);
});

// 셀 클릭 이벤트 (Shift를 누르면 다중 선택)
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

// 셀 내용 편집 이벤트: 입력이 끝날 때마다 저장
dataTable.addEventListener('input', (e) => {
    if (e.target.tagName === 'TD' && e.target.contentEditable === 'true') {
        saveSettings(); // 🚀 내용 변경 후 저장
    }
});


// 🚀 색상 적용 함수
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


// 📏 글꼴 크기 적용 함수
applyFontSizeBtn.addEventListener('click', () => {
    const newSize = fontSizeInput.value + 'px';
    selectedCells.forEach(cell => {
        cell.style.fontSize = newSize;
        cell.style.lineHeight = '1.2'; 
    });
    saveSettings(); // 🚀 크기 변경 후 저장
});


// --- 2. 🖼️ 이미지 다운로드 기능 ---

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

// 초기화: 각 셀에 리사이저 추가
function initializeResizers() {
    // 주의: loadSettings 후 DOM이 재구성되므로, 이 함수가 loadSettings 후에 호출되어야 함
    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        
        // 리사이저가 이미 있는지 확인하여 중복 추가 방지
        if (td.querySelector('.col-resizer') || td.querySelector('.row-resizer')) return;

        // 열 크기 조절기 (세로선) - 마지막 열 제외
        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        // 행 크기 조절기 (가로선)
        const tr = td.parentElement;
        if (!tr.classList.contains('middle-notice-row') && td.getAttribute('colspan') === null) {
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

// 리사이즈 종료
function stopResize() {
    currentResizer = null;
    dataTable.classList.remove('resizing');
    
    if (resizerDisplay) resizerDisplay.style.opacity = 0; 
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    saveSettings(); // 🚀 크기 조절 후 저장
}


// --- 4. 🖱️ 왼쪽 메뉴 항목 색상 토글 기능 ---

function initializeLeftMenu() {
    const leftMenuItems = document.querySelectorAll('.left-item');

    leftMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            leftMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            saveSettings(); // 🚀 메뉴 상태 변경 후 저장
        });
    });
}


// --- 5. 📏 하단 행 높이 조절 기능 ---

function initializeRowHeightControl() {
    if (!applyRowHeightBtn || !rowHeightInput) return;
    
    applyRowHeightBtn.addEventListener('click', () => {
        const newHeight = rowHeightInput.value + 'px';
        
        document.querySelectorAll('.bottom-data-header, .bottom-data-row').forEach(row => {
            row.style.height = newHeight;
        });

        document.querySelectorAll('.bottom-data-header td, .bottom-data-row td').forEach(cell => {
            cell.style.height = newHeight;
            cell.style.lineHeight = '100%';
        });
        
        const styleId = 'dynamic-row-height';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        
        style.textContent = `
            .bottom-data-header td, .bottom-data-row td {
                height: ${newHeight} !important;
                line-height: 100% !important;
                padding-top: 0px !important;
                padding-bottom: 0px !important;
            }
            .bottom-data-header, .bottom-data-row {
                height: ${newHeight} !important;
            }
        `;
        
        saveSettings(); // 🚀 높이 변경 후 저장
    });
}


// 페이지 로드 시 기능 초기화
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
