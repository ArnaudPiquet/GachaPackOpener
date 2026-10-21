# Gacha Pack Opener & Simulation 3D Interactive

Système modulaire d'ouverture de boosters de cartes ("Lootbox / Gacha") conçu exclusivement en **Vanilla JavaScript, HTML5 et CSS3**. Le projet inclut une sauvegarde persistante de l'inventaire en base de données locale ainsi qu'un moteur de rendu 3D par clonage de nœud ("Portal") pour l'inspection holographique des objets.

## 📁 Architecture du Projet

Le projet est organisé de manière modulaire afin de séparer la structure, les styles, les scripts applicatifs et les données de configuration :

```text
📁 Ton-Projet/
├── 📁 js/
│   ├── app.js       # Logique applicative, stockage local et moteur 3D
│   └── series.js    # Base de données de configuration des cartes et taux
├── 📁 style/
│   └── style.css    # Layout général, thèmes de rareté et règles de perspective
├── index.html       # Squelette HTML5 et points d'ancrage des composants
└── README.md        # Documentation technique du projet
```

## 🚀 Fonctionnalités Majeures

1. **Persistance Locale Apatride (No-Password)** : L'authentification par pseudonyme unique génère ou charge instantanément un profil utilisateur. L'inventaire est sérialisé en JSON et sauvegardé en temps réel via l'API `localStorage` du navigateur.
2. **Moteur Aléatoire Pondéré (Drop Rate)** : Gestion dynamique des tirages basée sur le fichier de configuration. Le script s'adapte au nombre de communes et peu communes requises, puis calcule la probabilité du slot garanti (Rare ou Rare Holo).
3. **Moteur d'effet 3D isolé par Portail ("Portal Cloner")** : Pour éliminer les saccades et les glitchs d'affichage liés aux flux Flexbox/Grid de la page, la carte sélectionnée est projetée dans un conteneur HTML indépendant (`#zoom-portal`). C'est ce portail qui encaisse l'ensemble des calculs de perspective 3D.
4. **Butée Angulaire (Anti-Retournement)** : Intégration d'un système de serrage mathématique (`Clamp`) qui limite l'inclinaison physique à 35 degrés maximum, évitant ainsi que la carte ne se retourne sur elle-même si l'utilisateur déplace brutalement son curseur.
5. **Réflectivité Holographique Interne** : Un calque dynamique `.card-shine` simule un film plastique brillant en se déplaçant de manière synchronisée avec la souris pour maximiser l'effet de profondeur.

## 🔧 Maintenance et Extension de la Banque de Cartes

Pour modifier les cartes existantes, éditer les taux de drop ou ajouter de nouvelles extensions, ouvrez uniquement le fichier `js/series.js`. Suivez la structure de cet objet JavaScript global :

```javascript
const cardData = {
  "ma_nouvelle_serie": {
    "name": "Nom de l'extension affiché dans l'interface",
    "rates": {
      "commune_count": 7,       // Nombre de cartes communes tirées par pack
      "peu_commune_count": 3,   // Nombre de cartes peu communes tirées par pack
      "rare_holo_chance": 33.3  // % de chance que la carte rare soit une Rare Holo
    },
    "pool": {
      "commune": ["Carte Commune A", "Carte Commune B"],
      "peuCommune": ["Carte Peu Commune C"],
      "rare": ["Carte Rare D"],
      "rareHolo": ["Carte Rare Holographique Brillante ✨"]
    }
  }
};
```

## 🎮 Instructions de Lancement

Le projet n'utilise aucune dépendance externe ni aucun framework. 
Pour y jouer :
1. Créez les répertoires `js` et `style` et répartissez les fichiers comme indiqué dans l'arborescence.
2. Double-cliquez simplement sur le fichier racine `index.html` pour ouvrir le jeu dans votre navigateur web.