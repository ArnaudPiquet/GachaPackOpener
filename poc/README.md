# 🎴 Moteur de Carte Évolutive 3D

Système de carte tridimensionnelle interactive optimisé pour un rendu constant à **60 FPS** (sans *Layout Thrashing*), gérant de manière transparente les interactions souris (PC), tactiles (Mobile-First) et gyroscopiques (iOS & Android).

L'application est structurée de manière à garantir une stricte parité de fonctionnalités et d'expérience utilisateur entre les différents systèmes d'exploitation mobiles et de bureau.

---

## 🏗️ Architecture du Projet

Le projet est organisé en répertoires spécialisés pour séparer les ressources de styles et les modules logiques :

```text
├── index.html          # Point d'entrée HTML et montage de l'application
├── css/
│   └── style.css       # Styles spéculaires, thèmes de raretés et animations 3D
└── js/
    └── index.html      # Fichier JavaScript contenant les modules logiques et l'orchestrateur
```

---

## 🧩 Organisation des Modules Logiques

Bien que centralisé dans un fichier JavaScript unique, le code est segmenté en **4 blocs logiques distincts** pour structurer l'application :

### 1. Module de Données (`CardDatabase`)
* **Rôle** : Modèle de données contenant le catalogue (séries, pools d'objets) et l'algorithme de sélection aléatoire.
* **Fonction clé** : `getRandomCard()` extrait un item au hasard et applique une configuration spécifique à sa rareté (thème CSS associé et libellé textuel).

### 2. Factory de Rendu (`CardDOMFactory`)
* **Rôle** : Composant responsable de la génération graphique de la carte.
* **Fonction clé** : `create(cardInfo, targetContainerId)` construit l'arborescence HTML complète (`.card-glow`, `.card-flipper`, `.card-back`, `.card-front`, `.card-shine`) et l'injecte dans le conteneur cible `#poc-container`.

### 3. Contrôleur d'Interactions (`CardInteractiveEngine`)
* **Rôle** : Gestionnaire physique qui capture les entrées utilisateur (souris, tactile, gyroscope) et applique les matrices de déformation parallaxe.
* **Optimisations de performance** :
  * **Zéro Layout Thrashing** : Utilisation d'un cache géométrique (`cachedRect`) calculé uniquement à la stabilisation du zoom pour bloquer les recalculs de mise en page provoqués par `getBoundingClientRect()`.
  * **Écouteurs Volatils** : Les événements lourds (`mousemove`, `touchmove`, `deviceorientation`) sont alloués uniquement pendant la phase de focus et détruits au dézoom via `toggleListeners()` pour libérer le processeur.
  * **Normalisation Angulaire** : Compensation mathématique automatique sur 360° pour les deltas gyroscopiques afin d'éviter les inversions brutales lors de l'inclinaison.

### 4. Orchestrateur
* **Rôle** : Déclenche le cycle de vie de l'application au chargement complet du DOM (`DOMContentLoaded`). Il récupère une carte du modèle, demande sa création à la factory, puis instancie le moteur d'interaction 3D sur le composant généré.

---

## ⚡ Mécaniques Visuelles (`css/style.css`)

La feuille de style orchestre la spatialisation en trois dimensions à l'aide de plusieurs couches de calques superposés :

* **`.card-glow` (Arrière-plan)** : Gère le halo lumineux diffusé à l'arrière de la carte à l'aide d'un filtre `blur(25px)` indexé sur la couleur de la rareté.
* **`.card-flipper` (Pivot)** : Gère la révolution d'apparition à 180° au premier clic grâce à la propriété `transform-style: preserve-3d`.
* **`.card-front::after` & `.card-shine` (Reflets)** : Calques spéculaires utilisant le mode de fusion `mix-blend-mode: color-dodge` pour sur-illuminer les textures de la carte lors des inclinaisons ou du flash d'apparition (`holo-flash`).

---

## 🚀 Éxécution en Local

Pour développer et tester l'application dans des conditions optimales, l'utilisation d'un serveur HTTP léger est recommandée :

```bash
npx serve
```