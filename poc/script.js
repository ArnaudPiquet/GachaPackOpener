/**
 * PRODUCTION READY - Moteur de Carte Évolutive 3D (Hybride PC / Mobile-First)
 * Optimisé pour un rendu constant à 60 FPS (Zéro Layout Thrashing & Écouteurs Volatils)
 */


// --- POLYFILL DE VIBRATION POUR IOS ---
// Crée un pont technique en interceptant l'API "navigator.vibrate" pour Safari
if (!("vibrate" in navigator)) {
    navigator.vibrate = function(pattern) {
        // Crée un élément natif éphémère qu'iOS force à vibrer
        const dummyCheckbox = document.createElement('input');
        dummyCheckbox.type = 'checkbox';
        dummyCheckbox.style.position = 'fixed';
        dummyCheckbox.style.opacity = '0';
        dummyCheckbox.style.pointerEvents = 'none';
        
        document.body.appendChild(dummyCheckbox);
        
        // Simule un changement d'état ultra-rapide pour déclencher le Taptic Engine d'Apple
        dummyCheckbox.click();
        
        setTimeout(() => {
            dummyCheckbox.remove();
        }, 50);
        return true;
    };
}
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

// Flags d'états d'interaction
let isZoomed = false;
let isFlipped = false;
let isHolding = false;
let isCalibrated = false;
let isGyroAllowed = true;   // Mémorise si le gyroscope est utilisable (Évite les calculs si refusé)

// Cache de géométrie pour optimiser les performances (Évite le Layout Thrashing)
let cachedRect = null;

// Coordonnées de calibration relative
let baseAlpha = 0, baseBeta = 0, baseGamma = 0;

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

function generatePocCard() {
  const container = document.getElementById('poc-container');
  if (!container) return;

  const cardInfo = getRandomCardFromPool();
  const wrapper = document.createElement('div');
  wrapper.className = 'card-perspective-wrapper';

  wrapper.innerHTML = `
        <div class="card-glow ${cardInfo.rarity}"></div>
        <div class="card">
            <div class="card-flipper">
                <div class="card-back"><div class="card-back-pattern">?</div></div>
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

function setupInteractiveEvents(wrapper) {
  const card = wrapper.querySelector('.card');
  const shine = wrapper.querySelector('.card-shine');
  const overlay = document.getElementById('overlay');
  const statusText = document.getElementById('status-text');

  // Fonction interne qui déclenche et orchestre la séquence complète d'animation
  function triggerRevealSequence() {
    isZoomed = true;
    wrapper.classList.add('zoomed');
    if (overlay) overlay.classList.add('active');

    if (!isFlipped) {
      isFlipped = true;
      wrapper.classList.add('flipped');

      // Attente de la fin du retournement CSS (600ms) pour l'impact lumineux et haptique
      setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(15); // Android
        wrapper.classList.add('holo-flash'); // Éclair + Aura de rareté

        setTimeout(() => {
          wrapper.classList.remove('holo-flash');
        }, 600);
      }, 600);
    }

    if (statusText) {
      statusText.textContent = isGyroAllowed
        ? "iOS : Gyroscope connecté ! Incline le téléphone ou glisse ton doigt."
        : "PC : Maintiens le clic. Mobile : Glisse ton doigt (Gyroscope désactivé).";
    }

    // Calcul du cache géométrique une fois la carte stabilisée au centre
    setTimeout(() => {
      if (isZoomed) cachedRect = card.getBoundingClientRect();
    }, 800);

    // Activation des écouteurs de mouvements 3D
    activateMovableListeners();
  }

  // ==========================================================================
  // MÉCANISME 1 : GESTION DES PERMISSIONS ET DE L'ANIMATION (IOS COMPATIBLE)
  // ==========================================================================
  wrapper.addEventListener('click', (e) => {
    if (isZoomed) return;
    e.stopPropagation();

    // SÉCURITÉ SAFARI : Vérification strictement synchrone dès la racine du clic
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {

      // L'appel est synchrone avec le clic : Safari accepte la promesse immédiatement
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          isGyroAllowed = (permissionState === 'granted');
          // La décision (déjà enregistrée ou nouvelle) est lue, on lance la cinématique
          triggerRevealSequence();
        })
        .catch((error) => {
          console.error("Erreur d'initialisation des capteurs iOS :", error);
          isGyroAllowed = false;
          triggerRevealSequence(); // Lancement de secours si l'API échoue
        });

    } else {
      // Profil PC ou Android : Pas besoin de permission, on lance directement l'animation
      isGyroAllowed = false; // Pas d'API Apple ici
      triggerRevealSequence();
    }
  });

  // ==========================================================================
  // MÉCANISME 2 : GESTION DE LA SORTIE DU FOCUS (DÉZOOM VIA CLIC SUR L'OVERLAY)
  // ==========================================================================
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      unzoomCard();
    });
  }

  function unzoomCard() {
    isZoomed = false;
    isHolding = false;
    isCalibrated = false;
    cachedRect = null; // Purge complète du cache matériel

    // DÉSACTIVATION DES ÉCOUTEURS VOLATILS : Libère immédiatement la charge CPU
    deactivateMovableListeners();

    wrapper.classList.remove('zoomed', 'grabbing');
    if (overlay) overlay.classList.remove('active');
    if (statusText) statusText.textContent = "Clique/Tape sur la carte pour l'agrandir de nouveau.";

    // Interpolation de retour aux coordonnées d'origine (0, 0)
    card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
    if (shine) shine.style.opacity = '0';
  }

  // ==========================================================================
  // MÉCANISME 3 : GESTIONNAIRES DE CONTACT (INPUT TRACKING)
  // ==========================================================================

  function onMouseDown(e) {
    if (!isZoomed || !isFlipped) return;
    isHolding = true;
    wrapper.classList.add('grabbing');
    card.style.transition = 'none';
    cachedRect = card.getBoundingClientRect();
  }

  const onMouseUp = function () {
    if (isHolding) {
      isHolding = false;
      wrapper.classList.remove('grabbing');
      resetCardPosition();
    }
  }

  function onTouchStart() {
    if (isZoomed && isFlipped) {
      isHolding = true;
      wrapper.classList.add('grabbing');
      card.style.transition = 'none';
      cachedRect = card.getBoundingClientRect();
    }
  }

  function onTouchEnd() {
    if (isHolding) {
      isHolding = false;
      wrapper.classList.remove('grabbing');
      resetCardPosition();
    }
  }

  function resetCardPosition() {
    card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
    if (shine) shine.style.opacity = '0';
  }

  // Connexion propre des déclencheurs
  wrapper.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd);

  // ==========================================================================
  // MÉCANISME 4 : ENGINS CALCULATEURS ET PARALLAXE MATHÉMATIQUE
  // ==========================================================================

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

  function handleMove(e) {
    if (!isZoomed || !isFlipped) return;

    const isTouch = !!e.touches;
    if (!isTouch && !isHolding) return;

    const rect = cachedRect || card.getBoundingClientRect();

    // PROTECTION FIX WORKAROUND IOS : Ciblage strict de l'index 0 du tableau de points touchés
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let px = (x / rect.width) - 0.5;
    let py = (y / rect.height) - 0.5;

    px = Math.max(-0.7, Math.min(0.7, px));
    py = Math.max(-0.7, Math.min(0.7, py));

    card.style.transition = 'none';
    apply3DEffect(px, py);
  }

  function handleGyro(e) {
    if (!isZoomed || !isFlipped || isHolding || !isGyroAllowed) return;

    const currentAlpha = e.alpha;
    const currentBeta = e.beta;
    const currentGamma = e.gamma;
    if (currentGamma === null || currentBeta === null) return;
    if (!isCalibrated) {
      baseAlpha = currentAlpha;
      baseBeta = currentBeta;
      baseGamma = currentGamma;
      isCalibrated = true;
      return;
    }
    let deltaX = currentGamma - baseGamma;
    let deltaY = currentBeta - baseBeta;
    if (deltaX > 180) deltaX -= 360;
    if (deltaX < -180) deltaX += 360;
    if (deltaY > 180) deltaY -= 360;
    if (deltaY < -180) deltaY += 360;
    let px = deltaX / 25;
    let py = deltaY / 25;
    px = Math.max(-0.7, Math.min(0.7, px));
    py = Math.max(-0.7, Math.min(0.7, py));
    card.style.transition = 'none';
    apply3DEffect(px, py);
  }
  // ==========================================================================
  // MÉCANISME 5 : INTÉGRATEUR CYCLIQUES (ALLOCATION DYNAMIQUE D'ÉCOUTEURS)
  // ==========================================================================
  function activateMovableListeners() {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('deviceorientation', handleGyro);
  }
  function deactivateMovableListeners() {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('deviceorientation', handleGyro);
  }
}
window.addEventListener('DOMContentLoaded', generatePocCard);