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

// 📐 그룹별 높이 입력 필드 변수
const topRowHeightInput = document.getElementById('topRowHeightInput');
const middleRowHeightInput = document.getElementById('middleRowHeightInput');
const bottomRowHeightInput = document.getElementById('bottomRowHeightInput');
// 📐 그룹별 적용 버튼 변수
const applyTopRowHeightBtn = document.getElementById('applyTopRowHeightBtn');
const applyMiddleRowHeightBtn = document.getElementById('applyMiddleRowHeightBtn');
const applyBottomRowHeightBtn = document.getElementById('applyBottomRowHeightBtn');

const resizerDisplay = document.getElementById('resizerDisplay'); 


// 🚀 LocalStorage에 테이블 내용을 저장하는 함수
function saveSettings() {
    const captureArea = document.getElementById('capture-area');
    if (captureArea) {
        localStorage.setItem('noblesseTableState', captureArea.innerHTML);
        
        // 📐 세 가지 높이 입력값 모두 저장
        if (topRowHeightInput) localStorage.setItem('topRowHeightValue', topRowHeightInput.value);
        if (middleRowHeightInput) localStorage.setItem('middleRowHeightValue', middleRowHeightInput.value);
        if (bottomRowHeightInput) localStorage.setItem('bottomRowHeightValue', bottomRowHeightInput.value);

        // 🎨 현재 선택된 색상 타겟도 저장
        const colorTarget = document.querySelector('input[name="colorTarget"]:checked');
        if (colorTarget) localStorage.setItem('colorTarget', colorTarget.value);
    }
}

// 🚀 LocalStorage에서 저장된 내용을 불러와 적용하는 함수
function loadSettings() {
    const savedState = localStorage.getItem('noblesseTableState');
    if (savedState) {
        const captureArea = document.getElementById('capture-area');
        if (captureArea) {
            captureArea.innerHTML = savedState;
            
            // 📐 세 가지 높이 입력값 로드 및 적용
            const savedTopHeight = localStorage.getItem('topRowHeightValue');
            const savedMiddleHeight = localStorage.getItem('middleRowHeightValue');
            const savedBottomHeight = localStorage.getItem('bottomRowHeightValue');

            if (topRowHeightInput && savedTopHeight) {
                topRowHeightInput.value = savedTopHeight;
                applyRowHeight('.top-data-header, .top-data-row', savedTopHeight + 'px', true);
            }
            if (middleRowHeightInput && savedMiddleHeight) {
                middleRowHeightInput.value = savedMiddleHeight;
                applyRowHeight('.middle-notice-row, .middle-title-row', savedMiddleHeight + 'px', true);
            }
            if (bottomRowHeightInput && savedBottomHeight) {
                bottomRowHeightInput.value = savedBottomHeight;
                applyRowHeight('.bottom-data-header, .bottom-data-row', savedBottomHeight + 'px', true);
            }
            
            // 🎨 저장된 색상 타겟 로드
            const savedColorTarget = localStorage.getItem('colorTarget') || 'text';
            const targetInput = document.querySelector(`input[name="colorTarget"][value="${savedColorTarget}"]`);
            if(targetInput) targetInput.checked = true;

            console.log('이전 설정이 성공적으로 로드되었습니다.');
        }
    }
}

// 🎨 색상 타겟 변경 이벤트 리스너 추가
function initializeColorTargetControl() {
    document.querySelectorAll('input[name="colorTarget"]').forEach(radio => {
        radio.addEventListener('change', () => {
            saveSettings(); // 선택이 변경될 때마다 저장
        });
    });
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
        saveSettings();
    }); 
    colorPalette.appendChild(swatch);
});

// 💡 [최종 수정] 셀 클릭 이벤트: e.target.closest('td')를 사용하여 정확히 <td>를 선택하도록 강화
dataTable.addEventListener('click', (e) => {
    // 클릭된 요소(e.target)가 <td>의 자식 요소(ex: <span>, #text)인 경우에도
    // 가장 가까운 <td> 요소를 찾아 cell 변수에 할당합니다.
    const cell = e.target.closest('td');
    
    if (cell) {
        // 크기 조절 중에는 셀 선택을 막음
        if (cell.closest('.data-table').classList.contains('resizing')) return;

        if (e.shiftKey) {
            // Shift 키를 누른 경우: 기존 선택 상태를 유지하고 현재 셀의 선택 상태를 토글합니다.
            cell.classList.toggle('selected');
        } else {
            // Shift 키를 누르지 않은 경우: 기존 선택 모두 해제 후 현재 셀만 선택합니다.
            document.querySelectorAll('.data-table td.selected').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
        }
    }
});

// 셀 내용 편집 이벤트: 입력이 끝날 때마다 저장
dataTable.addEventListener('input', (e) => {
    if (e.target.tagName === 'TD' && e.target.contentEditable === 'true') {
        saveSettings();
    }
});


// 🚀 색상 적용 함수: .selected 클래스에 글자색 또는 배경색 적용 (오류 수정 없음)
function applyColor(color) {
    const target = document.querySelector('input[name="colorTarget"]:checked').value; 
    
    // DOM에서 '.selected' 클래스를 가진 모든 TD를 다시 조회
    const cellsToApply = document.querySelectorAll('.data-table td.selected');

    cellsToApply.forEach(cell => {
        if (target === 'background') {
            cell.style.backgroundColor = color;
        } else { // target === 'text'
            cell.style.color = color;
        }
    });
}


// 📏 글꼴 크기 적용 함수 (변경 없음)
applyFontSizeBtn.addEventListener('click', () => {
    const newSize = fontSizeInput.value + 'px';
    document.querySelectorAll('.data-table td.selected').forEach(cell => {
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


// --- 3. 📐 셀 크기 조절 (Resizer) 로직 --- (변동 없음)
let currentResizer = null; 
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let isRowResizer = false;

// 초기화: 각 셀에 리사이저 추가
function initializeResizers() {
    // DOM이 변경되었으므로, 기존 리사이저를 제거하고 새로 추가
    document.querySelectorAll('.col-resizer, .row-resizer').forEach(r => r.remove());

    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        
        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        const tr = td.parentElement;
        // top-notice-row처럼 colspan이 있는 셀에도 리사이저가 추가되는 것을 방지
        if (td.getAttribute('colspan') === null) {
            let rowResizer = document.createElement('div');
            rowResizer.className = 'row-resizer';
            td.appendChild(rowResizer);
            rowResizer.addEventListener('mousedown', startResize);
        }
    });
}

// 리사이즈 시작, 중, 종료 함수는 변경 없음
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

function handleResize(e) {
    if (!currentResizer) return;

    const cell = currentResizer.parentElement;
    
    if (!isRowResizer) {
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

function stopResize() {
    currentResizer = null;
    dataTable.classList.remove('resizing');
    
    if (resizerDisplay) resizerDisplay.style.opacity = 0; 
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    saveSettings(); 
}


// --- 4. 🖱️ 왼쪽 메뉴 항목 색상 토글 기능 ---
function initializeLeftMenu() {
    const leftMenuItems = document.querySelectorAll('.left-item');
    leftMenuItems.forEach(item => {
        item.onclick = function() {
            leftMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            saveSettings(); 
        };
    });
}


// 🚀 특정 행 선택자에 강제 높이 스타일을 적용하는 함수
function applyRowHeight(selector, newHeight, isLoad = false) {
    const styleId = 'dynamic-row-height';
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    
    if (!isLoad) {
        // 기존 스타일을 유지하면서 새 스타일 추가 (단, 이 방식은 비효율적이므로, 
        // 실제 운영 환경에서는 스타일 시트를 동적으로 업데이트하는 것이 좋습니다)
        // 여기서는 기존 코드를 따라 isLoad가 아닐 때만 텍스트를 추가합니다.
    }
    
    // 인라인 스타일로 적용 (DOM에 저장됨)
    document.querySelectorAll(selector).forEach(row => {
        row.style.height = newHeight;
        row.querySelectorAll('td').forEach(td => td.style.height = newHeight);
    });
}


// --- 5. 📏 그룹별 행 높이 조절 기능 ---
function initializeRowHeightControl() {
    
    if (applyTopRowHeightBtn && topRowHeightInput) {
        applyTopRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = topRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            applyRowHeight('.top-data-header, .top-data-row', newHeight);
            saveSettings();
        });
    }

    if (applyMiddleRowHeightBtn && middleRowHeightInput) {
        applyMiddleRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = middleRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            applyRowHeight('.middle-notice-row, .middle-title-row', newHeight);
            saveSettings();
        });
    }

    if (applyBottomRowHeightBtn && bottomRowHeightInput) {
        applyBottomRowHeightBtn.addEventListener('click', () => {
            const newHeightValue = bottomRowHeightInput.value;
            const newHeight = newHeightValue + 'px';
            applyRowHeight('.bottom-data-header, .bottom-data-row', newHeight);
            saveSettings();
        });
    }
}


// 페이지 로드 시 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 1. 저장된 설정을 먼저 로드 (DOM 구조 변경 발생 가능)
    loadSettings(); 
    
    // 2. 새로운 DOM 구조에 맞춰 모든 이벤트와 리사이저를 초기화
    initializeColorTargetControl(); 
    initializeResizers(); 
    initializeLeftMenu(); 
    initializeRowHeightControl();
    
    // 다운로드 버튼에 이벤트 핸들러 할당
    document.querySelector('.download-button').onclick = () => downloadImage('capture-area', 'noblesse_data_capture.png');
});
