/**
 * GACHA PACK OPENER - LOGIQUE APPLICATIVE MODERNE
 */

let currentSeriesKey = ""; 
let currentUser = null;
let userInventory = {};
let isHolding = false; 

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

function loadUserData(username) {
    currentUser = username;
    const savedData = localStorage.getItem(`gacha_user_${username}`);
    userInventory = savedData ? JSON.parse(savedData) : {};
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

function getRandomItem(rarityList) {
    return rarityList[Math.floor(Math.random() * rarityList.length)];
}

function drawPack() {
    const series = cardData[currentSeriesKey];
    const pack = [];
    
    for (let i = 0; i < series.rates.commune_count; i++) {
        pack.push({ name: getRandomItem(series.pool.commune), rarity: "commune", label: "Commune" });
    }
    for (let i = 0; i < series.rates.peu_commune_count; i++) {
        pack.push({ name: getRandomItem(series.pool.peuCommune), rarity: "peu-commune", label: "Peu Commune" });
    }
    if (Math.random() * 100 <= series.rates.rare_holo_chance) {
        pack.push({ name: getRandomItem(series.pool.rareHolo), rarity: "rare-holo", label: "Rare Holo ✨" });
    } else {
        pack.push({ name: getRandomItem(series.pool.rare), rarity: "rare", label: "Rare" });
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
        grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5;">Ton inventaire est vide.</p>';
        return;
    }

    const rarityOrder = { 'rare-holo': 0, 'rare': 1, 'peu-commune': 2, 'commune': 3 };
    items.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `inv-item inv-${item.rarity}`;
        itemDiv.innerHTML = `
            <span>${item.name}</span>
            <span class="badge">x${item.quantity}</span>
        `;
        grid.appendChild(itemDiv);
    });
}

// --- PORTAL UNIFIÉ APIS MODÈLE MOBILE SÉCURISÉ ---
function setupPortalEvents() {
    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    // FIX FIX FIX : Utilisation exclusive de pointerdown (Fonctionne instantanément au doigt ET à la souris)
    wrapper.addEventListener('pointerdown', (e) => {
        isHolding = true;
        wrapper.classList.add('grabbing');
        wrapper.style.transition = 'none';
        
        // Sécurise la capture du mouvement pour que le téléphone ne perde pas le fil
        wrapper.setPointerCapture(e.pointerId); 
    });
}

function openCardInPortal(item) {
    const portal = document.getElementById('zoom-portal');
    const wrapper = document.getElementById('portal-wrapper');
    const overlay = document.getElementById('overlay');

    if (!portal || !wrapper || !overlay) return;

    // Application stricte des classes
    wrapper.className = `portal-card-wrapper card ${item.rarity}`;

    wrapper.innerHTML = `
        <div style="font-size: 14px; opacity: 0.8; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; pointer-events: none;">${item.label}</div>
        <div style="font-size: 22px; font-weight: bold; padding: 0 15px; text-transform: uppercase; pointer-events: none;">${item.name}</div>
        <div class="card-shine"></div>
    `;

    portal.classList.add('active');
    overlay.classList.add('active');
}

// Fonction globale pour relâcher le doigt ou la souris
function handleRelease() {
    if (!isHolding) return;
    isHolding = false;
    
    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    wrapper.classList.remove('grabbing');
    wrapper.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    wrapper.style.transform = 'rotateX(0deg) rotateY(0deg)';
    wrapper.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
    
    const shine = wrapper.querySelector('.card-shine');
    if (shine) shine.style.opacity = '0';
}

window.addEventListener('pointerup', handleRelease);

// Fermeture de l'overlay sombre au clic
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
});

// Calcul de mouvement unifié PointerMove
window.addEventListener('pointermove', (e) => {
    if (!isHolding) return;

    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    
    // Les coordonnées captent nativement la position absolue du doigt ou du curseur
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let px = (x / rect.width) - 0.5;
    let py = (y / rect.height) - 0.5;

    px = Math.max(-0.7, Math.min(0.7, px));
    py = Math.max(-0.7, Math.min(0.7, py));

    const maxRotation = 35; 
    const rotateX = -py * maxRotation;
    const rotateY = px * maxRotation;

    wrapper.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    wrapper.style.boxShadow = `${-px * 45}px ${-py * 45}px 55px rgba(0,0,0,0.8)`;

    const shine = wrapper.querySelector('.card-shine');
    if (shine) {
        shine.style.opacity = '1';
        shine.style.transform = `translate(${(px * 20)}%, ${(py * 20)}%) scale(1.5)`;
    }
});

// 5. ATTACHEMENT DES ÉVÉNEMENTS ÉCRANS AU CHARGEMENT DE LA PAGE
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
                <div style="font-size: 10px; opacity: 0.8;">${item.label}</div>
                <div style="margin-top: 15px; font-weight: bold;">${item.name}</div>
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