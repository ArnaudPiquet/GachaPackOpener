// main.js
import { CardDatabase } from './card-database.js';
import { CardDOMFactory } from './card-dom-factory.js';
import { CardInteractiveEngine } from './card-interactive-engine.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Récupère les données d'une carte tirée au hasard
  const luckyCardData = CardDatabase.getRandomCard();

  // 2. Injecte le composant dans l'élément HTML '#poc-container'
  const cardWrapper = CardDOMFactory.create(luckyCardData, 'poc-container');

  // 3. Si l'injection a réussi, active les fonctionnalités 3D interactives
  if (cardWrapper) {
    new CardInteractiveEngine(cardWrapper);
  }
});