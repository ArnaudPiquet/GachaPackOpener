/**
 * GACHA PACK OPENER - LOGIQUE APPLICATIVE CONFIGURÉE
 */

let currentSeriesKey = ""; 
let currentUser = null;
let userInventory = {};
let isHolding = false; 

// 1. GESTION DES DONNÉES SÉRIES
function initializeSeriesMenu() {
    const select = document.getElementById('series-select');
    if (!select) return;
    select.innerHTML = "";
    
    if (typeof cardData === 'undefined') {
        alert("Erreur : Le fichier series.js est manquant.");
        return;
    }

    const keys = Object.keys(cardData);
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = cardData[key].name;
        select.appendChild(option);
    });

    currentSeriesKey = keys[0];
}

// 2. STOCKAGE DE SESSIONS (LOCALSTORAGE)
function loadUserData(username) {
    currentUser = username;
    const savedData = localStorage.getItem(`gacha_user_${username}`);
    userInventory = savedData ? JSON.parse(savedData) : {};
    
    // Rétablissement des labels manquants sur les anciens profils de test
    Object.keys(userInventory).forEach(name => {
        if (!userInventory[name].label) {
            let rarity = userInventory[name].rarity || "commune";
            let label = "Commune";
            if (rarity === "peu-commune") label = "Peu Commune";
            if (rarity === "rare") label = "Rare";
            if (rarity === "rare-holo") label = "Rare Holo ✨";
            userInventory[name].label = label;
        }
    });

    if (!savedData) saveUserData();
    localStorage.setItem('gacha_active_session', username);
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem(`gacha_user_${currentUser}`, JSON.stringify(userInventory));
    }
}

function updateUI() {
    const authScreen = document.getElementById('auth-screen');
    const gameScreen = document.getElementById('game-screen');
    
    if (currentUser) {
        authScreen.classList.remove('active');
        gameScreen.classList.add('active');
        document.getElementById('display-username').textContent = currentUser;
        renderInventory();
    } else {
        authScreen.classList.add('active');
        gameScreen.classList.remove('active');
        document.getElementById('pack-container').innerHTML = '';
    }
}

// 3. MOTEUR ALÉATOIRE PONDÉRÉ
function getRandomItem(rarityList) {
    return rarityList[Math.floor(Math.random() * rarityList.length)];
}

function drawPack() {
    const series = cardData[currentSeriesKey];
    const pack = [];
    
    for (let i = 0; i < series.rates.commune_count; i++) {
        const item = getRandomItem(series.pool.commune);
        pack.push({ name: item.name, img: item.img, rarity: "commune", label: "Commune" });
    }
    for (let i = 0; i < series.rates.peu_commune_count; i++) {
        const item = getRandomItem(series.pool.peuCommune);
        pack.push({ name: item.name, img: item.img, rarity: "peu-commune", label: "Peu Commune" });
    }
    if (Math.random() * 100 <= series.rates.rare_holo_chance) {
        const item = getRandomItem(series.pool.rareHolo);
        pack.push({ name: item.name, img: item.img, rarity: "rare-holo", label: "Rare Holo ✨" });
    } else {
        const item = getRandomItem(series.pool.rare);
        pack.push({ name: item.name, img: item.img, rarity: "rare", label: "Rare" });
    }
    return pack;
}

function addToInventory(pack) {
    pack.forEach(item => {
        if (userInventory[item.name]) {
            userInventory[item.name].quantity += 1;
            userInventory[item.name].label = item.label; 
        } else {
            userInventory[item.name] = {
                rarity: item.rarity,
                name: item.name,
                img: item.img, // Sauvegarde le nom de l'image liée
                label: item.label, 
                quantity: 1
            };
        }
    });
    saveUserData();
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = Object.values(userInventory);
    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5; text-align: center;">Ton inventaire est vide.</p>';
        return;
    }

    const rarityOrder = { 'rare-holo': 0, 'rare': 1, 'peu-commune': 2, 'commune': 3 };
    items.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    items.forEach(item => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${item.rarity}`;
        
        // FIX : Remplacement de "img/moc.png" par "img/\${item.img || 'moc.png'}" par sécurité
        cardDiv.innerHTML = `
            <img src="img/${item.img || 'moc.png'}" alt="${item.name}" class="card-bg-image">
            <div class="card-content-overlay">
                <div style="font-size: 8px; opacity: 0.9; display: flex; justify-content: space-between; width: 100%; padding: 0 2px; font-weight: bold;">
                    <span>${item.label}</span>
                    <span class="badge" style="transform: scale(0.85); padding: 1px 4px;">x${item.quantity}</span>
                </div>
                <div style="font-weight: bold; line-height: 1.1; padding: 0 3px; font-size: 9px; margin-bottom: 2px;">${item.name}</div>
            </div>
        `;
        grid.appendChild(cardDiv);
        cardDiv.addEventListener('click', () => openCardInPortal(item));
    });
}

// 4. MOTEUR INTERACTIF CARD 3D ISOLÉ (POINTER EVENTS UNIFIÉS)
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
            shine.style.transform = `translate(${(px * 15)}%, ${(py * 15)}%) scale(1.5)`;
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

    // FIX : Utilise item.img de manière dynamique
    wrapper.innerHTML = `
        <img src="img/${item.img || 'moc.png'}" alt="${item.name}" class="card-bg-image">
        <div class="card-content-overlay">
            <div style="font-size: 0.85em; opacity: 0.9; font-weight: bold; text-transform: uppercase;">${item.label}</div>
            <div style="font-size: 1.35em; font-weight: bold; padding: 0 10px; text-transform: uppercase;">${item.name}</div>
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

// 5. ATTACHEMENT DES ÉVÉNEMENTS GENERAUX
window.addEventListener('DOMContentLoaded', () => {
    initializeSeriesMenu();
    setupPortalEvents();

    document.getElementById('login-btn').addEventListener('click', () => {
        const username = document.getElementById('username-input').value.trim();
        if (!username) {
            alert("Veuillez saisir un pseudo valide.");
            return;
        }
        loadUserData(username);
        updateUI();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('gacha_active_session');
        currentUser = null;
        userInventory = {};
        document.getElementById('username-input').value = '';
        updateUI();
    });

    document.getElementById('series-select').addEventListener('change', (e) => {
        currentSeriesKey = e.target.value;
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
        cardDiv.innerHTML = `
            <img src="img/${item.img || 'moc.png'}" alt="${item.name}" class="card-bg-image"> 
            <div class="card-content-overlay"> 
                <div style="font-size: 9px; opacity: 0.9; margin-bottom: 5px;">${item.label}</div> 
                <div style="font-weight: bold; line-height: 1.1; padding: 0 5px;">${item.name}</div> 
            </div>
        `;
        container.appendChild(cardDiv);
        cardDiv.addEventListener('click', () => openCardInPortal(item));
    });
renderInventory();
});
const savedSession = localStorage.getItem('gacha_active_session');
if (savedSession) {
loadUserData(savedSession);
}
updateUI();
});