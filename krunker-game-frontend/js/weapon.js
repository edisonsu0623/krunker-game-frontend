// 簡化版武器類（不使用物理引擎）
class Weapon {
    constructor(scene, obstacles) {
        this.scene = scene;
        this.obstacles = obstacles;
        
        // 武器屬性
        this.damage = 25;
        this.fireRate = 600; // 每分鐘射擊次數
        this.range = 100;
        this.currentAmmo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 90;
        this.reloadTime = 2000; // 毫秒
        
        // 射擊狀態
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // 後座力
        this.recoil = 0.02;
        this.recoilRecovery = 0.95;
        this.currentRecoil = 0;
        
        console.log('武器初始化完成');
    }
    
    update(deltaTime) {
        // 更新後座力恢復
        this.currentRecoil *= this.recoilRecovery;
        
        // 檢查重新裝彈
        if (this.isReloading) {
            const now = Date.now();
            if (now - this.reloadStartTime >= this.reloadTime) {
                this.finishReload();
            }
        }
    }
    
    canShoot() {
        const now = Date.now();
        const timeSinceLastShot = now - this.lastShotTime;
        const shotInterval = 60000 / this.fireRate; // 毫秒
        
        return !this.isReloading && 
               this.currentAmmo > 0 && 
               timeSinceLastShot >= shotInterval;
    }
    
    shoot(origin, direction) {
        if (!this.canShoot()) return null;
        
        // 消耗彈藥
        this.currentAmmo--;
        this.lastShotTime = Date.now();
        
        // 添加後座力
        this.currentRecoil += this.recoil;
        
        // 應用後座力到射擊方向
        const recoilDirection = direction.clone();
        recoilDirection.y += this.currentRecoil * (Math.random() - 0.5);
        recoilDirection.x += this.currentRecoil * (Math.random() - 0.5) * 0.5;
        recoilDirection.normalize();
        
        // 創建子彈
        const bullet = new Bullet(this.scene, this.obstacles, origin, recoilDirection, this.damage, this.range);
        
        // 播放射擊音效（如果有的話）
        this.playShootSound();
        
        // 自動重新裝彈
        if (this.currentAmmo === 0 && this.totalAmmo > 0) {
            setTimeout(() => {
                this.reload();
            }, 100);
        }
        
        console.log(`射擊！剩餘彈藥: ${this.currentAmmo}/${this.totalAmmo}`);
        
        return bullet;
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo || this.totalAmmo === 0) {
            return;
        }
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        console.log('開始重新裝彈...');
    }
    
    finishReload() {
        const ammoNeeded = this.maxAmmo - this.currentAmmo;
        const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
        
        this.currentAmmo += ammoToReload;
        this.totalAmmo -= ammoToReload;
        this.isReloading = false;
        
        console.log(`重新裝彈完成！彈藥: ${this.currentAmmo}/${this.totalAmmo}`);
    }
    
    playShootSound() {
        // 這裡可以添加音效播放邏輯
        // 例如使用 Web Audio API 或 HTML5 Audio
    }
    
    reset() {
        this.currentAmmo = this.maxAmmo;
        this.totalAmmo = 90;
        this.isReloading = false;
        this.currentRecoil = 0;
        this.lastShotTime = 0;
    }
}

// 簡化版子彈類（使用射線檢測）
class Bullet {
    constructor(scene, obstacles, origin, direction, damage, maxRange) {
        this.scene = scene;
        this.obstacles = obstacles;
        this.damage = damage;
        this.maxRange = maxRange;
        this.travelDistance = 0;
        this.speed = 100;
        
        // 子彈位置和方向
        this.position = origin.clone();
        this.direction = direction.clone();
        this.velocity = this.direction.clone().multiplyScalar(this.speed);
        
        // 創建子彈視覺效果
        this.createVisual();
        
        // 射線檢測器
        this.raycaster = new THREE.Raycaster();
        
        this.startTime = Date.now();
        this.lifeTime = 5000; // 5秒生命週期
        
        console.log('子彈創建');
    }
    
    createVisual() {
        // 創建子彈軌跡線
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            this.position.x, this.position.y, this.position.z,
            this.position.x, this.position.y, this.position.z
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        this.visual = new THREE.Line(geometry, material);
        this.scene.add(this.visual);
    }
    
    update(deltaTime) {
        // 更新子彈位置
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        const newPosition = this.position.clone().add(movement);
        
        // 射線檢測碰撞
        this.raycaster.set(this.position, this.direction);
        
        // 檢測與障礙物的碰撞
        const intersects = [];
        
        for (const obstacle of this.obstacles) {
            const intersection = this.raycaster.intersectObject(obstacle.mesh);
            if (intersection.length > 0) {
                intersects.push(...intersection);
            }
        }
        
        // 檢測與地面的碰撞
        if (newPosition.y <= 0) {
            this.onHit(new THREE.Vector3(newPosition.x, 0, newPosition.z));
            return;
        }
        
        // 如果有碰撞
        if (intersects.length > 0) {
            // 找到最近的碰撞點
            intersects.sort((a, b) => a.distance - b.distance);
            const closestHit = intersects[0];
            
            if (closestHit.distance <= movement.length()) {
                this.onHit(closestHit.point);
                return;
            }
        }
        
        // 更新位置
        this.position.copy(newPosition);
        this.travelDistance += movement.length();
        
        // 更新軌跡線
        this.updateVisual();
        
        // 檢查是否超出範圍或生命週期
        const now = Date.now();
        if (this.travelDistance > this.maxRange || now - this.startTime > this.lifeTime) {
            this.markForRemoval = true;
        }
    }
    
    updateVisual() {
        if (!this.visual) return;
        
        // 更新軌跡線位置
        const positions = this.visual.geometry.attributes.position.array;
        
        // 終點跟隨子彈
        positions[3] = this.position.x;
        positions[4] = this.position.y;
        positions[5] = this.position.z;
        
        this.visual.geometry.attributes.position.needsUpdate = true;
        
        // 逐漸淡化軌跡
        const age = (Date.now() - this.startTime) / this.lifeTime;
        this.visual.material.opacity = Math.max(0, 0.8 - age);
    }
    
    onHit(hitPoint) {
        console.log('子彈命中:', hitPoint);
        
        // 創建命中效果
        this.createHitEffect(hitPoint);
        
        // 標記為移除
        this.markForRemoval = true;
    }
    
    createHitEffect(hitPoint) {
        // 創建簡單的命中火花效果
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 1, 0.5)
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(hitPoint);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // 移除粒子效果
        setTimeout(() => {
            this.scene.remove(particles);
        }, 500);
    }
    
    shouldRemove() {
        return this.markForRemoval === true;
    }
    
    destroy() {
        // 移除視覺效果
        if (this.visual) {
            this.scene.remove(this.visual);
            this.visual.geometry.dispose();
            this.visual.material.dispose();
        }
        
        console.log('子彈銷毀');
    }
}

