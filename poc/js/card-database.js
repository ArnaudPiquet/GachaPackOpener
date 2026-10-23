// js/card-database.js
export const CardDatabase = {
  // Intégration de ta nouvelle structure brute
  series: {
    "series1": {
      "name": "Série 1 : Origines",
      "rates": { "commune_count": 7, "peu_commune_count": 3, "rare_holo_chance": 33.3 },
      "pool": {
        "commune": [
          { "name": "Épée en bois", "img": "" },
          { "name": "Potion mineure", "img": "" },
          { "name": "Bouclier usé", "img": "" },
          { "name": "Herbe médicinale", "img": "" },
          { "name": "Flèche en fer", "img": "" }
        ],
        "peuCommune": [
          { "name": "Épée en acier", "img": "" },
          { "name": "Potion de soin", "img": "" },
          { "name": "Anneau d'agilité", "img": "" },
          { "name": "Arc long", "img": "" }
        ],
        "rare": [
          { "name": "Lame de feu", "img": "" },
          { "name": "Armure de plates", "img": "" },
          { "name": "Amulette ancienne", "img": "" }
        ],
        "rareHolo": [
          { "name": "Excalibur Brillante", "img": "" },
          { "name": "Cristal de Dragon Holo", "img": "" },
          { "name": "Égide Cosmique", "img": "" }
        ]
      }
    },
    "series2": {
      "name": "Série 2 : Légendes Sombres",
      "rates": { "commune_count": 5, "peu_commune_count": 5, "rare_holo_chance": 10.0 },
      "pool": {
        "commune": [
          { "name": "Fragment d'os", "img": "" },
          { "name": "Bougie usée", "img": "" },
          { "name": "Dague rouillée", "img": "" }
        ],
        "peuCommune": [
          { "name": "Lanterne de déchu", "img": "" },
          { "name": "Cape d'invisibilité", "img": "" },
          { "name": "Grimoire maudit", "img": "" }
        ],
        "rare": [
          { "name": "Faucheuse d'âmes", "img": "" },
          { "name": "Armure de l'ombre", "img": "" }
        ],
        "rareHolo": [
          { "name": "Oeil de Cthulhu Holo", "img": "" },
          { "name": "Couronne du Roi Squelette", "img": "" }
        ]
      }
    }
  },

  /**
   * Extrait un item basé sur la série et le type de slot demandé
   */
  pullCardFromSlot(seriesKey, targetRarity) {
    const seriesData = this.series[seriesKey];
    if (!seriesData) return null;

    let finalRarity = targetRarity;

    // Gestion de la mécanique de sur-classement des Peu Communes (Upgrade System)
    if (targetRarity === "peuCommune") {
      const roll = Math.random() * 100;
      if (roll <= seriesData.rates.rare_holo_chance) {
        finalRarity = "rareHolo"; // Succès du Gacha : Devient une Rare Holo !
      } else {
        finalRarity = "rare"; // Échec du Gacha : Devient une Rare classique
      }
    }

    const itemsList = seriesData.pool[finalRarity];
    // Sécurité au cas où un pool de rareté est vide
    if (!itemsList || itemsList.length === 0) return null;

    const rolledItem = itemsList[Math.floor(Math.random() * itemsList.length)];

    const configuration = {
      commune: { css: "commune", label: "Commune" },
      peuCommune: { css: "peu-commune", label: "Peu Commune" },
      rare: { css: "rare", label: "Rare" },
      rareHolo: { css: "rare-holo", label: "Rare Holo ✨" }
    };

    const config = configuration[finalRarity] || configuration.commune;

    return { 
      name: rolledItem.name, 
      img: rolledItem.img,
      rarity: config.css, 
      label: config.label 
    };
  }
};