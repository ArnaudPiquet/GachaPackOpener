/**
 * GACHA PACK OPENER - HUB & CARD DEX SYSTEM
 */

let currentSeriesKey = ""; 
let currentUser = null;
let userInventory = {};
let isHolding = false; 

// 1. INTIALIZE EXTENSION SELECTION MENUS
function initializeSeriesMenus() {
    const shopSelect = document.getElementById(
        'series-select-shop'
    );
    const binderSelect = document.getElementById(
        'series-select-binder'
    );
    
    if (!shopSelect || !binderSelect) return;
    
    shopSelect.innerHTML = "";
    binderSelect.innerHTML = "";
    
    if (typeof cardData === 'undefined') {
        alert("Erreur : Le fichier series.js est introuvable.");
        return;
    }

    const keys = Object.keys(cardData);
    keys.forEach(key => {
        const opt1 = document.createElement('option');
        opt1.value = key;
        opt1.textContent = cardData[key].name;
        shopSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = key;
        opt2.textContent = cardData[key].name;
        binderSelect.appendChild(opt2);
    });

    // CRITICAL FIX: Explicitly assign the first string key ("series1")
    currentSeriesKey = keys[0];
}

// 2. USER SESSIONS & LOCALSTORAGE SYNC
function loadUserData(username) {
    currentUser = username;
    const savedData = localStorage.getItem(
        `gacha_user_${username}`
    );
    userInventory = savedData ? JSON.parse(savedData) : {};
    
    if (!savedData) saveUserData();
    localStorage.setItem('gacha_active_session', username);
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem(
            `gacha_user_${currentUser}`, 
            JSON.stringify(userInventory)
        );
    }
}

// NAVIGATION ROUTER BETWEEN SCREENS
function switchScreen(screenId) {
    const screens = [
        'auth-screen', 
        'hub-screen', 
        'shop-screen', 
        'binder-screen'
    ];
    
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === screenId) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    if (screenId === 'hub-screen') {
        document.getElementById('hub-username')
            .textContent = currentUser;
    }
    if (screenId === 'binder-screen') {
        renderBinderDex();
    }
}

// 3. RNG GACHA LOOT ENGINE
function getRandomItem(rarityList) {
    return rarityList[
        Math.floor(Math.random() * rarityList.length)
    ];
}

function drawPack() {
    const series = cardData[currentSeriesKey];
    const pack = [];
    
    for (let i = 0; i < series.rates.commune_count; i++) {
        const item = getRandomItem(series.pool.commune);
        pack.push({ 
            name: item.name, 
            img: item.img, 
            rarity: "commune", 
            label: "Commune" 
        });
    }
    for (let i = 0; i < series.rates.peu_commune_count; i++) {
        const item = getRandomItem(series.pool.peuCommune);
        pack.push({ 
            name: item.name, 
            img: item.img, 
            rarity: "peu-commune", 
            label: "Peu Commune" 
        });
    }
    if (Math.random() * 100 <= series.rates.rare_holo_chance) {
        const item = getRandomItem(series.pool.rareHolo);
        pack.push({ 
            name: item.name, 
            img: item.img, 
            rarity: "rare-holo", 
            label: "Rare Holo ✨" 
        });
    } else {
        const item = getRandomItem(series.pool.rare);
        pack.push({ 
            name: item.name, 
            img: item.img, 
            rarity: "rare", 
            label: "Rare" 
        });
    }
    return pack;
}

function addToInventory(pack) {
    pack.forEach(item => {
        if (userInventory[item.name]) {
            userInventory[item.name].quantity += 1;
        } else {
            userInventory[item.name] = {
                rarity: item.rarity,
                name: item.name,
                img: item.img, 
                label: item.label, 
                quantity: 1
            };
        }
    });
    saveUserData();
}

// EXTRA SAFETY FUNCTION: Explicitly locks unowned cards
function applyCardLockSafety(cardElement, isOwned) {
    if (!isOwned) {
        cardElement.classList.add('locked');
    } else {
        cardElement.classList.remove('locked');
    }
}

// CARD DEX / BINDER GRIDS BUILDER
function renderBinderDex() {
    const grid = document.getElementById('inventory-grid');
    const ratioLabel = document.getElementById('completion-ratio');
    if (!grid) return;
    
    grid.innerHTML = '';
    const series = cardData[currentSeriesKey];
    const allCardsInGame = [];
    
    const categories = [
        { 
            pool: series.pool.rareHolo, 
            rarity: 'rare-holo', 
            label: 'Rare Holo ✨' 
        },
        { 
            pool: series.pool.rare, 
            rarity: 'rare', 
            label: 'Rare' 
        },
        { 
            pool: series.pool.peuCommune, 
            rarity: 'peu-commune', 
            label: 'Peu Commune' 
        },
        { 
            pool: series.pool.commune, 
            rarity: 'commune', 
            label: 'Commune' 
        }
    ];

    categories.forEach(cat => {
        if (cat.pool) {
            cat.pool.forEach(card => {
                allCardsInGame.push({
                    name: card.name,
                    img: card.img,
                    rarity: cat.rarity,
                    label: cat.label
                });
            });
        }
    });

    let ownedUniqueCount = 0;

    allCardsInGame.forEach(gameCard => {
        const cardDiv = document.createElement('div');
        
        // Strict inventory mapping condition
        const isOwned = (
            userInventory[gameCard.name] !== undefined && 
            userInventory[gameCard.name] !== null &&
            userInventory[gameCard.name].quantity > 0
        );
        const qty = isOwned ? userInventory[gameCard.name].quantity : 0;

        if (isOwned) ownedUniqueCount++;

        cardDiv.className = `card ${gameCard.rarity}`;
        
        cardDiv.innerHTML = `
            <img src="img/${gameCard.img || 'moc.png'}" 
                 alt="${gameCard.name}" class="card-bg-image">
            <div class="card-content-overlay">
                <div style="font-size: 8px; opacity: 0.9; display: flex; 
                            justify-content: space-between; width: 100%; 
                            padding: 0 2px; font-weight: bold;">
                    <span>${gameCard.label}</span>
                    <span class="badge" style="transform: scale(0.85); 
                                padding: 1px 4px;">x${qty}</span>
                </div>
                <div style="font-weight: bold; line-height: 1.1; 
                            padding: 0 3px; font-size: 9px; 
                            margin-bottom: 2px;">${gameCard.name}</div>
            </div>
        `;
        
        // Active the strict fallback layout mask safety
        applyCardLockSafety(cardDiv, isOwned);
        
        grid.appendChild(cardDiv);
        cardDiv.addEventListener('click', () => 
            openCardInPortal(gameCard)
        );
    });

    if (ratioLabel) {
        ratioLabel.textContent = `${ownedUniqueCount} / ${allCardsInGame.length}`;
    }
}

// --- PERSPECTIVE 3D INTERACTIVE CONTROL ---
function setupPortalEvents() {
    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    wrapper.addEventListener('pointerdown', (e) => {
        isHolding = true;
        wrapper.classList.add('grabbing');
        wrapper.style.transition = 'none';
        wrapper.setPointerCapture(e.pointerId); 
    });

    wrapper.addEventListener('pointermove', (e) => {
        if (!isHolding) return;

        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let px = (x / rect.width) - 0.5;
        let py = (y / rect.height) - 0.5;

        px = Math.max(-0.7, Math.min(0.7, px));
        py = Math.max(-0.7, Math.min(0.7, py));

        const maxRotation = 30; 
        const rotateX = -py * maxRotation;
        const rotateY = px * maxRotation;

        wrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        wrapper.style.boxShadow = `${-px * 45}px ${-py * 45}px 55px rgba(0,0,0,0.8)`;

        const shine = wrapper.querySelector('.card-shine');
        if (shine) {
            shine.style.opacity = '1';
            shine.style.transform = `translate(${px * 15}%, ${py * 15}%) scale(1.5)`;
        }
    });

    wrapper.addEventListener('pointerup', handleRelease);
    wrapper.addEventListener('pointercancel', handleRelease);
}

function openCardInPortal(item) {
    const portal = document.getElementById('zoom-portal');
    const wrapper = document.getElementById('portal-wrapper');
    const overlay = document.getElementById('overlay');

    if (!portal || !wrapper || !overlay) return;

    wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
    wrapper.className = `portal-card-wrapper card ${item.rarity}`;

    wrapper.innerHTML = `
        <img src="img/${item.img || 'moc.png'}" 
             alt="${item.name}" class="card-bg-image">
        <div class="card-content-overlay">
            <div style="font-size: 0.85em; opacity: 0.9; 
                        font-weight: bold; text-transform: uppercase;">
                ${item.label}
            </div>
            <div style="font-size: 1.35em; font-weight: bold; 
                        padding: 0 10px; text-transform: uppercase;">
                ${item.name}
            </div>
        </div>
        <div class="card-shine"></div>
    `;

    portal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('modal-open');
}

function handleRelease() {
    if (!isHolding) return;
    isHolding = false;
const wrapper = document.getElementById('portal-wrapper');
if (!wrapper) return;
wrapper.classList.remove('grabbing');
wrapper.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
wrapper.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
const shine = wrapper.querySelector('.card-shine');
if (shine) shine.style.opacity = '0';
}
window.addEventListener('pointerup', () => {
if (isHolding) handleRelease();
});
// 4. ATTACH ROUTER APPLICATION EVENT LISTENERS
window.addEventListener('DOMContentLoaded', () => {
initializeSeriesMenus();
setupPortalEvents();
document.getElementById('login-btn').addEventListener('click', () => {
const username = document.getElementById('username-input')
.value.trim();
if (!username) {
alert("Veuillez saisir un pseudo valide.");
return;
}
loadUserData(username);
switchScreen('hub-screen');
});
document.getElementById('hub-logout-btn').addEventListener('click', () => {
localStorage.removeItem('gacha_active_session');
currentUser = null;
userInventory = {};
document.getElementById('username-input').value = '';
switchScreen('auth-screen');
});
document.getElementById('to-shop-btn')
.addEventListener('click', () => switchScreen('shop-screen'));
document.getElementById('to-binder-btn')
.addEventListener('click', () => switchScreen('binder-screen'));
document.querySelectorAll('.back-to-hub-btn').forEach(btn => {
btn.addEventListener('click', () => switchScreen('hub-screen'));
});
document.getElementById('series-select-shop')
.addEventListener('change', (e) => {
currentSeriesKey = e.target.value;
document.getElementById('series-select-binder').value =
e.target.value;
document.getElementById('pack-container').innerHTML = '';
});
document.getElementById('series-select-binder')
.addEventListener('change', (e) => {
currentSeriesKey = e.target.value;
document.getElementById('series-select-shop').value =
e.target.value;
renderBinderDex();
});
document.getElementById('overlay').addEventListener('click', () => {
const portal = document.getElementById('zoom-portal');
const overlay = document.getElementById('overlay');
const wrapper = document.getElementById('portal-wrapper');
isHolding = false;
if (portal) portal.classList.remove('active');
if (overlay) overlay.classList.remove('active');
if (wrapper) {
wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
const shine = wrapper.querySelector('.card-shine');
if (shine) shine.style.opacity = '0';
}
document.body.classList.remove('modal-open');
});
document.getElementById('draw-btn').addEventListener('click', () => {
const container = document.getElementById('pack-container');
if (!container) return;
container.innerHTML = '';
const newPack = drawPack();
addToInventory(newPack);
newPack.sort(() => Math.random() - 0.5);
newPack.forEach(item => {
const cardDiv = document.createElement('div');
cardDiv.className = `card ${item.rarity}`;
cardDiv.innerHTML = `<img src="img/${item.img || 'moc.png'}"  alt="${item.name}" class="card-bg-image">   <div class="card-content-overlay">   <div style="font-size: 9px; opacity: 0.9;  margin-bottom: 5px;">${item.label}</div>   <div style="font-weight: bold; line-height: 1.1;  padding: 0 5px;">${item.name}</div>   </div>`;
container.appendChild(cardDiv);
cardDiv.addEventListener('click', () => openCardInPortal(item));
});
});
const savedSession = localStorage.getItem('gacha_active_session');
if (savedSession) {
loadUserData(savedSession);
switchScreen('hub-screen');
} else {
switchScreen('auth-screen');
}
});