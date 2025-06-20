// 簡化版玩家類（不使用物理引擎）
class Player {
    constructor(scene, camera, obstacles) {
        this.scene = scene;
        this.camera = camera;
        this.obstacles = obstacles;
        
        // 玩家狀態
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        
        // 位置和移動
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveSpeed = 10;
        this.jumpSpeed = 8;
        this.gravity = -20;
        this.isOnGround = false;
        
        // 視角控制
        this.mouseSensitivity = 0.002;
        this.pitchObject = new THREE.Object3D();
        this.yawObject = new THREE.Object3D();
        
        // 輸入狀態
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            shift: false
        };
        
        this.mouseButtons = {
            left: false,
            right: false
        };
        
        // 武器
        this.weapon = new Weapon(scene, obstacles);
        
        this.init();
    }
    
    init() {
        // 設置攝影機層次結構
        this.yawObject.add(this.pitchObject);
        this.pitchObject.add(this.camera);
        this.scene.add(this.yawObject);
        
        this.reset();
        
        console.log('玩家初始化完成');
    }
    
    reset() {
        this.health = this.maxHealth;
        this.isAlive = true;
        
        // 重置位置
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        
        // 重置視角
        this.yawObject.rotation.y = 0;
        this.pitchObject.rotation.x = 0;
        
        // 重置武器
        this.weapon.reset();
        
        console.log('玩家重置完成');
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateMovement(deltaTime);
        this.updateCamera();
        this.updateWeapon(deltaTime);
        
        // 更新 UI
        this.updateUI();
    }
    
    updateMovement(deltaTime) {
        // 計算移動方向
        this.direction.set(0, 0, 0);
        
        if (this.keys.forward) this.direction.z -= 1;
        if (this.keys.backward) this.direction.z += 1;
        if (this.keys.left) this.direction.x -= 1;
        if (this.keys.right) this.direction.x += 1;
        
        // 正規化方向向量
        if (this.direction.length() > 0) {
            this.direction.normalize();
            
            // 根據玩家視角調整移動方向
            this.direction.applyQuaternion(this.yawObject.quaternion);
        }
        
        // 水平移動
        const horizontalVelocity = this.direction.multiplyScalar(this.moveSpeed);
        this.velocity.x = horizontalVelocity.x;
        this.velocity.z = horizontalVelocity.z;
        
        // 跳躍
        if (this.keys.jump && this.isOnGround) {
            this.velocity.y = this.jumpSpeed;
            this.isOnGround = false;
        }
        
        // 重力
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        // 更新位置
        const newPosition = this.position.clone();
        newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // 碰撞檢測
        const collisionResult = this.checkCollisions(newPosition);
        
        // 應用位置更新
        this.position.copy(collisionResult.position);
        this.isOnGround = collisionResult.onGround;
        
        // 如果在地面上，停止垂直速度
        if (this.isOnGround && this.velocity.y <= 0) {
            this.velocity.y = 0;
        }
    }
    
    checkCollisions(newPosition) {
        const result = {
            position: newPosition.clone(),
            onGround: false
        };
        
        // 地面碰撞檢測
        if (newPosition.y <= 1) {
            result.position.y = 1;
            result.onGround = true;
        }
        
        // 障礙物碰撞檢測
        const playerRadius = 0.5;
        
        for (const obstacle of this.obstacles) {
            const obstaclePos = obstacle.position;
            const obstacleSize = obstacle.size;
            
            // 簡單的 AABB 碰撞檢測
            const minX = obstaclePos.x - obstacleSize.x / 2 - playerRadius;
            const maxX = obstaclePos.x + obstacleSize.x / 2 + playerRadius;
            const minZ = obstaclePos.z - obstacleSize.z / 2 - playerRadius;
            const maxZ = obstaclePos.z + obstacleSize.z / 2 + playerRadius;
            const minY = obstaclePos.y - obstacleSize.y / 2;
            const maxY = obstaclePos.y + obstacleSize.y / 2;
            
            if (result.position.x >= minX && result.position.x <= maxX &&
                result.position.z >= minZ && result.position.z <= maxZ &&
                result.position.y >= minY && result.position.y <= maxY + 1) {
                
                // 計算推出方向
                const centerX = obstaclePos.x;
                const centerZ = obstaclePos.z;
                
                const deltaX = result.position.x - centerX;
                const deltaZ = result.position.z - centerZ;
                
                // 推出到最近的邊界
                if (Math.abs(deltaX) > Math.abs(deltaZ)) {
                    result.position.x = deltaX > 0 ? maxX : minX;
                } else {
                    result.position.z = deltaZ > 0 ? maxZ : minZ;
                }
                
                // 如果玩家在障礙物頂部
                if (result.position.y <= maxY + 0.1 && this.velocity.y <= 0) {
                    result.position.y = maxY;
                    result.onGround = true;
                }
            }
        }
        
        return result;
    }
    
    updateCamera() {
        // 同步攝影機位置
        this.yawObject.position.copy(this.position);
        this.yawObject.position.y += 0.8; // 眼睛高度
    }
    
    updateWeapon(deltaTime) {
        if (this.weapon) {
            this.weapon.update(deltaTime);
            
            // 射擊
            if (this.mouseButtons.left && this.weapon.canShoot()) {
                this.shoot();
            }
        }
    }
    
    shoot() {
        if (!this.weapon.canShoot()) return;
        
        // 獲取射擊方向
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        // 獲取射擊起點
        const origin = this.camera.position.clone();
        
        // 創建子彈
        const bullet = this.weapon.shoot(origin, direction);
        if (bullet && game) {
            game.addBullet(bullet);
        }
    }
    
    takeDamage(damage) {
        if (!this.isAlive) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        console.log(`玩家受到 ${damage} 點傷害，剩餘血量: ${this.health}`);
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    die() {
        this.isAlive = false;
        console.log('玩家死亡');
        
        // 更新得分
        if (game) {
            game.updateScore(game.score.kills, game.score.deaths + 1);
        }
        
        // 延遲重生
        setTimeout(() => {
            this.respawn();
        }, 3000);
    }
    
    respawn() {
        this.reset();
        console.log('玩家重生');
    }
    
    updateUI() {
        // 更新血量條
        const healthPercentage = (this.health / this.maxHealth) * 100;
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        
        if (healthFill) {
            healthFill.style.width = `${healthPercentage}%`;
        }
        if (healthText) {
            healthText.textContent = Math.ceil(this.health);
        }
        
        // 更新彈藥顯示
        if (this.weapon) {
            const ammoCurrent = document.getElementById('ammo-current');
            const ammoTotal = document.getElementById('ammo-total');
            
            if (ammoCurrent) {
                ammoCurrent.textContent = this.weapon.currentAmmo;
            }
            if (ammoTotal) {
                ammoTotal.textContent = this.weapon.totalAmmo;
            }
        }
    }
    
    updateSensitivity(sensitivity) {
        this.mouseSensitivity = sensitivity * 0.002;
    }
    
    // 事件處理
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                this.keys.shift = true;
                break;
            case 'KeyR':
                if (this.weapon) {
                    this.weapon.reload();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
                this.keys.shift = false;
                break;
        }
    }
    
    onMouseDown(event) {
        switch (event.button) {
            case 0: // 左鍵
                this.mouseButtons.left = true;
                break;
            case 2: // 右鍵
                this.mouseButtons.right = true;
                break;
        }
    }
    
    onMouseUp(event) {
        switch (event.button) {
            case 0: // 左鍵
                this.mouseButtons.left = false;
                break;
            case 2: // 右鍵
                this.mouseButtons.right = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement !== game.renderer.domElement) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // 水平旋轉（偏航）
        this.yawObject.rotation.y -= movementX * this.mouseSensitivity;
        
        // 垂直旋轉（俯仰）
        this.pitchObject.rotation.x -= movementY * this.mouseSensitivity;
        
        // 限制俯仰角度
        this.pitchObject.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, this.pitchObject.rotation.x)
        );
    }
}

