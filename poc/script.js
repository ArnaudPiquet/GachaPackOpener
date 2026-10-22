/**
 * POC - Système de Carte Évolutive 3D (Architecture Hybride PC / Mobile-First)
 * Cycle : Initialisation -> Clic/Tap -> Zoom & Révélation -> Traitement Matriciel (Souris/Doigt/Gyro)
 */

const cardData = {
  "series1": {
    "name": "Série 1 : Origines",
    "pool": {
      "commune": ["Épée en bois", "Potion mineure", "Bouclier usé", "Herbe médicinale", "Flèche en fer"],
      "peuCommune": ["Épée en acier", "Potion de soin", "Anneau d'agilité", "Arc long"],
      "rare": ["Lame de feu", "Armure de plates", "Amulette ancienne"],
      "rareHolo": ["Excalibur Brillante", "Cristal de Dragon Holo", "Égide Cosmique"]
    }
  }
};

// Flags de cycle d'interaction du moteur physique
let isZoomed = false;   // Verrouille le positionnement absolu au centre de l'écran
let isFlipped = false;  // Mémorise la révélation de la carte pour empêcher la marche arrière
let isHolding = false;  // PC: état du clic | Mobile: état de contact tactile continu (prioritaire sur le Gyro)
let isCalibrated = false;   // Indique si le point zéro a été enregistré
let baseAlpha = 0, baseBeta = 0, baseGamma = 0; // Stocke la position neutre de l'iPhone

/**
 * Pioche aléatoire uniforme au sein de la structure de données
 */
function getRandomCardFromPool() {
    const seriesKeys = Object.keys(cardData);
    const randomSeriesKey = seriesKeys[Math.floor(Math.random() * seriesKeys.length)];
    const series = cardData[randomSeriesKey];
    
    const rarities = Object.keys(series.pool);
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
    const itemsList = series.pool[randomRarity];
    const randomItemName = itemsList[Math.floor(Math.random() * itemsList.length)];

    let cssRarity = "commune";
    let label = "Commune";
    if (randomRarity === "peuCommune") { cssRarity = "peu-commune"; label = "Peu Commune"; }
    if (randomRarity === "rare") { cssRarity = "rare"; label = "Rare"; }
    if (randomRarity === "rareHolo") { cssRarity = "rare-holo"; label = "Rare Holo ✨"; }

    return { name: randomItemName, rarity: cssRarity, label: label };
}

/**
 * Génère l'arborescence DOM et l'injecte dans le conteneur principal
 */
function generatePocCard() {
    const container = document.getElementById('poc-container');
    if (!container) return;

    const cardInfo = getRandomCardFromPool();
    const wrapper = document.createElement('div');
    wrapper.className = 'card-perspective-wrapper';
    
    // Structure segmentée : wrapper (layout) -> card (parallaxe) -> flipper (pivotement 180) -> faces
    wrapper.innerHTML = `
        <div class="card">
            <div class="card-flipper">
                <!-- CALQUE ARRIÈRE (DOS D'ATTENTE) -->
                <div class="card-back">
                    <div class="card-back-pattern">?</div>
                </div>
                <!-- CALQUE AVANT (CONTENU CHROMATIQUE) -->
                <div class="card-front ${cardInfo.rarity}">
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 10px;">${cardInfo.label}</div>
                    <div style="margin-top: 40px; font-weight: bold; padding: 0 10px;">${cardInfo.name}</div>
                    <div class="card-shine"></div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(wrapper);
    setupInteractiveEvents(wrapper);
}

/**
 * Initialisation et orchestration des écouteurs de capteurs physiques
 */
function setupInteractiveEvents(wrapper) {
    const card = wrapper.querySelector('.card');
    const shine = wrapper.querySelector('.card-shine');
    const overlay = document.getElementById('overlay');
    const statusText = document.getElementById('status-text');

    // MÉCANISME 1 : Gestion du Clic/Tap initial d'agrandissement spatial, flip et demande de permission Gyro
    wrapper.addEventListener('click', async (e) => {
        if (isZoomed) return; // Interdit le re-déclenchement si la carte est au premier plan
        e.stopPropagation(); 
        
        isZoomed = true;
        wrapper.classList.add('zoomed');
        if (overlay) overlay.classList.add('active');
        
        if (!isFlipped) {
            isFlipped = true;
            wrapper.classList.add('flipped');
        }
        
        if (statusText) {
            statusText.textContent = "PC : Maintiens le clic pour inspecter. Mobile : Glisse ton doigt ou incline le téléphone.";
        }

        // --- CORRECTIF DE SÉCURITÉ POUR IPHONE (iOS 13+) ---
        // Vérifie si le navigateur nécessite une demande explicite d'accès aux capteurs
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                // Déclenche l'invite système d'iOS (Autorisé car nous sommes au sein d'un événement 'click')
                const permissionState = await DeviceOrientationEvent.requestPermission();
                
                if (permissionState === 'granted') {
                    console.log("Accès au gyroscope validé par l'utilisateur iOS.");
                } else {
                    console.warn("Accès au gyroscope refusé par l'utilisateur iOS.");
                    if (statusText) statusText.textContent = "PC : Maintiens le clic. Mobile : Glisse ton doigt (Gyroscope désactivé).";
                }
            } catch (error) {
                console.error("Erreur lors de la demande de permission DeviceOrientation :", error);
            }
        }
        // ----------------------------------------------------
    });

    // MÉCANISME 2 : Sortie du focus de zoom via clic/tap d'arrière-plan
    if (overlay) {
        overlay.addEventListener('click', unzoomCard);
    }

    function unzoomCard() {
        isZoomed = false;
        isHolding = false;
        isCalibrated = false; // REZÉRO : On réinitialise la calibration pour la prochaine carte
        
        wrapper.classList.remove('zoomed', 'grabbing'); 
        if (overlay) overlay.classList.remove('active');
        if (statusText) statusText.textContent = "Clique/Tape sur la carte pour l'agrandir de nouveau.";
        
        // Amorti fluide de retour aux coordonnées zéro
        card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
        if (shine) shine.style.opacity = '0';
    }


    // MÈCANISME 3 : Gestion de l'interception et de l'ancrage tactile / curseur
    
    // Profil PC : Clic obligatoire pour manipuler la géométrie
    wrapper.addEventListener('mousedown', (e) => { 
        if (!isZoomed || !isFlipped) return;
        isHolding = true; 
        wrapper.classList.add('grabbing');
        card.style.transition = 'none'; // Désactivation de l'amorti pour coller en temps réel au pointeur
    });
    
    window.addEventListener('mouseup', () => { 
        if (isHolding) {
            isHolding = false;
            wrapper.classList.remove('grabbing');
            resetCardPosition();
        }
    });

    // Profil Mobile : Entrée en contact tactile immédiate (Prend l'ascendant sur le Gyroscope)
    wrapper.addEventListener('touchstart', () => { 
        if (isZoomed && isFlipped) {
            isHolding = true; 
            wrapper.classList.add('grabbing');
            card.style.transition = 'none';
        }
    }, { passive: true });
    
    window.addEventListener('touchend', () => { 
        if (isHolding) {
            isHolding = false; 
            wrapper.classList.remove('grabbing'); 
            resetCardPosition();
        }
    });

    /**
     * Rappel d'amorti pour stabiliser la carte face écran lors du relâchement
     */
    function resetCardPosition() {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
        if (shine) shine.style.opacity = '0';
    }

    /**
     * MÈCANISME COMMUN DE RENDU INTERNE
     * Calcule la projection spatiale et déplace la lueur color-dodge à l'opposé de l'assiette
     */
    function apply3DEffect(px, py) {
        const maxRotation = 35; 
        const rotateX = -py * maxRotation; 
        const rotateY = px * maxRotation;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.boxShadow = `${-px * 45}px ${-py * 45}px 55px rgba(0,0,0,0.8)`;

        if (shine) {
            shine.style.opacity = '1';
            shine.style.transform = `translate(${-px * 80}%, ${-py * 80}%) scale(2)`;
        }
    }

    // MÈCANISME 4 : Analyse géométrique bidimensionnelle (Déplacement Souris / Glissement Doigt)
    function handleMove(e) {
        if (!isZoomed || !isFlipped) return;

        const isTouch = !!e.touches;
        // Barrière de sécurité PC : Bloque le rendu si handleMove s'exécute sans mousedown actif
        if (!isTouch && !isHolding) return; 

        // Extraction des coordonnées absolues de l'index 0 (gestion du single-touch sur mobile)
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left; 
        const y = clientY - rect.top;  

        // Normalisation cartésienne centrée (-0.5 à +0.5)
        let px = (x / rect.width) - 0.5;
        let py = (y / rect.height) - 0.5;

        // Clamping angulaire de sécurité
        px = Math.max(-0.7, Math.min(0.7, px));
        py = Math.max(-0.7, Math.min(0.7, py));

        card.style.transition = 'none';
        apply3DEffect(px, py);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });

// MÉCANISME 6 : Moteur pour le Gyroscope avec Calibration au Point Zéro
    window.addEventListener('deviceorientation', (e) => {
        // Ne s'active que si la carte est zoomée, révélée et qu'aucun doigt ne touche l'écran
        if (!isZoomed || !isFlipped || isHolding) return;

        let currentAlpha = e.alpha;
        let currentBeta = e.beta;
        let currentGamma = e.gamma;

        if (currentGamma === null || currentBeta === null) return;

        // PREMIÈRE LECTURE : L'utilisateur vient d'ouvrir la carte, on fige sa position actuelle comme le "Plat"
        if (!isCalibrated) {
            baseAlpha = currentAlpha;
            baseBeta = currentBeta;
            baseGamma = currentGamma;
            isCalibrated = true;
            return; // On passe cette frame pour éviter un saut visuel brusque
        }

        // CALCUL DES DELTAS : Différence entre l'orientation actuelle et la base neutre
        let deltaX = currentGamma - baseGamma;
        let deltaY = currentBeta - baseBeta;

        // Gestion mathématique de la rotation du téléphone (passage de la barrière des 180°/-180°)
        if (deltaX > 180) deltaX -= 360;
        if (deltaX < -180) deltaX += 360;
        if (deltaY > 180) deltaY -= 360;
        if (deltaY < -180) deltaY += 360;

        // Normalisation : Une inclinaison relative de 20 degrés correspond à l'amplitude maximale (0.7)
        let px = deltaX / 25;
        let py = deltaY / 25;

        // Clamping angulaire de sécurité pour éviter les retournements de matrice
        px = Math.max(-0.7, Math.min(0.7, px));
        py = Math.max(-0.7, Math.min(0.7, py));

        card.style.transition = 'none';
        apply3DEffect(px, py);
    });
}

window.addEventListener('DOMContentLoaded', generatePocCard);