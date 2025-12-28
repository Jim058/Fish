/**

 * POND SYSTEM 2.0 - 全新重構版

 * 特點：

 * 1. 隔離作用域，防止變數重複宣告錯誤。

 * 2. 採用物理向量更新，消除魚隻平移的生硬感。

 * 3. 修正快速魚姿態：增加身體擺動幅度與 S 型路徑。

 */

(function() {

    "use strict";

    const container = document.getElementById('pond');

    if (!container) return;

    // 狀態管理

    const state = {

        fishes: [],

        food: null,

        foodTimeout: null,

        width: window.innerWidth,

        height: window.innerHeight

    };

    // 視窗縮放監聽

    window.addEventListener('resize', () => {

        state.width = window.innerWidth;

        state.height = window.innerHeight;

    });

    /**

     * 魚類實體

     */

    class FishEntity {

        constructor(isFast = false, customConfig = {}) {

            this.isFast = isFast;

            this.size = customConfig.size || (0.8 + Math.random() * 0.5);

            this.color = customConfig.color || '#2c3e50';

            

            // 物理屬性

            this.x = Math.random() * state.width;

            this.y = Math.random() * state.height;

            this.angle = Math.random() * Math.PI * 2;

            this.velocity = isFast ? 3.2 : 0.6 + (1.2 - this.size) * 0.8;

            this.oscillation = 0; // 用於 S 型游動

            

            this.dom = this.createDOM();

            this.render(true); // 立即執行初始定位，防止閃爍

        }

        createDOM() {

            const el = document.createElement('div');

            el.className = `fish ${this.isFast ? 'fast-guest' : ''}`;

            el.style.width = `${60 * this.size}px`;

            el.style.opacity = '0'; // 初始隱藏

            el.style.transition = 'opacity 2.5s ease-in'; // 慢速淡入

            const tailSpeed = this.isFast ? '0.3s' : '0.8s';

            

            el.innerHTML = `

                <svg viewBox="0 0 100 60" style="display:block; width:100%;">

                    <path d="M20,30 Q50,5 90,30 Q50,55 20,30" fill="${this.color}" fill-opacity="0.8" />

                    <path class="tail" d="M22,30 L0,15 L0,45 Z" fill="${this.color}" fill-opacity="0.4" 

                          style="animation: tail-wag ${tailSpeed} infinite alternate ease-in-out;" />

                    <circle cx="78" cy="22" r="1.5" fill="rgba(255,255,255,0.2)" />

                </svg>`;

            

            container.appendChild(el);

            

            // 強制瀏覽器重繪後顯示，確保位置已鎖定

            requestAnimationFrame(() => el.style.opacity = this.isFast ? '0.3' : '0.7');

            

            return el;

        }

        update() {

            if (this.isFast) {

                // 快速魚物理修正：S 型路徑模擬

                this.oscillation += 0.04;

                const lateralS = Math.sin(this.oscillation) * 0.02; 

                this.angle += lateralS;

                this.x += Math.cos(this.angle) * this.velocity;

                this.y += Math.sin(this.angle) * this.velocity;

                // 游出邊界重置邏輯 (低機率出現)

                if (this.x > state.width + 300 || this.x < -300 || this.y > state.height + 300 || this.y < -300) {

                    if (Math.random() < 0.005) {

                        this.x = -250;

                        this.y = Math.random() * state.height;

                        this.angle = (Math.random() - 0.5) * 0.5;

                    }

                }

            } else {

                // 一般魚尋找飼料邏輯

                if (state.food) {

                    const dx = state.food.x - this.x;

                    const dy = state.food.y - this.y;

                    const targetAngle = Math.atan2(dy, dx);

                    

                    let angleDiff = targetAngle - this.angle;

                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                    

                    this.angle += angleDiff * 0.035;

                    this.velocity = this.velocity * 0.98 + 2.4 * 0.02;

                } else {

                    this.angle += (Math.random() - 0.5) * 0.025;

                    this.velocity = this.velocity * 0.99 + (0.7 + (1.2 - this.size)) * 0.01;

                }

                this.x += Math.cos(this.angle) * this.velocity;

                this.y += Math.sin(this.angle) * this.velocity;

                // 邊界穿透

                const margin = 120;

                if (this.x < -margin) this.x = state.width + margin;

                else if (this.x > state.width + margin) this.x = -margin;

                if (this.y < -margin) this.y = state.height + margin;

                else if (this.y > state.height + margin) this.y = -margin;

            }

            this.render();

        }

        render(immediate = false) {

            // 使用 transform 代替 top/left 以獲得更高幀率

            const transform = `translate(${this.x}px, ${this.y}px) rotate(${this.angle}rad)`;

            if (immediate) {

                this.dom.style.transform = transform;

            } else {

                this.dom.style.transform = transform;

            }

        }

    }

    /**

     * 互動與動畫循環

     */

    function init() {

        // 初始化一般魚群

        const configs = [

            { size: 1.1, color: '#1a3c40' },

            { size: 0.9, color: '#2c3e50' },

            { size: 1.2, color: '#2a4d53' },

            { size: 0.8, color: '#334756' },

            { size: 0.7, color: '#455a64' },

            { size: 1.0, color: '#2c3e50' }

        ];

        configs.forEach(cfg => state.fishes.push(new FishEntity(false, cfg)));

        

        // 增加一隻稀有的快速影子魚

        state.fishes.push(new FishEntity(true, { size: 1.3, color: '#4f6d7a' }));

        // 點擊事件

        container.addEventListener('mousedown', (e) => {

            const x = e.clientX;

            const y = e.clientY;

            // 水波紋動畫

            const ripple = document.createElement('div');

            ripple.className = 'ripple';

            ripple.style.left = `${x}px`;

            ripple.style.top = `${y}px`;

            container.appendChild(ripple);

            ripple.addEventListener('animationend', () => ripple.remove());

            // 產生隨機飼料顆粒

            for (let i = 0; i < 6; i++) {

                const pellet = document.createElement('div');

                pellet.className = 'pellet';

                pellet.style.left = `${x + (Math.random() - 0.5) * 50}px`;

                pellet.style.top = `${y + (Math.random() - 0.5) * 50}px`;

                pellet.style.animationDelay = `${Math.random() * 0.5}s`;

                container.appendChild(pellet);

                pellet.addEventListener('animationend', () => pellet.remove());

            }

            // 更新全域食物狀態

            state.food = { x, y };

            clearTimeout(state.foodTimeout);

            state.foodTimeout = setTimeout(() => {

                state.food = null;

            }, 4000);

        });

        // 啟動循環

        function loop() {

            state.fishes.forEach(f => f.update());

            requestAnimationFrame(loop);

        }

        loop();

    }

    // 啟動專案

    if (document.readyState === 'complete') {

        init();

    } else {

        window.addEventListener('load', init);

    }

})();


        