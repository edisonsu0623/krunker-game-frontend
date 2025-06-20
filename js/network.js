// 多人遊戲網路管理類
class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.roomId = null;
        this.playerId = null;
        this.players = new Map();
        this.serverUrl = "https://krunker-game-backend.vercel.app";
        
        this.callbacks = {
            onPlayerJoined: null,
            onPlayerLeft: null,
            onPlayerUpdate: null,
            onPlayerShoot: null,
            onPlayerHit: null,
            onPlayerRespawn: null
        };
        
        console.log('網路管理器初始化完成');
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // 載入 Socket.IO 客戶端
                if (typeof io === 'undefined') {
                    const script = document.createElement('script');
                    script.src = '/socket.io/socket.io.js';
                    script.onload = () => {
                        this.initSocket();
                        resolve();
                    };
                    script.onerror = () => {
                        reject(new Error('無法載入 Socket.IO'));
                    };
                    document.head.appendChild(script);
                } else {
                    this.initSocket();
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    initSocket() {
        this.socket = io(this.serverUrl);
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.playerId = this.socket.id;
            console.log('已連接到伺服器:', this.playerId);
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('與伺服器斷線');
        });
        
        this.socket.on('joinedRoom', (data) => {
            this.roomId = data.room.id;
            console.log('成功加入房間:', this.roomId);
            
            // 更新玩家列表
            this.players.clear();
            data.players.forEach(player => {
                this.players.set(player.id, player);
            });
            
            if (this.callbacks.onRoomJoined) {
                this.callbacks.onRoomJoined(data);
            }
        });
        
        this.socket.on('joinRoomError', (error) => {
            console.error('加入房間失敗:', error);
            if (this.callbacks.onJoinRoomError) {
                this.callbacks.onJoinRoomError(error);
            }
        });
        
        this.socket.on('playerJoined', (player) => {
            this.players.set(player.id, player);
            console.log('玩家加入:', player.name);
            
            if (this.callbacks.onPlayerJoined) {
                this.callbacks.onPlayerJoined(player);
            }
        });
        
        this.socket.on('playerLeft', (playerId) => {
            const player = this.players.get(playerId);
            this.players.delete(playerId);
            console.log('玩家離開:', player?.name || playerId);
            
            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(playerId);
            }
        });
        
        this.socket.on('playerUpdate', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                Object.assign(player, data);
                
                if (this.callbacks.onPlayerUpdate) {
                    this.callbacks.onPlayerUpdate(data);
                }
            }
        });
        
        this.socket.on('playerShoot', (data) => {
            if (this.callbacks.onPlayerShoot) {
                this.callbacks.onPlayerShoot(data);
            }
        });
        
        this.socket.on('playerHit', (data) => {
            // 更新玩家得分和血量
            const shooter = this.players.get(data.shooterId);
            const target = this.players.get(data.targetId);
            
            if (shooter) {
                shooter.score = data.shooterScore;
            }
            
            if (target) {
                target.health = data.targetHealth;
                target.score = data.targetScore;
                if (data.isKill) {
                    target.isAlive = false;
                }
            }
            
            if (this.callbacks.onPlayerHit) {
                this.callbacks.onPlayerHit(data);
            }
        });
        
        this.socket.on('playerRespawn', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.position = data.position;
                player.health = data.health;
                player.isAlive = true;
            }
            
            if (this.callbacks.onPlayerRespawn) {
                this.callbacks.onPlayerRespawn(data);
            }
        });
        
        this.socket.on('roomList', (rooms) => {
            if (this.callbacks.onRoomList) {
                this.callbacks.onRoomList(rooms);
            }
        });
    }
    
    joinRoom(roomId, playerName) {
        if (!this.isConnected) {
            console.error('未連接到伺服器');
            return;
        }
        
        this.socket.emit('joinRoom', {
            roomId: roomId || 'default',
            playerName: playerName || '匿名玩家'
        });
    }
    
    sendPlayerUpdate(data) {
        if (!this.isConnected || !this.roomId) return;
        
        this.socket.emit('playerUpdate', data);
    }
    
    sendPlayerShoot(data) {
        if (!this.isConnected || !this.roomId) return;
        
        this.socket.emit('playerShoot', data);
    }
    
    sendPlayerHit(targetId, damage) {
        if (!this.isConnected || !this.roomId) return;
        
        this.socket.emit('playerHit', {
            targetId: targetId,
            damage: damage
        });
    }
    
    getRoomList() {
        if (!this.isConnected) return;
        
        this.socket.emit('getRoomList');
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            this.roomId = null;
            this.playerId = null;
            this.players.clear();
        }
    }
    
    // 設置回調函數
    setCallbacks(callbacks) {
        Object.assign(this.callbacks, callbacks);
    }
    
    // 獲取其他玩家列表
    getOtherPlayers() {
        const others = [];
        for (const [id, player] of this.players) {
            if (id !== this.playerId) {
                others.push(player);
            }
        }
        return others;
    }
    
    // 獲取玩家數據
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    // 獲取自己的數據
    getSelfPlayer() {
        return this.players.get(this.playerId);
    }
}

// 全域網路管理器實例
let networkManager = null;

