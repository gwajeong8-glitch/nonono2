// --- 1. 색상 팔레트 및 초기화 (이전 코드 유지) ---

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

// 색상 적용 함수 (현재 글자색으로 고정)
function applyColor(color) {
    selectedCells.forEach(cell => {
        // 배경색을 변경하고
        cell.style.backgroundColor = color;
        // 텍스트 색상을 대비되게 자동 설정 (밝은 색이면 글자를 검게)
        const isDark = (color) => {
            if (!color || color === 'transparent') return false;
            const hex = color.startsWith('#') ? color.substring(1) : '000000';
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            // 휘도 계산 (ITU-R BT.709)
            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            return luminance < 0.5; // 0.5보다 작으면 어두운 색으로 간주
        }
        cell.style.color = isDark(color) ? 'white' : 'black';
    });
}


// --- 2. 🖼️ 이미지 다운로드 기능 (이전 코드 유지) ---

function downloadImage(elementId, filename) {
    const element = document.getElementById(elementId);
    
    // 캡처 전에 설정 패널 숨기기
    const settingPanel = document.getElementById('settingPanel');
    settingPanel.style.display = 'none';

    html2canvas(element, {
        scale: 2, // 고해상도 캡처
        backgroundColor: null, // 배경 투명하게 (wrap의 배경이 transparent이므로)
        useCORS: true 
    }).then(canvas => {
        // 캡처 후 설정 패널 다시 보이기
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
        settingPanel.style.display = 'block'; // 오류 발생 시에도 패널 복구
    });
}


// --- 3. 📐 셀 크기 조절 (Resizer) 로직 추가 ---

let currentResizer = null; // 현재 드래그 중인 리사이저
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let isRowResizer = false;

// 초기화: 각 셀에 리사이저 추가
function initializeResizers() {
    document.querySelectorAll('.data-table tr:not(.middle-notice-row, .top-notice-row) td').forEach(td => {
        // 열 크기 조절기 (세로선) - 마지막 열 제외
        if (td.nextElementSibling) {
            let colResizer = document.createElement('div');
            colResizer.className = 'col-resizer';
            td.appendChild(colResizer);
            colResizer.addEventListener('mousedown', startResize);
        }

        // 행 크기 조절기 (가로선) - 마지막 행 제외
        const tr = td.parentElement;
        const tbody = tr.parentElement;
        if (tr.nextElementSibling) {
             // 병합 셀이 없는 행에만 리사이저 추가
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
    // 텍스트 편집 방지
    e.preventDefault(); 
    
    currentResizer = e.target;
    startX = e.clientX;
    startY = e.clientY;
    
    const cell = currentResizer.parentElement;
    
    if (currentResizer.classList.contains('col-resizer')) {
        // 열(너비) 조절 시작
        isRowResizer = false;
        startWidth = cell.offsetWidth;
        dataTable.classList.add('resizing'); // 리사이징 중 표시
    } else if (currentResizer.classList.contains('row-resizer')) {
        // 행(높이) 조절 시작
        isRowResizer = true;
        startHeight = cell.offsetHeight;
        dataTable.classList.add('resizing'); // 리사이징 중 표시
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
        if (newWidth > 30) { // 최소 너비 30px
            cell.style.width = newWidth + 'px';
            cell.style.minWidth = newWidth + 'px'; // min-width도 업데이트
        }
    } else {
        // 행(높이) 조절
        const deltaY = e.clientY - startY;
        const newHeight = startHeight + deltaY;
        if (newHeight > 10) { // 최소 높이 10px
            // 현재 셀의 부모 행 (<tr>)의 높이 설정
            const row = cell.parentElement;
            row.style.height = newHeight + 'px'; 
            
            // 모든 셀(<td>)의 높이도 설정
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


// 페이지 로드 시 리사이저 초기화
document.addEventListener('DOMContentLoaded', initializeResizers);
