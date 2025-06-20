// UI 管理類
class UIManager {
    constructor() {
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            settingsMenu: document.getElementById('settings-menu'),
            hud: document.getElementById('hud'),
            gameOver: document.getElementById('game-over'),
            loading: document.getElementById('loading'),
            controlsInfo: document.getElementById('controls-info')
        };
        
        this.bindEvents();
        this.initSettings();
        
        console.log('UI 管理器初始化完成');
    }
    
    bindEvents() {
        // 主選單按鈕
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // 設定選單
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // 遊戲結束畫面
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // 控制說明
        document.getElementById('close-controls-btn').addEventListener('click', () => {
            this.hideControls();
        });
        
        // 設定滑桿
        this.bindSettingSliders();
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (event) => {
            if (event.code === 'F1') {
                event.preventDefault();
                this.toggleControls();
            }
        });
    }
    
    bindSettingSliders() {
        const sensitivitySlider = document.getElementById('sensitivity');
        const sensitivityValue = document.getElementById('sensitivity-value');
        const fovSlider = document.getElementById('fov');
        const fovValue = document.getElementById('fov-value');
        
        sensitivitySlider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            sensitivityValue.textContent = value.toFixed(1);
            
            if (game) {
                game.updateSettings({ sensitivity: value });
            }
        });
        
        fovSlider.addEventListener('input', (event) => {
            const value = parseInt(event.target.value);
            fovValue.textContent = value;
            
            if (game) {
                game.updateSettings({ fov: value });
            }
        });
    }
    
    initSettings() {
        // 從本地存儲載入設定
        const savedSettings = this.loadSettings();
        
        if (savedSettings.sensitivity) {
            document.getElementById('sensitivity').value = savedSettings.sensitivity;
            document.getElementById('sensitivity-value').textContent = savedSettings.sensitivity.toFixed(1);
        }
        
        if (savedSettings.fov) {
            document.getElementById('fov').value = savedSettings.fov;
            document.getElementById('fov-value').textContent = savedSettings.fov;
        }
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem('krunker-game-settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.warn('無法載入設定:', error);
            return {};
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                sensitivity: parseFloat(document.getElementById('sensitivity').value),
                fov: parseInt(document.getElementById('fov').value)
            };
            localStorage.setItem('krunker-game-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('無法保存設定:', error);
        }
    }
    
    showMainMenu() {
        this.hideAll();
        this.elements.mainMenu.classList.remove('hidden');
        
        if (game) {
            game.gameState = 'menu';
            document.exitPointerLock();
        }
    }
    
    showSettings() {
        this.hideAll();
        this.elements.settingsMenu.classList.remove('hidden');
        this.saveSettings();
    }
    
    showHUD() {
        this.hideAll();
        this.elements.hud.classList.remove('hidden');
    }
    
    showGameOver(finalScore) {
        this.hideAll();
        this.elements.gameOver.classList.remove('hidden');
        
        // 更新最終得分
        document.getElementById('final-kills').textContent = finalScore.kills;
        document.getElementById('final-deaths').textContent = finalScore.deaths;
    }
    
    showLoading(progress = 0) {
        this.hideAll();
        this.elements.loading.classList.remove('hidden');
        
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }
    
    showControls() {
        this.elements.controlsInfo.classList.remove('hidden');
    }
    
    hideControls() {
        this.elements.controlsInfo.classList.add('hidden');
    }
    
    toggleControls() {
        if (this.elements.controlsInfo.classList.contains('hidden')) {
            this.showControls();
        } else {
            this.hideControls();
        }
    }
    
    hideAll() {
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.classList.add('hidden');
            }
        });
    }
    
    startGame() {
        this.showLoading(0);
        
        // 模擬載入過程
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 20;
            this.showLoading(Math.min(progress, 100));
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    this.hideLoading();
                    this.showHUD();
                    
                    if (game) {
                        game.startGame();
                    }
                }, 500);
            }
        }, 100);
    }
    
    updateScore(kills, deaths) {
        const killsElement = document.getElementById('kills');
        const deathsElement = document.getElementById('deaths');
        
        if (killsElement) killsElement.textContent = kills;
        if (deathsElement) deathsElement.textContent = deaths;
    }
    
    updateHealth(health, maxHealth) {
        const healthPercentage = (health / maxHealth) * 100;
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        
        if (healthFill) {
            healthFill.style.width = `${healthPercentage}%`;
        }
        if (healthText) {
            healthText.textContent = Math.ceil(health);
        }
    }
    
    updateAmmo(current, total) {
        const ammoCurrent = document.getElementById('ammo-current');
        const ammoTotal = document.getElementById('ammo-total');
        
        if (ammoCurrent) ammoCurrent.textContent = current;
        if (ammoTotal) ammoTotal.textContent = total;
    }
    
    showMessage(message, duration = 3000, type = 'info') {
        // 創建訊息元素
        const messageElement = document.createElement('div');
        messageElement.className = `game-message ${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#ffff00'};
            z-index: 10000;
            font-size: 16px;
            font-weight: bold;
            pointer-events: none;
        `;
        
        document.body.appendChild(messageElement);
        
        // 自動移除
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, duration);
    }
    
    showDamageIndicator(damage, position) {
        // 創建傷害指示器
        const indicator = document.createElement('div');
        indicator.textContent = `-${damage}`;
        indicator.style.cssText = `
            position: fixed;
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            pointer-events: none;
            z-index: 9999;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            animation: damageFloat 1s ease-out forwards;
        `;
        
        // 設置位置
        indicator.style.left = `${position.x}px`;
        indicator.style.top = `${position.y}px`;
        
        document.body.appendChild(indicator);
        
        // 添加動畫樣式
        if (!document.getElementById('damage-animation-style')) {
            const style = document.createElement('style');
            style.id = 'damage-animation-style';
            style.textContent = `
                @keyframes damageFloat {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 移除指示器
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 1000);
    }
}

// 全域 UI 管理器實例
let uiManager = null;

