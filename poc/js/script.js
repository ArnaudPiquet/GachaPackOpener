/**
 * PRODUCTION READY - Moteur de Carte Évolutive 3D (Version Modulaire & Découplée)
 * Optimisé pour un rendu constant à 60 FPS (Zéro Layout Thrashing)
 */

// ==========================================================================
// 1. MODULE DE DONNÉES (CARD REPOSITORY)
// ==========================================================================
const CardDatabase = {
  series: {
    "series1": {
      "name": "Série 1 : Origines",
      "pool": {
        "commune": ["Épée en bois", "Potion mineure", "Bouclier usé", "Herbe médicinale", "Flèche en fer"],
        "peuCommune": ["Épée en acier", "Potion de soin", "Anneau d'agilité", "Arc long"],
        "rare": ["Lame de feu", "Armure de plates", "Amulette ancienne"],
        "rareHolo": ["Excalibur Brillante", "Cristal de Dragon Holo", "Égide Cosmique"]
      }
    }
  },

  /**
   * Pioche un item au hasard et retourne ses métadonnées formatées
   */
  getRandomCard() {
    const seriesKeys = Object.keys(this.series);
    const randomSeriesKey = seriesKeys[Math.floor(Math.random() * seriesKeys.length)];
    const pool = this.series[randomSeriesKey].pool;

    const rarities = Object.keys(pool);
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
    const itemsList = pool[randomRarity];
    const randomItemName = itemsList[Math.floor(Math.random() * itemsList.length)];

    const configuration = {
      commune: { css: "commune", label: "Commune" },
      peuCommune: { css: "peu-commune", label: "Peu Commune" },
      rare: { css: "rare", label: "Rare" },
      rareHolo: { css: "rare-holo", label: "Rare Holo ✨" }
    };

    const config = configuration[randomRarity] || configuration.commune;

    return { 
      name: randomItemName, 
      rarity: config.css, 
      label: config.label 
    };
  }
};

// ==========================================================================
// 2. MODULE DE RENDU COMPOSANT (DOM FACTORY)
// ==========================================================================
const CardDOMFactory = {
  /**
   * Crée l'arbre HTML complet d'une carte et l'injecte dans le conteneur
   */
  create(cardInfo, targetContainerId) {
    const container = document.getElementById(targetContainerId);
    if (!container) return null;

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
    return wrapper;
  }
};

// ==========================================================================
// 3. ENGIN D'INTERACTION PARALLAXE & COORDONNÉES (3D ENGINE)
// ==========================================================================
class CardInteractiveEngine {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.card = wrapper.querySelector('.card');
    this.shine = wrapper.querySelector('.card-shine');
    this.overlay = document.getElementById('overlay');
    this.statusText = document.getElementById('status-text');

    // États internes de l'instance
    this.state = {
      isZoomed: false,
      isFlipped: false,
      isHolding: false,
      isCalibrated: false,
      isGyroAllowed: true
    };

    // Cache matériel
    this.cachedRect = null;
    this.gyroBase = { alpha: 0, beta: 0, gamma: 0 };

    // Bind des contextes pour préserver le "this" dans les addEventListener globaux
    this.handleMove = this.handleMove.bind(this);
    this.handleGyro = this.handleGyro.bind(this);
    this.stopHolding = this.stopHolding.bind(this);

    this.init();
  }

  init() {
    // Événement d'entrée / Reveal synchrone
    this.wrapper.addEventListener('click', (e) => this.handleInitialClick(e));

    // Événements d'overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unzoomCard();
      });
    }

    // Événements d'input Tracking (Presse)
    this.wrapper.addEventListener('mousedown', () => this.startHolding());
    window.addEventListener('mouseup', this.stopHolding);
    this.wrapper.addEventListener('touchstart', () => this.startHolding(), { passive: true });
    window.addEventListener('touchend', this.stopHolding);
  }

  handleInitialClick(e) {
    if (this.state.isZoomed) return;
    e.stopPropagation();

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          this.state.isGyroAllowed = (permissionState === 'granted');
          this.triggerRevealSequence();
        })
        .catch((error) => {
          console.error("Échec capteurs iOS :", error);
          this.state.isGyroAllowed = false;
          this.triggerRevealSequence();
        });
    } else {
      this.state.isGyroAllowed = false;
      this.triggerRevealSequence();
    }
  }

  triggerRevealSequence() {
    this.state.isZoomed = true;
    this.wrapper.classList.add('zoomed');
    if (this.overlay) this.overlay.classList.add('active');

    if (!this.state.isFlipped) {
      this.state.isFlipped = true;
      this.wrapper.classList.add('flipped');

      setTimeout(() => {
        this.wrapper.classList.add('holo-flash');
        setTimeout(() => this.wrapper.classList.remove('holo-flash'), 600);
      }, 600);
    }

    if (this.statusText) {
      this.statusText.textContent = this.state.isGyroAllowed
        ? "Mobile : Incline ton appareil ou glisse ton doigt pour inspecter."
        : "PC : Maintiens le clic. Mobile : Glisse ton doigt pour inspecter.";
    }

    setTimeout(() => {
      if (this.state.isZoomed) this.cachedRect = this.card.getBoundingClientRect();
    }, 800);

    this.toggleListeners(true);
  }

  unzoomCard() {
    this.state.isZoomed = false;
    this.state.isHolding = false;
    this.state.isCalibrated = false;
    this.cachedRect = null;

    this.toggleListeners(false);

    this.wrapper.classList.remove('zoomed', 'grabbing');
    if (this.overlay) this.overlay.classList.remove('active');
    if (this.statusText) this.statusText.textContent = "Clique/Tape sur la carte pour l'agrandir.";

    this.card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
    this.card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    this.card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
    if (this.shine) this.shine.style.opacity = '0';
  }

  startHolding() {
    if (!this.state.isZoomed || !this.state.isFlipped) return;
    this.state.isHolding = true;
    this.wrapper.classList.add('grabbing');
    this.card.style.transition = 'none';
    this.cachedRect = this.card.getBoundingClientRect();
  }

  stopHolding() {
    if (!this.state.isHolding) return;
    this.state.isHolding = false;
    this.wrapper.classList.remove('grabbing');
    
    this.card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    this.card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    this.card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
    if (this.shine) this.shine.style.opacity = '0';
  }

  apply3DEffect(px, py) {
    const maxRotation = 35;
    const rotateX = -py * maxRotation;
    const rotateY = px * maxRotation;

    this.card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    this.card.style.boxShadow = `${-px * 45}px ${-py * 45}px 55px rgba(0,0,0,0.8)`;

    if (this.shine) {
      this.shine.style.opacity = '1';
      this.shine.style.transform = `translate(${-px * 80}%, ${-py * 80}%) scale(2)`;
    }
  }

  handleMove(e) {
    if (!this.state.isZoomed || !this.state.isFlipped) return;
    const isTouch = !!e.touches;
    if (!isTouch && !this.state.isHolding) return;

    const rect = this.cachedRect || this.card.getBoundingClientRect();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    let px = ((clientX - rect.left) / rect.width) - 0.5;
    let py = ((clientY - rect.top) / rect.height) - 0.5;

    px = Math.max(-0.7, Math.min(0.7, px));
    py = Math.max(-0.7, Math.min(0.7, py));

    this.card.style.transition = 'none';
    this.apply3DEffect(px, py);
  }

  handleGyro(e) {
    if (!this.state.isZoomed || !this.state.isFlipped || this.state.isHolding || !this.state.isGyroAllowed) return;
    if (e.gamma === null || e.beta === null) return;

    if (!this.state.isCalibrated) {
      this.gyroBase = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
      this.state.isCalibrated = true;
      return;
    }

    let deltaX = e.gamma - this.gyroBase.gamma;
    let deltaY = e.beta - this.gyroBase.beta;

    // Normalisation des angles sur 360°
    if (deltaX > 180) deltaX -= 360; else if (deltaX < -180) deltaX += 360;
    if (deltaY > 180) deltaY -= 360; else if (deltaY < -180) deltaY += 360;

    const px = Math.max(-0.7, Math.min(0.7, deltaX / 25));
    const py = Math.max(-0.7, Math.min(0.7, deltaY / 25));

    this.card.style.transition = 'none';
    this.apply3DEffect(px, py);
  }

  toggleListeners(activate) {
    const action = activate ? 'addEventListener' : 'removeEventListener';
    window[action]('mousemove', this.handleMove);
    window[action]('touchmove', this.handleMove, { passive: false });
    window[action]('deviceorientation', this.handleGyro);
  }
}
// ==========================================================================
// 4. POINT D'ENTRÉE / ORCHESTRATEUR (INITIALIZER)
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
// 1. Récupération d'un item aléatoire via le Model de données
const newCardData = CardDatabase.getRandomCard();
// 2. Rendu graphique via la Factory DOM
const cardWrapper = CardDOMFactory.create(newCardData, 'poc-container');
// 3. Attachement automatique du moteur d'interaction sur l'élément généré
if (cardWrapper) {
new CardInteractiveEngine(cardWrapper);
}
});