// js/main.js
import { CardDatabase } from './card-database.js';
import { CardDOMFactory } from './card-dom-factory.js';
import { CardInteractiveEngine } from './card-interactive-engine.js';

window.addEventListener('DOMContentLoaded', () => {
  
  // Logic d'aiguillage du Hub (Conserve ton code de navigation ici) ...
  const hubScreen = document.getElementById('hub-screen');
  const boosterScreen = document.getElementById('booster-screen');
  const btnGoToBooster = document.getElementById('go-to-booster');
  const btnBackToHub = document.getElementById('back-to-hub-btn');

  if (btnGoToBooster && hubScreen && boosterScreen) {
    btnGoToBooster.addEventListener('click', () => {
      hubScreen.classList.add('hidden');
      boosterScreen.classList.remove('hidden');
    });
  }
  if (btnBackToHub && hubScreen && boosterScreen) {
    btnBackToHub.addEventListener('click', () => {
      boosterScreen.classList.add('hidden');
      hubScreen.classList.remove('hidden');
    });
  }

  // ==========================================================================
  // ORCHESTRATEUR BOOSTER & BOUTON PASSER
  // ==========================================================================
  const packButton = document.getElementById('open-pack-btn');
  const seriesSelect = document.getElementById('series-select');
  const skipButton = document.getElementById('skip-pack-btn'); // Capture du bouton skip

  if (!packButton || !seriesSelect || !skipButton) return;

  packButton.addEventListener('click', (e) => {
    e.stopPropagation();

    const container = document.getElementById('poc-container');
    if (!container) return;
    container.innerHTML = ''; 

    let enginesGroup = [];

    const currentSeriesKey = seriesSelect.value; 
    const seriesData = CardDatabase.series[currentSeriesKey];
    if (!seriesData) return;
    
    const seriesRates = seriesData.rates;
    const packSlots = [];
    
    for (let i = 0; i < seriesRates.commune_count; i++) { packSlots.push("commune"); }
    for (let i = 0; i < seriesRates.peu_commune_count; i++) { packSlots.push("peuCommune"); }

    packSlots.forEach((raritySlot, index) => {
      const cardInfo = CardDatabase.pullCardFromSlot(currentSeriesKey, raritySlot);

      if (cardInfo) {
        const cardWrapper = CardDOMFactory.create(cardInfo, 'poc-container');

        if (cardWrapper) {
          const randomAngle = (Math.random() * 8 - 4).toFixed(1);
          const randomX = (Math.random() * 10 - 5).toFixed(1);   
          const randomY = (Math.random() * 10 - 5).toFixed(1);   
          
          const cardZIndex = 1000 - index;
          cardWrapper.style.zIndex = cardZIndex;

          const pileTransform = `translate(-50%, -50%) translate(${randomX}px, ${randomY}px) rotateZ(${randomAngle}deg)`;
          cardWrapper.style.setProperty('--pile-transform', pileTransform);
          cardWrapper.style.transform = pileTransform;

          const interactiveEngine = new CardInteractiveEngine(cardWrapper);
          enginesGroup.push(interactiveEngine);
        }
      }
    });

    if (enginesGroup.length > 0) {
      const triggerSequence = (gyroAllowed) => {
        enginesGroup.forEach(engine => engine.zoomInHiddenCard(gyroAllowed));
        skipButton.classList.remove('hidden'); // NOUVEAU : Affiche le bouton Passer dès que le tas est prêt
      };

      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then((permissionState) => { triggerSequence(permissionState === 'granted'); })
          .catch((error) => { console.error(error); triggerSequence(false); });
      } else {
        triggerSequence(false);
      }
    }

    // ==========================================================================
    // ÉCOUTEUR DU BOUTON PASSER (LIQUIDATION INSTANTANÉE)
    // ==========================================================================
    // On recrée l'écouteur à chaque clic de pack pour capturer le tableau exact d'engines en cours
    const onSkipClick = () => {
      skipButton.classList.add('hidden'); // Cache le bouton instantanément
      
      // On ordonne à chaque carte du paquet de court-circuiter sa physique pour aller au garage
      enginesGroup.forEach(engine => {
        if (engine.state.isZoomed) {
          // Force l'état révélé instantané pour que la face reste visible en bas
          engine.state.isFlipped = true;
          engine.wrapper.dataset.isFlipped = "true";
          engine.wrapper.classList.add('flipped');

          // Téléportation immédiate sans passer par la case setTimeout d'animation de fuite
          engine.toggleListeners(false);
          engine.wrapper.classList.remove('zoomed', 'grabbing', 'active-top-card', 'send-to-inventory');
          engine.wrapper.style.removeProperty('--pile-transform');
          engine.wrapper.style.transform = 'none';
          engine.wrapper.style.zIndex = 'auto';

          engine.card.style.transform = 'rotateX(0deg) rotateY(0deg)';
          engine.card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          
          const inventoryGrid = document.getElementById('inventory-grid');
          if (inventoryGrid) {
            inventoryGrid.appendChild(engine.wrapper);
          }
        }
      });

      // Fermeture instantanée de l'overlay global
      const overlay = document.getElementById('overlay');
      if (overlay) overlay.classList.remove('active');
      packButton.classList.remove('hidden');
      
      // Nettoyage de l'écouteur volatil pour éviter les fuites mémoire
      skipButton.removeEventListener('click', onSkipClick);
    };

    skipButton.addEventListener('click', onSkipClick);
  });
});