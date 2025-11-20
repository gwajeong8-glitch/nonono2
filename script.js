// ==========================================================
// 전역 변수 및 이미지 다운로드 함수
// ==========================================================

// 현재 활성 셀 그룹 (클릭하여 색상 적용 대상)
let currentActiveCells = [];
// 현재 색상 적용 대상 ('text' 또는 'background')
let currentColorTarget = 'text';

function downloadImage() {
    // 캡처 전에 활성 셀 하이라이트 제거
    currentActiveCells.forEach(cell => cell.classList.remove('active-cell'));

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

        // 버튼 원래대로 복구 및 활성 셀 복구
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
// 다중 셀 편집 로직 (색상, 글꼴 크기)
// ==========================================================

// 셀의 고유 ID를 생성합니다. (예: row-1-col-2)
function getCellId(cell) {
    const rowIndex = cell.closest('tr').rowIndex;
    const colIndex = cell.cellIndex;
    return `cell-${rowIndex}-${colIndex}`;
}

// 개별 셀의 커스텀 스타일을 로컬 스토리지에 저장합니다.
function saveCellCustomStyle(cell, type, value) {
    const id = getCellId(cell);
    let styles = JSON.parse(localStorage.getItem('customCellStyles') || '{}');
    
    if (!styles[id]) {
        styles[id] = {};
    }
    styles[id][type] = value; // type은 'color', 'backgroundColor', 'fontSize'
    
    localStorage.setItem('customCellStyles', JSON.stringify(styles));
}

// 활성 셀 그룹에 색상 적용
function applyColorToActiveTarget(color) {
    if (currentActiveCells.length === 0) return;
    
    const styleProp = currentColorTarget === 'text' ? 'color' : 'backgroundColor';
    
    currentActiveCells.forEach(cell => {
        cell.style[styleProp] = color;
        saveCellCustomStyle(cell, styleProp, color);
    });
}

// 활성 셀 그룹에 글꼴 크기 적용
function applyFontSizeToActiveCells(size) {
    if (currentActiveCells.length === 0) return;

    currentActiveCells.forEach(cell => {
        cell.style.fontSize = size + 'px'; // 폰트 크기 적용
        saveCellCustomStyle(cell, 'fontSize', size + 'px');
    });
}


// 셀 클릭 이벤트 핸들러 (Shift 키를 이용한 다중 선택)
function handleCellClick(event) {
    const cell = event.currentTarget;

    if (event.shiftKey) {
        // Shift + 클릭: 다중 선택 토글
        if (cell.classList.contains('active-cell')) {
            cell.classList.remove('active-cell');
            currentActiveCells = currentActiveCells.filter(c => c !== cell);
        } else {
            cell.classList.add('active-cell');
            currentActiveCells.push(cell);
        }
    } else {
        // 일반 클릭: 단일 선택 (이전 선택 모두 해제)
        currentActiveCells.forEach(c => c.classList.remove('active-cell'));
        currentActiveCells = [];
        
        cell.classList.add('active-cell');
        currentActiveCells.push(cell);
    }
}

// ==========================================================
// 초기화 및 DOM 로드
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    // 전역 함수 등록
    window.downloadImage = downloadImage;
    
    // --- UI 요소 초기화 ---
    
    // 1. 개별 셀 스타일 로드 (색상 및 글꼴 크기)
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
                if (styles[id].fontSize) {
                    cell.style.fontSize = styles[id].fontSize;
                }
            }
            // 셀의 높이 조절을 위해 contenteditable 속성 추가
            // (이미 HTML에 추가되어 있을 경우 제거하거나 중복 확인 필요)
            if (!cell.hasAttribute('contenteditable')) {
                cell.setAttribute('contenteditable', 'true'); 
            }
        });
    }

    loadCustomCellStyles();

    // 2. 셀 이벤트 리스너 설정
    const tableCells = document.querySelectorAll('.data-table td');
    tableCells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // 3. 색상 적용 대상 라디오 버튼 이벤트 리스너
    const colorTargetRadios = document.getElementsByName('colorTarget');
    colorTargetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentColorTarget = e.target.value;
        });
    });

    // 4. 컬러 팔레트 로직 (40색)
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
        
        // 팔레트 클릭 시: 활성 셀 그룹에 색상 적용
        swatch.addEventListener('click', () => {
            applyColorToActiveTarget(color);
        });
        colorPaletteElement.appendChild(swatch);
    });
    
    // 5. 글꼴 크기 조절 입력창 추가
    // 중복 추가 방지를 위해 이미 존재하는지 확인 후 추가
    if (!document.getElementById('fontSizeInput')) {
        const fontSizeControl = document.createElement('div');
        fontSizeControl.innerHTML = `
            <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid #333;">
                <label for="fontSizeInput">글꼴 크기 (px): </label>
                <input type="number" id="fontSizeInput" min="8" max="48" value="14" style="width: 50px; margin-left: 5px; color: black;">
                <button id="applyFontSizeBtn" style="margin-left: 5px; padding: 3px 8px; background: #555; color: white; border: none; border-radius: 3px; cursor: pointer;">적용</button>
            </div>
        `;
        document.querySelector('.setting-panel').insertBefore(fontSizeControl, document.querySelector('.download-button'));

        document.getElementById('applyFontSizeBtn').addEventListener('click', () => {
            const size = document.getElementById('fontSizeInput').value;
            if (size) {
                applyFontSizeToActiveCells(parseInt(size));
            }
        });
    }

    // 6. 기타 UI 로직: 왼쪽 메뉴 active 토글
    const leftItems = document.querySelectorAll(".left-item");
    leftItems.forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".left-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });
});
