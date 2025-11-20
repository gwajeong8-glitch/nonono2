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
// 대시보드 기능 로직 (색상 변경, 저장 등)
// ==========================================================

// 현재 활성화된 셀 (클릭하여 색상 적용 대상)
let currentActiveCell = null; 
// 현재 색상 적용 대상 ('text' 또는 'background')
let currentColorTarget = 'text';

// ----------------------------------------------------
// 헬퍼 함수 및 로컬 스토리지 관리
// ----------------------------------------------------

function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
}

function saveSetting(key, value) {
    if (value) {
        localStorage.setItem(key, value);
    }
}

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

function applyColorToActiveTarget(color) {
    if (currentActiveCell) {
        const styleProp = currentColorTarget === 'text' ? 'color' : 'backgroundColor';
        currentActiveCell.style[styleProp] = color;
        saveCellCustomStyle(currentActiveCell, styleProp, color);
    } else {
        // 활성 셀이 없으면 일반 전역 컬러 피커에 값 적용 (기존 로직)
        if (window.activeColorInput) {
            const event = new Event('input', { bubbles: true });
            window.activeColorInput.value = color;
            window.activeColorInput.dispatchEvent(event);
        }
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
    
    // 현재 활성 셀의 색상을 컬러 피커에 반영 (옵션)
    const styleProp = currentColorTarget === 'text' ? 'color' : 'backgroundColor';
    let currentColor = getComputedStyle(cell)[styleProp];
    
    // 만약 셀에 인라인 스타일이 있다면 그 값을 사용
    if (cell.style[styleProp]) {
        currentColor = cell.style[styleProp];
    } 

    // 컬러 피커 요소가 있다면 값을 설정
    const colorInputId = window.activeColorInput ? window.activeColorInput.id : (currentColorTarget === 'text' ? 'rowTextColor' : 'rowBgColor');
    const activeInput = document.getElementById(colorInputId);
    
    if (activeInput) {
        // RGB를 HEX로 변환하는 간단한 로직 (완벽하지 않을 수 있지만 시각적 피드백 제공)
        function rgbToHex(rgb) {
            if (!rgb || rgb.startsWith('var')) return '#000000'; // 변수나 null 처리
            const hex = x => ('0' + parseInt(x).toString(16)).slice(-2);
            if (rgb.startsWith('rgb')) {
                const parts = rgb.match(/\d+/g);
                return parts ? '#' + hex(parts[0]) + hex(parts[1]) + hex(parts[2]) : '#000000';
            }
            return rgb;
        }

        activeInput.value = rgbToHex(currentColor);
        window.activeColorInput = activeInput; // 활성 컬러 피커 업데이트
        saveSetting('activeColorInput', activeInput.id);
    }
}

// '셀 편집 모드' 토글 함수
function toggleEditMode() {
    const button = document.getElementById('toggleEditMode');
    const info = document.getElementById('selectionModeInfo');
    
    // 현재는 이 버튼이 항상 '색상 편집 모드'를 나타내므로,
    // 간단히 시각적 피드백만 제공합니다.
    button.classList.add('active');
    info.style.display = 'block'; 
    
    if (currentActiveCell) {
        currentActiveCell.classList.remove('active-cell');
        currentActiveCell = null;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    window.downloadImage = downloadImage; 
    window.toggleEditMode = toggleEditMode;
    
    // --- 초기화 및 전역 설정 로드 ---
    loadSettings();

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

    loadCustomCellStyles(); // 커스텀 스타일 적용

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
            // 대상이 바뀌면 현재 활성 셀의 색상을 피커에 반영 (사용자 피드백)
            if (currentActiveCell) {
                handleCellClick({ currentTarget: currentActiveCell }); 
            }
        });
    });

    // ----------------------------------------------------
    // 3. 기존의 전역 컬러 로직
    // ----------------------------------------------------
    
    // 왼쪽 메뉴 active 토글 (기존 기능 유지)
    const leftItems = document.querySelectorAll(".left-item");
    leftItems.forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".left-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });

    const headerBg = document.getElementById("headerBgColor");
    const headerText = document.getElementById("headerTextColor");
    const rowBg = document.getElementById("rowBgColor");
    const rowText = document.getElementById("rowTextColor");
    const colNumText = document.getElementById("colNumTextColor");
    
    // ★ 컬러 팔레트 로직: 40개 확장 ★
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
    let activeColorInput = headerBg;

    const storedActiveId = localStorage.getItem('activeColorInput');
    if (storedActiveId) {
        const storedActiveInput = document.getElementById(storedActiveId);
        if (storedActiveInput) {
            activeColorInput = storedActiveInput;
        }
    }
    window.activeColorInput = activeColorInput; 

    presetColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        
        // 팔레트 클릭 시: 활성 셀이 있으면 셀에 적용, 없으면 전역 피커에 적용
        swatch.addEventListener('click', () => {
            applyColorToActiveTarget(color);
        });
        colorPaletteElement.appendChild(swatch);
    });

    // 4. 컬러 입력 필드 이벤트 리스너 (전역/활성 셀 모두 제어)
    const colorInputs = document.querySelectorAll('.color-panel input[type="color"]');
    colorInputs.forEach(input => {
        // A. 'focus' 이벤트: 활성 피커 설정
        input.addEventListener('focus', () => {
            window.activeColorInput = input;
            saveSetting('activeColorInput', input.id);
            // 활성 셀이 있으면 하이라이트 해제 (전역 설정과 충돌 방지)
            if (currentActiveCell) {
                 currentActiveCell.classList.remove('active-cell');
                 currentActiveCell = null;
            }
        });
        input.parentElement.addEventListener('click', () => {
            input.focus();
        });
        
        // B. 'input' 이벤트: 색상 변경 적용 (활성 셀이 없어야 전역 설정)
        if (input.id === 'headerBgColor') input.addEventListener("input", e => { setVar('--table-header-bg', e.target.value); saveSetting('headerBgColor', e.target.value); });
        if (input.id === 'headerTextColor') input.addEventListener("input", e => { setVar('--table-header-text', e.target.value); saveSetting('headerTextColor', e.target.value); });
        if (input.id === 'rowBgColor') input.addEventListener("input", e => { setVar('--table-row-bg', e.target.value); saveSetting('rowBgColor', e.target.value); });
        if (input.id === 'rowTextColor') input.addEventListener("input", e => { setVar('--table-row-text', e.target.value); saveSetting('rowTextColor', e.target.value); });
        if (input.id === 'colNumTextColor') input.addEventListener("input", e => { setVar('--col-num-text-color', e.target.value); saveSetting('colNumTextColor', e.target.value); });

    });
});
