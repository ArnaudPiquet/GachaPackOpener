/**
 * GACHA PACK OPENER - LOGIQUE APPLICATIVE
 */

let currentSeriesKey = ""; 
let currentUser = null;
let userInventory = {};
let isHolding = false; // État d'activation du maintien du clic gauche

// 1. GESTION DES DONNÉES SÉRIES (PROVENANT DE SERIES.JS)
function initializeSeriesMenu() {
    const select = document.getElementById('series-select');
    if (!select) return;
    select.innerHTML = "";
    
    if (typeof cardData === 'undefined') {
        alert("Erreur : Le fichier series.js est manquant ou altéré dans le dossier /js/.");
        return;
    }

    const keys = Object.keys(cardData);
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = cardData[key].name;
        select.appendChild(option);
    });

    currentSeriesKey = keys[0]; // Affectation textuelle stricte de la première série active
}

// 2. STOCKAGE DE SESSIONS (LOCALSTORAGE EN BDD NAVIGATEUR)
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

// 3. MOTEUR ALÉATOIRE PONDÉRÉ (ALGORITHME DU DROPRATE)
function getRandomItem(rarityList) {
    return rarityList[Math.floor(Math.random() * rarityList.length)];
}

function drawPack() {
    const series = cardData[currentSeriesKey];
    const pack = [];
    
    // Génération du nombre exact de Communes configurées
    for (let i = 0; i < series.rates.commune_count; i++) {
        pack.push({ name: getRandomItem(series.pool.commune), rarity: "commune", label: "Commune" });
    }
    // Génération du nombre exact de Peu Communes configurées
    for (let i = 0; i < series.rates.peu_commune_count; i++) {
        pack.push({ name: getRandomItem(series.pool.peuCommune), rarity: "peu-commune", label: "Peu Commune" });
    }
    // Slot garanti : Calcul de bascule entre Rare (66.7%) et Rare Holo (33.3%)
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
        grid.innerHTML = '<p style="grid-column: 1/-1; opacity: 0.5;">Ton inventaire est vide. Ouvre ton premier pack !</p>';
        return;
    }

    // Tri de l'affichage par ordre hiérarchique de rareté décroissante
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

// 4. COUCHE PHYSIQUE ET RENDU INTERACTIF CARD 3D (ISOLATION PAR COMPOSANT PORTAL)
// --- MOTEUR INTERACTIF CARD 3D ISOLÉ (COMPATIBLE DESKTOP & MOBILE) ---
function setupPortalEvents() {
    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    // Détection du grip (Souris)
    wrapper.addEventListener('mousedown', (e) => {
        isHolding = true;
        wrapper.classList.add('grabbing');
        wrapper.style.transition = 'none';
    });

    // Détection du grip (Tactile Smartphone)
    wrapper.addEventListener('touchstart', (e) => {
        isHolding = true;
        wrapper.classList.add('grabbing');
        wrapper.style.transition = 'none';
    }, { passive: true });
}

function openCardInPortal(item) {
    const portal = document.getElementById('zoom-portal');
    const wrapper = document.getElementById('portal-wrapper');
    const overlay = document.getElementById('overlay');

    if (!portal || !wrapper || !overlay) return;

    wrapper.className = `portal-card-wrapper card ${item.rarity}`;

    wrapper.innerHTML = `
        <div style="font-size: 14px; opacity: 0.8; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; pointer-events: none;">${item.label}</div>
        <div style="font-size: 22px; font-weight: bold; padding: 0 15px; text-transform: uppercase; pointer-events: none;">${item.name}</div>
        <div class="card-shine"></div>
    `;

    portal.classList.add('active');
    overlay.classList.add('active');
}

// Relâcher le clic ou le doigt (Global)
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

window.addEventListener('mouseup', handleRelease);
window.addEventListener('touchend', handleRelease);

// Fermer le zoom au clic/toucher à côté sur le fond noir
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

// Fonction unifiée pour calculer les mouvements (Souris et Doigt)
function handleMoveEffect(e) {
    if (!isHolding) return;

    const wrapper = document.getElementById('portal-wrapper');
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    
    // FIX : Récupère les coordonnées soit de la souris, soit du premier doigt qui touche l'écran
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

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
}

window.addEventListener('mousemove', handleMoveEffect);
window.addEventListener('touchmove', handleMoveEffect, { passive: true });

// --- CHARGEMENT DU PROGRAMME ---
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