export class CardInteractiveEngine {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.card = wrapper.querySelector('.card');
    this.shine = wrapper.querySelector('.card-shine');
    this.overlay = document.getElementById('overlay');
    this.packButton = document.getElementById('open-pack-btn');

    this.state = {
      isZoomed: false,
      isFlipped: false,
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
      if (!this.state.isZoomed) return;
      e.stopPropagation();

      if (this.state.hasMoved) {
        this.state.hasMoved = false; 
        return; 
      }

      const siblings = Array.from(this.wrapper.parentNode.children);
      const myZIndex = parseInt(this.wrapper.style.zIndex) || 0;
      const hasCardAbove = siblings.some(sib => {
        return sib !== this.wrapper && 
               sib.classList.contains('zoomed') && 
               (parseInt(sib.style.zIndex) || 0) > myZIndex;
      });

      if (hasCardAbove) return;

      if (!this.state.isFlipped) {
        this.revealCardFront();
      } else {
        this.unzoomCard();
      }
    });

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // CONSERVATION DE FLIPPED : Émancipation synchrone de la trajectoire
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

      const inventoryGrid = document.getElementById('inventory-grid');
      if (inventoryGrid) {
        inventoryGrid.appendChild(this.wrapper);
      }

      this.updateTopCardFocus();

      const container = document.getElementById('poc-container');
      if (container && container.children.length === 0) {
        if (this.overlay) this.overlay.classList.remove('active');
        if (this.packButton) this.packButton.classList.remove('hidden');
      }
    }, 400);
  }

  startHolding(e) {
    if (!this.state.isZoomed || !this.state.isFlipped) return;
    this.state.isHolding = true;
    this.state.hasMoved = false;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
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
    const isTouch = !!e.touches;
    if (!isTouch && !this.state.isHolding) return;

    const rect = this.cachedRect || this.card.getBoundingClientRect();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

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