// ==========================================================
// 이미지 다운로드 함수 (html2canvas 사용)
// ==========================================================
function downloadImage() {
    const captureElement = document.getElementById('capture-area');
    
    // 로딩 표시 및 버튼 비활성화
    const button = document.querySelector('.download-button');
    const originalText = button.textContent;
    button.textContent = '이미지 생성 중... 잠시만 기다려주세요.';
    button.disabled = true;

    // html2canvas 실행: #capture-area 전체를 캡처
    html2canvas(captureElement, {
        scale: 2, // 고해상도 출력을 위해 스케일 증가
        allowTaint: true,
        useCORS: true
    }).then(canvas => {
        // 캔버스를 Data URL (PNG)로 변환
        const image = canvas.toDataURL('image/png');

        // 다운로드를 위한 링크 요소 생성 및 실행
        const a = document.createElement('a');
        a.href = image;
        a.download = 'noblesse_dashboard_capture.png';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 버튼 원래대로 복구
        button.textContent = originalText;
        button.disabled = false;
        
    }).catch(error => {
        // 에러 발생 시 처리
        console.error('이미지 생성 중 오류 발생:', error);
        button.textContent = '❌ 오류 발생 (콘솔 확인)';
        button.disabled = false;
        alert('이미지 생성에 실패했습니다. (배경 이미지가 로컬 파일인 경우 보안 문제로 실패할 수 있습니다.)');
    });
}

// ==========================================================
// 기존 대시보드 기능 로직 (색상 변경, 저장 등)
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    // downloadImage 함수를 전역에서 호출 가능하도록 설정
    window.downloadImage = downloadImage; 
    
    // --- 헬퍼 함수 ---
    function setVar(name, value) {
        document.documentElement.style.setProperty(name, value);
    }
    
    function saveSetting(key, value) {
        if (value) {
            localStorage.setItem(key, value);
        }
    }

    // --- 설정 로드 ---
    function loadSettings() {
        const settings = {
            '--table-header-bg': "headerBgColor",
            '--table-header-text': "headerTextColor",
            '--table-row-bg': "rowBgColor",
            '--table-row-text': "rowTextColor",
            '--col-num-text-color': "colNumTextColor",
        };

        for (const cssVar in settings) {
            const inputId = settings[cssVar];
            const storedValue = localStorage.getItem(inputId);
            const inputElement = document.getElementById(inputId);

            if (storedValue) {
                setVar(cssVar, storedValue);
                if (inputElement) {
                    inputElement.value = storedValue;
                }
            }
        }
    }
    
    loadSettings();

    // --- 이벤트 리스너 설정 ---
    
    // 왼쪽 메뉴 active 토글
    const leftItems = document.querySelectorAll(".left-item");
    leftItems.forEach(item => {
        item.addEventListener("click", () => {
            document.querySelector(".left-item.active")?.classList.remove("active");
            item.classList.add("active");
        });
    });

    // 컬러 입력 요소 ID 매칭
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

    // 1. 저장된 활성 색상 불러오기
    const storedActiveId = localStorage.getItem('activeColorInput');
    if (storedActiveId) {
        const storedActiveInput = document.getElementById(storedActiveId);
        if (storedActiveInput) {
            activeColorInput = storedActiveInput;
        }
    }
    window.activeColorInput = activeColorInput; // 전역 변수로 설정

    // 2. 색상 버튼 생성 및 추가
    presetColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        
        swatch.addEventListener('click', () => {
            if (window.activeColorInput) {
                const event = new Event('input', { bubbles: true });
                window.activeColorInput.value = color; 
                window.activeColorInput.dispatchEvent(event); 
            }
        });
        colorPaletteElement.appendChild(swatch);
    });

    // 3. 모든 컬러 입력 필드에 'focus' 이벤트 리스너 추가
    const colorInputs = document.querySelectorAll('.color-panel input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('focus', () => {
            window.activeColorInput = input;
            saveSetting('activeColorInput', input.id);
        });
        input.parentElement.addEventListener('click', () => {
            input.focus();
        });
    });

    // --- 이벤트 리스너 설정 (저장 로직 통합) ---
    
    if (headerBg) headerBg.addEventListener("input", e => { setVar('--table-header-bg', e.target.value); saveSetting('headerBgColor', e.target.value); });
    if (headerText) headerText.addEventListener("input", e => { setVar('--table-header-text', e.target.value); saveSetting('headerTextColor', e.target.value); });
    if (rowBg) rowBg.addEventListener("input", e => { setVar('--table-row-bg', e.target.value); saveSetting('rowBgColor', e.target.value); });
    if (rowText) rowText.addEventListener("input", e => { setVar('--table-row-text', e.target.value); saveSetting('rowTextColor', e.target.value); });

    if (colNumText) colNumText.addEventListener("input", e => { setVar('--col-num-text-color', e.target.value); saveSetting('colNumTextColor', e.target.value); });
});
