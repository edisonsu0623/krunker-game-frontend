// 主程式入口
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 載入完成，開始初始化遊戲...');
    
    // 檢查瀏覽器支援
    if (!checkBrowserSupport()) {
        showBrowserError();
        return;
    }
    
    // 初始化 UI 管理器
    uiManager = new UIManager();
    
    // 初始化遊戲
    try {
        game = new Game();
        console.log('遊戲初始化成功');
        
        // 顯示主選單
        uiManager.showMainMenu();
        
        // 顯示歡迎訊息
        setTimeout(() => {
            uiManager.showMessage('歡迎來到 Krunker-like FPS！按 F1 查看控制說明', 5000, 'info');
        }, 1000);
        
    } catch (error) {
        console.error('遊戲初始化失敗:', error);
        showInitError(error);
    }
});

// 檢查瀏覽器支援
function checkBrowserSupport() {
    // 檢查 WebGL 支援
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
        console.error('瀏覽器不支援 WebGL');
        return false;
    }
    
    // 檢查 Pointer Lock API
    if (!document.body.requestPointerLock) {
        console.warn('瀏覽器不支援 Pointer Lock API，可能影響滑鼠控制');
    }
    
    // 檢查必要的 JavaScript 功能
    if (!window.requestAnimationFrame) {
        console.error('瀏覽器不支援 requestAnimationFrame');
        return false;
    }
    
    return true;
}

// 顯示瀏覽器錯誤
function showBrowserError() {
    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px;
            border-radius: 10px;
            border: 2px solid #ff0000;
            text-align: center;
            font-family: Arial, sans-serif;
            max-width: 500px;
        ">
            <h2 style="color: #ff0000; margin-bottom: 20px;">瀏覽器不支援</h2>
            <p style="margin-bottom: 20px;">
                您的瀏覽器不支援此遊戲所需的功能（WebGL）。
            </p>
            <p style="margin-bottom: 20px;">
                請使用以下瀏覽器的最新版本：
            </p>
            <ul style="text-align: left; margin-bottom: 20px;">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Microsoft Edge</li>
                <li>Safari (macOS)</li>
            </ul>
            <p>
                <a href="https://get.webgl.org/" target="_blank" style="color: #00ff00;">
                    檢查 WebGL 支援狀態
                </a>
            </p>
        </div>
    `;
}

// 顯示初始化錯誤
function showInitError(error) {
    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px;
            border-radius: 10px;
            border: 2px solid #ff0000;
            text-align: center;
            font-family: Arial, sans-serif;
            max-width: 500px;
        ">
            <h2 style="color: #ff0000; margin-bottom: 20px;">遊戲初始化失敗</h2>
            <p style="margin-bottom: 20px;">
                遊戲載入時發生錯誤，請重新整理頁面再試。
            </p>
            <p style="margin-bottom: 20px; font-size: 12px; color: #ccc;">
                錯誤詳情: ${error.message}
            </p>
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                background: #333;
                color: white;
                border: 1px solid #fff;
                border-radius: 5px;
                cursor: pointer;
            ">
                重新載入
            </button>
        </div>
    `;
}

// 全域錯誤處理
window.addEventListener('error', (event) => {
    console.error('全域錯誤:', event.error);
    
    if (uiManager) {
        uiManager.showMessage('發生錯誤，請檢查控制台', 5000, 'error');
    }
});

// 未處理的 Promise 拒絕
window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 拒絕:', event.reason);
    
    if (uiManager) {
        uiManager.showMessage('發生異步錯誤，請檢查控制台', 5000, 'error');
    }
});

// 視窗失去焦點時暫停遊戲
window.addEventListener('blur', () => {
    if (game && game.gameState === 'playing') {
        game.pauseGame();
        if (uiManager) {
            uiManager.showMessage('遊戲已暫停（視窗失去焦點）', 3000, 'info');
        }
    }
});

// 右鍵選單禁用（在遊戲中）
document.addEventListener('contextmenu', (event) => {
    if (game && game.gameState === 'playing') {
        event.preventDefault();
    }
});

// 防止某些按鍵的預設行為
document.addEventListener('keydown', (event) => {
    // 防止空白鍵滾動頁面
    if (event.code === 'Space' && game && game.gameState === 'playing') {
        event.preventDefault();
    }
    
    // 防止方向鍵滾動頁面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        if (game && game.gameState === 'playing') {
            event.preventDefault();
        }
    }
    
    // 防止 F5 重新整理（在遊戲中）
    if (event.key === 'F5' && game && game.gameState === 'playing') {
        event.preventDefault();
        if (uiManager) {
            uiManager.showMessage('遊戲進行中無法重新整理，請先暫停遊戲', 3000, 'info');
        }
    }
});

// 效能監控（開發用）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitorPerformance() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            console.log(`FPS: ${fps}`);
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(monitorPerformance);
    }
    
    monitorPerformance();
}

// 遊戲統計（可選）
class GameStats {
    constructor() {
        this.startTime = Date.now();
        this.totalShots = 0;
        this.totalHits = 0;
        this.totalKills = 0;
        this.totalDeaths = 0;
        this.maxKillStreak = 0;
        this.currentKillStreak = 0;
    }
    
    recordShot() {
        this.totalShots++;
    }
    
    recordHit() {
        this.totalHits++;
    }
    
    recordKill() {
        this.totalKills++;
        this.currentKillStreak++;
        this.maxKillStreak = Math.max(this.maxKillStreak, this.currentKillStreak);
    }
    
    recordDeath() {
        this.totalDeaths++;
        this.currentKillStreak = 0;
    }
    
    getAccuracy() {
        return this.totalShots > 0 ? (this.totalHits / this.totalShots * 100).toFixed(1) : 0;
    }
    
    getKDRatio() {
        return this.totalDeaths > 0 ? (this.totalKills / this.totalDeaths).toFixed(2) : this.totalKills;
    }
    
    getPlayTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    getSummary() {
        return {
            playTime: this.getPlayTime(),
            totalShots: this.totalShots,
            totalHits: this.totalHits,
            accuracy: this.getAccuracy(),
            kills: this.totalKills,
            deaths: this.totalDeaths,
            kdRatio: this.getKDRatio(),
            maxKillStreak: this.maxKillStreak
        };
    }
}

// 全域遊戲統計實例
let gameStats = new GameStats();

console.log('主程式載入完成');

