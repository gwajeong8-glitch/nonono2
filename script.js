// ==========================================================
// 이미지 다운로드 함수 (html2canvas 사용)
// ==========================================================
function downloadImage() {
    // 캡처 전에 활성 셀 하이라이트 제거
    const activeCell = document.querySelector('.active-cell');
    if (activeCell) activeCell.classList.remove('active-cell');

    const captureElement = document.getElementById('capture-area');
    
    // 로딩 표시 및 버튼 비활성화
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
        a.download = 'noblesse_dashboard_capture.png';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 버튼 원래대로 복구
        button.textContent = originalText;
        button.disabled = false;
        
        // 캡처 후 활성 셀 하이라이트 복구
        if (activeCell) activeCell.classList.add('active-cell');

    }).catch(error => {
        console.error('이미지 생성 중 오류 발생:', error);
        button.textContent = '❌ 오류 발생 (콘솔 확인)';
        button.disabled = false;
        if (activeCell) activeCell.classList.add('active-cell');
        alert('이미지 생성에 실패했습니다.');
    });
}

// ==========================================================
// 대시보드 기능 로직 (셀 색상 편집)
// ==========================================================

// 현재 활성화된 셀 (클릭하여 색상 적용 대상)
let currentActiveCell = null; 
// 현재 색상 적용 대상 ('text' 또는 'background')
let currentColorTarget = 'text';

// ----------------------------------------------------
// 헬퍼 함수 및 로컬 스토리지 관리
// ----------------------------------------------------

// 셀의 고유 ID를 생성합니다. (예: row-1-col-2)
function getCellId(cell) {
    const rowIndex = cell.closest('tr').rowIndex;
    const colIndex = cell.cellIndex;
    return `cell-${rowIndex}-${colIndex}`;
}

// 개별 셀의 커스텀 스타일을 로컬 스토리지에 저장합니다.
function saveCellCustomStyle(cell, type, color) {
    const id = getCellId(cell);
    let styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
    
    if (!styles[id]) {
        styles[id] = {};
    }
    styles[id][type] = color; // type은 'color' 또는 'backgroundColor'
    
    localStorage.setItem('customCellStyles', JSON.stringify(styles));
}

// ----------------------------------------------------
// 이벤트 핸들러 및 초기화
// ----------------------------------------------------

// 활성 셀에 색상 적용
function applyColorToActiveTarget(color) {
    if (currentActiveCell) {
        const styleProp = currentColorTarget === 'text' ? 'color' : 'backgroundColor';
        currentActiveCell.style[styleProp] = color;
        saveCellCustomStyle(currentActiveCell, styleProp, color);
    }
}

// 셀 클릭 이벤트 핸들러
function handleCellClick(event) {
    const cell = event.currentTarget; 

    // 이전 활성 셀에서 active-cell 클래스 제거
    if (currentActiveCell) {
        currentActiveCell.classList.remove('active-cell');
    }
    
    // 새 셀을 활성 셀로 설정 및 클래스 추가
    currentActiveCell = cell;
    currentActiveCell.classList.add('active-cell');
}

// '셀 편집 모드' 토글 함수 (현재는 셀 클릭 시 활성화)
function toggleEditMode() {
    const button = document.getElementById('toggleEditMode');
    button.classList.add('active'); // 항상 활성 모드 표시
    
    // 버튼 클릭 시 활성 셀 해제 (선택을 초기화)
    if (currentActiveCell) {
        currentActiveCell.classList.remove('active-cell');
        currentActiveCell = null;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    window.downloadImage = downloadImage; 
    window.toggleEditMode = toggleEditMode;
    
    // ----------------------------------------------------
    // 1. 개별 셀 스타일 로드 (매우 중요)
    // ----------------------------------------------------
    function loadCustomCellStyles() {
        const styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
        const allCells = document.querySelectorAll('.data-table td');

        allCells.forEach(cell => {
            const id = getCellId(cell);
            if (styles[id]) {
                if (styles[id].color) {
                    cell.style.color = styles[id].color;
                }
                if (styles[id].backgroundColor) {
                    cell.style.backgroundColor = styles[id].backgroundColor;
                }
            }
        });
    }

    loadCustomCellStyles(); 

    // ----------------------------------------------------
    // 2. 셀 이벤트 리스너 설정
    // ----------------------------------------------------
    const tableCells = document.querySelectorAll('.data-table td');
    tableCells.forEach(cell => {
        // 셀 클릭 시 활성 셀로 지정
        cell.addEventListener('click', handleCellClick);
    });

    // 색상 적용 대상 라디오 버튼 이벤트 리스너
    const colorTargetRadios = document.getElementsByName('colorTarget');
    colorTargetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentColorTarget = e.target.value;
        });
    });

    // ----------------------------------------------------
    // 3. 컬러 팔레트 로직 (40색)
    // ----------------------------------------------------
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
        
        // 팔레트 클릭 시: 활성 셀에 색상 적용
        swatch.addEventListener('click', () => {
            applyColorToActiveTarget(color);
        });
        colorPaletteElement.appendChild(swatch);
    });
});
