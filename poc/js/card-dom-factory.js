// card-dom-factory.js
export const CardDOMFactory = {
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