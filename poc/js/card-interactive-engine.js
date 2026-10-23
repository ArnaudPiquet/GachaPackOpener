// js/card-interactive-engine.js
export class CardInteractiveEngine {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.card = wrapper.querySelector('.card');
    this.shine = wrapper.querySelector('.card-shine');
    this.overlay = document.getElementById('overlay');
    this.packButton = document.getElementById('open-pack-btn');

    this.state = {
      isZoomed: false,
      isFlipped: wrapper.dataset.isFlipped === "true", // Capte si la carte est déjà révélée (inventaire)
      isHolding: false,
      isCalibrated: false,
      isGyroAllowed: true,
      hasMoved: false
    };

    this.cachedRect = null;
    this.gyroBase = { alpha: 0, beta: 0, gamma: 0 };
    this.dragStart = { x: 0, y: 0 };

    this.handleMove = this.handleMove.bind(this);
    this.handleGyro = this.handleGyro.bind(this);
    this.stopHolding = this.stopHolding.bind(this);

    this.init();
  }

  init() {
    this.wrapper.addEventListener('click', (e) => {
      e.stopPropagation();

      if (this.state.hasMoved) {
        this.state.hasMoved = false;
        return;
      }

      // ==========================================================================
      // CAS 1 : LA CARTE EST DANS L'INVENTAIRE (RETOUR VERS LE PORTAL CENTRAL)
      // ==========================================================================
      if (this.wrapper.parentNode && this.wrapper.parentNode.id === 'inventory-grid') {
        this.zoomInInventoryCard(); // Envoie la carte au centre du portal
        return;
      }

      // ==========================================================================
      // CAS 2 : LA CARTE EST DEJA DANS LE PORTAL CENTRAL (INSPECTION / RANGEMENT)
      // ==========================================================================
      if (!this.state.isZoomed) return;

      // Sécurité anti-clics transversaux si on est dans un flux de pack ouvert
      const container = document.getElementById('poc-container');
      const siblings = container ? Array.from(container.children) : [];
      const myZIndex = parseInt(this.wrapper.style.zIndex) || 0;
      const hasCardAbove = siblings.some(sib => {
        return sib !== this.wrapper &&
          sib.classList.contains('zoomed') &&
          (parseInt(sib.style.zIndex) || 0) > myZIndex;
      });

      if (hasCardAbove) return;

      if (!this.state.isFlipped) {
        this.revealCardFront(); // Clic booster de dos -> se retourne
      } else {
        this.unzoomCard(); // Clic booster ou inventaire révélé -> s'éjecte et va au garage en bas
      }
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        e.stopPropagation();

        // Si on inspecte une carte de l'inventaire au centre, le clic overlay la range en bas
        const container = document.getElementById('poc-container');
        if (container && this.wrapper.parentNode === container && this.state.isZoomed && this.state.isFlipped) {
          // On vérifie s'il y a d'autres cartes (flux booster). S'il n'y a qu'elle, c'est une inspection d'inventaire
          if (container.children.length === 1 && !this.packButton.classList.contains('hidden')) {
            this.unzoomCard();
            return;
          }
        }

        // Garde la sécurité de blocage de l'overlay pendant l'ouverture des boosters fermés
      });
    }

    this.wrapper.addEventListener('mousedown', (e) => this.startHolding(e));
    window.addEventListener('mouseup', this.stopHolding);
    this.wrapper.addEventListener('touchstart', (e) => this.startHolding(e), { passive: true });
    window.addEventListener('touchend', this.stopHolding);
  }

  updateTopCardFocus() {
    const container = document.getElementById('poc-container');
    if (!container) return;

    const cards = Array.from(container.children);
    cards.forEach(c => c.classList.remove('active-top-card'));

    const hiddenCards = cards.filter(cardWrapper => cardWrapper.dataset.isFlipped !== "true");

    if (hiddenCards.length > 0) {
      const topHiddenCard = hiddenCards.reduce((max, card) => {
        const z = parseInt(card.style.zIndex) || 0;
        return z > max.z ? { card, z } : max;
      }, { card: null, z: -1 });

      if (topHiddenCard.card) {
        topHiddenCard.card.classList.add('active-top-card');
      }
    }
  }

  // ==========================================================================
  // NOUVELLE METHODE : TRANSLATION DE L'INVENTAIRE VERS LE PORTAL CENTRAL
  // ==========================================================================
  zoomInInventoryCard() {
    const container = document.getElementById('poc-container');
    if (!container) return;

    this.state.isZoomed = true;

    // 1. Déplacement physique de la grille d'inventaire vers le conteneur de zoom central
    container.appendChild(this.wrapper);

    // 2. Application instantanée de la classe zoomée et de l'overlay
    this.wrapper.classList.add('zoomed');
    this.wrapper.style.zIndex = "1000";
    if (this.overlay) this.overlay.classList.add('active');

    // 3. Activation immédiate des capteurs 3D
    setTimeout(() => {
      if (this.state.isZoomed) {
        this.cachedRect = this.card.getBoundingClientRect();
        this.toggleListeners(true);
      }
    }, 100); // Délai minimal pour laisser le DOM enregistrer le changement de parent
  }

  // ==========================================================================
  // FILÉ UNIQUE DE DISTRIBUTION ET RANGEMENT (UNIVERSAL UNZOOM)
  // ==========================================================================
  zoomInHiddenCard(gyroAllowed) {
    this.state.isGyroAllowed = gyroAllowed;
    this.state.isZoomed = true;

    this.wrapper.classList.add('zoomed');
    if (this.overlay) this.overlay.classList.add('active');
    if (this.packButton) this.packButton.classList.add('hidden');

    this.updateTopCardFocus();
  }

  revealCardFront() {
    this.state.isFlipped = true;
    this.wrapper.dataset.isFlipped = "true";
    this.wrapper.classList.add('flipped');

    this.updateTopCardFocus();

    setTimeout(() => {
      if (!this.state.isZoomed) return;
      this.wrapper.classList.add('holo-flash');
      this.cachedRect = this.card.getBoundingClientRect();

      this.toggleListeners(true);

      setTimeout(() => this.wrapper.classList.remove('holo-flash'), 600);
    }, 600);
  }

  unzoomCard() {
    this.toggleListeners(false);

    this.wrapper.classList.remove('zoomed', 'active-top-card');
    this.wrapper.style.removeProperty('transform');
    this.wrapper.classList.add('send-to-inventory');

    setTimeout(() => {
      this.state.isZoomed = false;
      this.state.isHolding = false;
      this.state.isCalibrated = false;
      this.cachedRect = null;

      this.wrapper.classList.remove('grabbing', 'send-to-inventory');
      this.wrapper.style.removeProperty('--pile-transform');
      this.wrapper.style.transform = 'none';
      this.wrapper.style.zIndex = 'auto';

      this.card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      this.card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      this.card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
      if (this.shine) this.shine.style.opacity = '0';

      // Renvoie ou stocke la carte dans la grille d'inventaire en bas
      const inventoryGrid = document.getElementById('inventory-grid');
      if (inventoryGrid) {
        inventoryGrid.appendChild(this.wrapper);
      }

      this.updateTopCardFocus();

      const container = document.getElementById('poc-container');
      if (container && container.children.length === 0) {
        if (this.overlay) this.overlay.classList.remove('active');
        if (this.packButton) this.packButton.classList.remove('hidden');
      
        // NOUVEAU : Cache le bouton "Passer" si le joueur a tout ouvert manuellement
        const skipButton = document.getElementById('skip-pack-btn');
        if (skipButton) {
          skipButton.classList.add('hidden');
        }
      }
    }, 400);
  }

startHolding(e) {
    if (!this.state.isZoomed || !this.state.isFlipped) return;
    this.state.isHolding = true;
    this.state.hasMoved = false;

    // Extraction rigoureuse du premier point de contact pour iPhone / Android
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }
    
    this.dragStart = { x: clientX, y: clientY };

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
    const isTouch = !!e.touches || !!e.changedTouches;
    if (!isTouch && !this.state.isHolding) return;

    const rect = this.cachedRect || this.card.getBoundingClientRect();

    // Extraction rigoureuse du premier point de contact pendant le glissement
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    const distanceX = Math.abs(clientX - this.dragStart.x);
    const distanceY = Math.abs(clientY - this.dragStart.y);

    if (distanceX > 5 || distanceY > 5) {
      this.state.hasMoved = true;
    }

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