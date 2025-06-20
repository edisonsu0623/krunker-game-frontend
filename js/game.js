// 簡化版遊戲類（不使用 Cannon.js 物理引擎）
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = { kills: 0, deaths: 0 };
        
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        
        this.settings = {
            sensitivity: 1.0,
            fov: 75
        };
        
        this.init();
    }
    
    init() {
        this.initThree();
        this.createWorld();
        this.initPlayer();
        this.initLighting();
        this.bindEvents();
        
        console.log('遊戲初始化完成');
    }
    
    initThree() {
        // 創建場景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // 天空藍
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // 創建攝影機
        this.camera = new THREE.PerspectiveCamera(
            this.settings.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // 創建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        console.log('Three.js 初始化完成');
    }
    
    createWorld() {
        // 創建地面
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 創建一些障礙物/建築
        this.createObstacles();
        
        console.log('世界場景創建完成');
    }
    
    createObstacles() {
        const obstacles = [
            { pos: [10, 2, 10], size: [2, 4, 2], color: 0xff4444 },
            { pos: [-10, 2, 10], size: [2, 4, 2], color: 0x44ff44 },
            { pos: [10, 2, -10], size: [2, 4, 2], color: 0x4444ff },
            { pos: [-10, 2, -10], size: [2, 4, 2], color: 0xffff44 },
            { pos: [0, 1, 15], size: [8, 2, 2], color: 0xff44ff },
            { pos: [0, 1, -15], size: [8, 2, 2], color: 0x44ffff },
            { pos: [15, 1, 0], size: [2, 2, 8], color: 0xffa500 },
            { pos: [-15, 1, 0], size: [2, 2, 8], color: 0x800080 }
        ];
        
        this.obstacles = [];
        
        obstacles.forEach(obstacle => {
            // 視覺物體
            const geometry = new THREE.BoxGeometry(...obstacle.size);
            const material = new THREE.MeshLambertMaterial({ color: obstacle.color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...obstacle.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            // 儲存障礙物資訊用於碰撞檢測
            this.obstacles.push({
                mesh: mesh,
                position: new THREE.Vector3(...obstacle.pos),
                size: new THREE.Vector3(...obstacle.size)
            });
        });
    }
    
    initPlayer() {
        this.player = new Player(this.scene, this.camera, this.obstacles);
        console.log('玩家初始化完成');
    }
    
    initLighting() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光（太陽光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
        
        console.log('光照初始化完成');
    }
    
    bindEvents() {
        // 視窗大小調整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 鍵盤事件
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // 滑鼠事件
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // 指針鎖定事件
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        
        console.log('事件綁定完成');
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onKeyDown(event) {
        if (this.gameState === 'playing' && this.player) {
            this.player.onKeyDown(event);
        }
        
        // ESC 鍵暫停/返回選單
        if (event.code === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            }
        }
    }
    
    onKeyUp(event) {
        if (this.gameState === 'playing' && this.player) {
            this.player.onKeyUp(event);
        }
    }
    
    onMouseDown(event) {
        if (this.gameState === 'playing' && this.player) {
            this.player.onMouseDown(event);
        }
    }
    
    onMouseUp(event) {
        if (this.gameState === 'playing' && this.player) {
            this.player.onMouseUp(event);
        }
    }
    
    onMouseMove(event) {
        if (this.gameState === 'playing' && this.player) {
            this.player.onMouseMove(event);
        }
    }
    
    onPointerLockChange() {
        if (document.pointerLockElement === this.renderer.domElement) {
            console.log('指針已鎖定');
        } else {
            console.log('指針已解鎖');
            if (this.gameState === 'playing') {
                this.pauseGame();
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = { kills: 0, deaths: 0 };
        
        // 鎖定滑鼠指針
        this.renderer.domElement.requestPointerLock();
        
        // 重置玩家位置
        if (this.player) {
            this.player.reset();
        }
        
        // 開始遊戲循環
        this.animate();
        
        console.log('遊戲開始');
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.exitPointerLock();
        console.log('遊戲暫停');
    }
    
    endGame() {
        this.gameState = 'gameOver';
        document.exitPointerLock();
        console.log('遊戲結束');
    }
    
    animate() {
        if (this.gameState !== 'playing') return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // 更新子彈
        this.updateBullets(deltaTime);
        
        // 渲染場景
        this.renderer.render(this.scene, this.camera);
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // 移除超出範圍或碰撞的子彈
            if (bullet.shouldRemove()) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    addBullet(bullet) {
        this.bullets.push(bullet);
    }
    
    updateScore(kills, deaths) {
        this.score.kills = kills;
        this.score.deaths = deaths;
    }
    
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // 更新攝影機 FOV
        if (newSettings.fov) {
            this.camera.fov = newSettings.fov;
            this.camera.updateProjectionMatrix();
        }
        
        // 更新玩家靈敏度
        if (this.player && newSettings.sensitivity) {
            this.player.updateSensitivity(newSettings.sensitivity);
        }
    }
}

// 全域遊戲實例
let game = null;

