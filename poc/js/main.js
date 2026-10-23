import { CardDatabase } from './card-database.js';
import { CardDOMFactory } from './card-dom-factory.js';
import { CardInteractiveEngine } from './card-interactive-engine.js';

const CARDS_PER_PACK = 5; // Nombre de cartes par défaut dans le paquet

window.addEventListener('DOMContentLoaded', () => {
  const packButton = document.getElementById('open-pack-btn');
  if (!packButton) return;

  packButton.addEventListener('click', (e) => {
    e.stopPropagation();

    const container = document.getElementById('poc-container');
    if (!container) return;
    container.innerHTML = ''; // Nettoyage exclusif à l'ouverture du pack

    const enginesGroup = [];

    for (let i = 0; i < CARDS_PER_PACK; i++) {
      const luckyCardData = CardDatabase.getRandomCard();
      const cardWrapper = CardDOMFactory.create(luckyCardData, 'poc-container');

      if (cardWrapper) {
        const randomAngle = (Math.random() * 8 - 4).toFixed(1);
        const randomX = (Math.random() * 10 - 5).toFixed(1);   
        const randomY = (Math.random() * 10 - 5).toFixed(1);   
        
        const cardZIndex = 1000 - i;
        cardWrapper.style.zIndex = cardZIndex;

        const pileTransform = `translate(-50%, -50%) translate(${randomX}px, ${randomY}px) rotateZ(${randomAngle}deg)`;
        cardWrapper.style.setProperty('--pile-transform', pileTransform);
        cardWrapper.style.transform = pileTransform;

        const interactiveEngine = new CardInteractiveEngine(cardWrapper);
        enginesGroup.push(interactiveEngine);
      }
    }

    if (enginesGroup.length > 0) {
      const triggerSequence = (gyroAllowed) => {
        enginesGroup.forEach(engine => engine.zoomInHiddenCard(gyroAllowed));
      };

      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => {
            triggerSequence(permissionState === 'granted');
          })
          .catch((error) => {
            console.error("Échec capteurs iOS :", error);
            triggerSequence(false);
          });
      } else {
        triggerSequence(false);
      }
    }
  });
});