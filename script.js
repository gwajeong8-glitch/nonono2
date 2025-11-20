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

// 🚀 [새로운 변수] 하단 행 높이 조절을 위한 UI 요소
const rowHeightInput = document.getElementById('rowHeightInput');
const applyRowHeightBtn = document.getElementById('applyRowHeightBtn');

// 🚀 [복구된 변수] 크기 표시기 요소
const resizerDisplay = document.getElementById('resizerDisplay'); 


// 팔레트 생성 (색상 스와치 화면에 표시)
colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color;
    // 클릭 시 색상 적용 함수 호출
    swatch.addEventListener('click', () => applyColor(color)); 
    colorPalette.appendChild(swatch);
});

// 셀 클릭 이벤트 (Shift를 누르면 다중 선택)
dataTable.addEventListener('click', (e) => {
    if (e.target.tagName === 'TD') {
        const cell = e.target;
        
        // 크기 조절 중에는 셀 선택 방지
        if (cell.closest('.data-table').classList.contains('resizing')) return;

        // Shift 키가 눌려있지 않으면 선택 초기화
        if (!e.shiftKey) {
            selectedCells.forEach(c => c.classList.remove('selected'));
            selectedCells = [];
        }

        // 선택/선택 해제 토글
        if (cell.classList.contains('selected')) {
            cell.classList.remove('selected');
            selectedCells = selectedCells.filter(c => c !== cell);
        } else {
            cell.classList.add('selected');
            selectedCells.push(cell);
        }
    }
});


// 🚀 색상 적용 함수 (글자색/배경색 선택 기능을 사용자가 선택한 대로만 적용)
function applyColor(color) {
    // 'text' 또는 'background' 중 사용자가 라디오 버튼으로 선택한 값
    const target = document.querySelector('input[name="colorTarget"]:checked').value; 
    
    selectedCells.forEach(cell => {
        if (target === 'background') {
            // 배경색만 변경
            cell.style.backgroundColor = color;
        } else {
            // 글자색만 변경
            cell.style.color = color;
        }
    });
}


// 📏 글꼴 크기 적용 함수
applyFontSizeBtn.addEventListener('click', () => {
    const newSize = fontSizeInput.value + 'px';
    selectedCells.forEach(cell => {
        cell.style.fontSize = newSize;
        cell.style.lineHeight = '1.2'; // 크기 변경 시 줄 높이 조정
    });
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
    // 병합된 셀이 아닌 행/셀에만 리사이저 추가
    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        // 열 크기 조절기 (세로선) - 마지막 열 제외
        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        // 행 크기 조절기 (가로선)
        // middle-notice-row는 높이 조절하지 않음
        const tr = td.parentElement;
        if (!tr.classList.contains('middle-notice-row')) {
            if (td.getAttribute('colspan') === null) {
                let rowResizer = document.createElement('div');
                rowResizer.className = 'row-resizer';
                td.appendChild(rowResizer);
                rowResizer.addEventListener('mousedown', startResize);
            }
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
        // 🚀 표시기 활성화
        if (resizerDisplay) resizerDisplay.style.opacity = 1;
    } else if (currentResizer.classList.contains('row-resizer')) {
        isRowResizer = true;
        startHeight = cell.offsetHeight;
        dataTable.classList.add('resizing');
        // 🚀 표시기 활성화
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
        
        // 🚀 너비 표시 업데이트
        if (resizerDisplay) {
            resizerDisplay.textContent = `${Math.round(newWidth)} px (가로)`;
            resizerDisplay.style.left = (e.clientX + 10) + 'px';
            resizerDisplay.style.top = (e.clientY + 10) + 'px';
        }

    } else {
        // 행(높이) 조절
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;
        
        // 최소 높이 제한을 20px로 설정했으므로 그 이상일 때만 적용
        if (newHeight > 20) { 
            const row = cell.parentElement;
            row.style.height = newHeight + 'px'; 
            row.querySelectorAll('td').forEach(td => {
                td.style.height = newHeight + 'px';
            });
        }
        
        // 🚀 높이 표시 업데이트
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
    
    // 🚀 표시기 비활성화
    if (resizerDisplay) resizerDisplay.style.opacity = 0; 
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}


// --- 4. 🖱️ 왼쪽 메뉴 항목 색상 토글 기능 추가 (복구) ---

function initializeLeftMenu() {
    const leftMenuItems = document.querySelectorAll('.left-item');

    leftMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 1. 모든 항목의 'active' 클래스를 제거합니다.
            leftMenuItems.forEach(i => i.classList.remove('active'));
            
            // 2. 현재 클릭된 항목에만 'active' 클래스를 추가합니다.
            this.classList.add('active');
        });
    });
}


// --- 5. 📏 하단 행 높이 조절 기능 추가 (새로 추가) ---

function initializeRowHeightControl() {
    if (!applyRowHeightBtn || !rowHeightInput) return; // UI 요소가 없으면 실행 안 함
    
    applyRowHeightBtn.addEventListener('click', () => {
        const newHeight = rowHeightInput.value + 'px';
        
        // 1. data-table 내부의 모든 하단 데이터 행/헤더에 인라인 스타일 적용
        document.querySelectorAll('.bottom-data-header, .bottom-data-row').forEach(row => {
            row.style.height = newHeight;
        });

        // 2. data-table 내부의 모든 셀에 높이 및 관련 스타일 적용
        document.querySelectorAll('.bottom-data-header td, .bottom-data-row td').forEach(cell => {
            cell.style.height = newHeight;
            cell.style.lineHeight = '100%'; // 중앙 정렬 보조
        });
        
        // 3. index.html의 <style>에 있는 강제 축소 규칙을 덮어쓰기 위해
        const styleId = 'dynamic-row-height';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        
        // 강제 축소 규칙을 덮어쓰는 CSS를 만듭니다.
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
    });
}


// 페이지 로드 시 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeResizers(); 
    initializeLeftMenu(); // 🚀 왼쪽 메뉴 기능 초기화
    initializeRowHeightControl(); // 🚀 행 높이 조절 기능 초기화
    
    // 다운로드 버튼에 이벤트 핸들러 할당
    document.querySelector('.download-button').onclick = () => downloadImage('capture-area', 'noblesse_data_capture.png');
});
