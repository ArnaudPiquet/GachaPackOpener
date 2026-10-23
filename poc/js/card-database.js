// card-database.js
export const CardDatabase = {
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