(function() {
    "use strict";

    // 1. 優先抓取 DOM 元素，確保全域可用
    const container = document.getElementById('pond');
    const foodBar = document.getElementById('food-bar');
    const loveBar = document.getElementById('love-bar');
    const bgMusic = document.getElementById('bgMusic');

    if (!container || !foodBar || !loveBar) {
        console.error("找不到必要的 UI 元素，請檢查 index.html 是否有 food-bar 和 love-bar");
        return;
    }

    const state = {
        fishes: [],
        food: null,
        foodTimeout: null,
        width: window.innerWidth,
        height: window.innerHeight,
        foodStock: 100,   
        happiness: 50     
    };

    // --- 介面更新函式 ---
    function updateUI() {
        foodBar.style.width = `${state.foodStock}%`;
        loveBar.style.width = `${state.happiness}%`;
        
        // 視覺提醒：飼料不足時變色
        if (state.foodStock < 5) {
            foodBar.classList.add('warning'); // 需在 CSS 定義 .warning
        } else {
            foodBar.classList.remove('warning');
        }
    }

    // --- 沒飼料時的警告閃爍 ---
    function showNoFoodWarning() {
        foodBar.parentElement.style.boxShadow = "0 0 10px rgba(255, 80, 80, 0.6)";
        setTimeout(() => {
            foodBar.parentElement.style.boxShadow = "none";
        }, 300);
    }

    // --- 數值隨時間變化 ---
    setInterval(() => {
        state.happiness = Math.max(0, state.happiness - 0.3); // 魚變餓
        state.foodStock = Math.min(100, state.foodStock + 0.5); // 飼料回補
        updateUI();
    }, 1000);

    // --- 魚類實體定義 (保持不變) ---
    class FishEntity {
        constructor(isFast = false, customConfig = {}) {
            this.isFast = isFast;
            this.size = customConfig.size || (0.8 + Math.random() * 0.5);
            this.color = customConfig.color || '#2c3e50';
            this.x = Math.random() * state.width;
            this.y = Math.random() * state.height;
            this.angle = Math.random() * Math.PI * 2;
            this.velocity = isFast ? 3.2 : 0.6 + (1.2 - this.size) * 0.8;
            this.oscillation = 0;
            this.dom = this.createDOM();
            this.render(true);
        }

        createDOM() {
            const el = document.createElement('div');
            el.className = `fish ${this.isFast ? 'fast-guest' : ''}`;
            el.style.width = `${60 * this.size}px`;
            el.style.opacity = '0';
            const tailSpeed = this.isFast ? '0.3s' : '0.8s';
            el.innerHTML = `
                <svg viewBox="0 0 100 60" style="display:block; width:100%;">
                    <path d="M20,30 Q50,5 90,30 Q50,55 20,30" fill="${this.color}" fill-opacity="0.8" />
                    <path class="tail" d="M22,30 L0,15 L0,45 Z" fill="${this.color}" fill-opacity="0.4" 
                          style="animation: tail-wag ${tailSpeed} infinite alternate ease-in-out;" />
                </svg>`;
            container.appendChild(el);
            requestAnimationFrame(() => el.style.opacity = this.isFast ? '0.3' : '0.7');
            return el;
        }

        update() {
            if (!this.isFast && state.food) {
                const dx = state.food.x - this.x;
                const dy = state.food.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 30) {
                    state.happiness = Math.min(100, state.happiness + 0.1);
                    updateUI();
                }
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.angle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                this.angle += angleDiff * 0.035;
                this.velocity = this.velocity * 0.98 + 2.4 * 0.02;
            } else {
                this.angle += (Math.random() - 0.5) * 0.025;
                this.velocity = this.velocity * 0.99 + (this.isFast ? 3.2 : 0.7) * 0.01;
            }
            this.x += Math.cos(this.angle) * this.velocity;
            this.y += Math.sin(this.angle) * this.velocity;
            const margin = 100;
            if (this.x < -margin) this.x = state.width + margin;
            else if (this.x > state.width + margin) this.x = -margin;
            if (this.y < -margin) this.y = state.height + margin;
            else if (this.y > state.height + margin) this.y = -margin;
            this.render();
        }

        render(immediate = false) {
            this.dom.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.angle}rad)`;
        }
    }

    // --- 初始化與事件監聽 ---
    function init() {
        const configs = [{size:1.1, color:'#1a3c40'}, {size:0.9, color:'#2c3e50'}, {size:1.2, color:'#2a4d53'}, {size:0.8, color:'#334756'}, {size:0.7, color:'#455a64'}];
        configs.forEach(cfg => state.fishes.push(new FishEntity(false, cfg)));
        state.fishes.push(new FishEntity(true, { size: 1.3, color: '#4f6d7a' }));

        container.addEventListener('mousedown', (e) => {
            // 音樂啟動：放在檢查之前
            if (bgMusic && bgMusic.paused) {
                bgMusic.muted = false;
                bgMusic.play().catch(()=>{});
            }

            // 核心攔截：檢查飼料
            if (state.foodStock < 5) {
                showNoFoodWarning();
                return; // 直接攔截，不執行下方代碼
            }

            // 通過檢查，執行動作
            state.foodStock -= 5;
            updateUI();

            const x = e.clientX;
            const y = e.clientY;

            createRipple(x, y);
            createPellets(x, y);

            state.food = { x, y };
            clearTimeout(state.foodTimeout);
            state.foodTimeout = setTimeout(() => { state.food = null; }, 3000);
        });

        function loop() {
            state.fishes.forEach(f => f.update());
            requestAnimationFrame(loop);
        }
        loop();
    }

    function createRipple(x, y) {
        const r = document.createElement('div');
        r.className = 'ripple';
        r.style.left = `${x}px`; r.style.top = `${y}px`;
        container.appendChild(r);
        r.addEventListener('animationend', () => r.remove());
    }

    function createPellets(x, y) {
        for (let i = 0; i < 5; i++) {
            const p = document.createElement('div');
            p.className = 'pellet';
            p.style.left = `${x + (Math.random()-0.5)*40}px`;
            p.style.top = `${y + (Math.random()-0.5)*40}px`;
            container.appendChild(p);
            p.addEventListener('animationend', () => p.remove());
        }
    }

    window.addEventListener('load', init);
})();