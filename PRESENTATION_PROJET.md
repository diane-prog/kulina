# Kulina — Chef en poche

> **L'application culinaire intelligente conçue pour apprendre et réussir les recettes d'Afrique de l'Ouest pas à pas.**

---

## 1. Présentation générale

**Kulina** (aussi appelé *Chef en poche*) est une plateforme culinaire interactive pensée pour le **Bénin**, le **Togo** et plus largement l'Afrique de l'Ouest. 

Inspirée d'applications comme *Tasty* et *Kitchen Stories*, Kulina a été spécialement adaptée aux réalités du continent :
* Les budgets sont exprimés en **Francs CFA (FCFA / XOF)** avec estimation des prix au marché local.
* Les ingrédients intègrent leurs noms en langues locales (**Fon, Mina, Éwé**).
* Le guidage est pensé pour être accessible même avec une connexion Internet modeste.

---

## 2. La mission : Réconcilier tout le monde avec la cuisine

Apprendre à cuisiner les plats traditionnels peut être intimidant : peur de brûler la préparation, mauvaise gestion du feu, assaisonnement imprécis, dosages au hasard...

Kulina transforme cette expérience en un **guidage pas à pas bienveillant et interactif**. Que l'on soit un grand débutant, un adolescent, un jeune travailleur, une femme ou un homme souhaitant cuisiner avec autonomie, Kulina accompagne l'utilisateur de l'achat des ingrédients jusqu'au dressage du plat.

---

## 3. Ce que fait l'application (Fonctionnalités clés)

### A. Le Catalogue de Recettes Africaines
* **Fiches recettes détaillées** : classées par pays (`Bénin`, `Togo`, ou `Panafricain`), par catégorie (sauces, féculents, pâtes, bouillies, beignets, boissons) et par niveau de difficulté.
* **Étapes illustrées avec minuteurs précis** : chaque étape indique la durée idéale, minimale et maximale, ainsi que les points critiques de cuisson (ex. gestion de l'huile chaude ou du feu).
* **Noms et équivalences locales** : chaque ingrédient dispose de son équivalent local et de substituts possibles si un ingrédient manque.

### B. Recherche intelligente : "Cuisiner avec ce qu'on a"
* **Recherche par le placard / réfrigérateur** : l'utilisateur coche les ingrédients qu'il a sous la main (ex : *tomate, riz, huile, piment*), et Kulina lui propose les recettes immédiatement réalisables sans avoir à ressortir faire des courses.
* **Filtre par budget en FCFA** : possibilité de filtrer les recettes réalisables selon une enveloppe budgétaire (ex : *un plat pour 4 personnes à moins de 2 000 FCFA*).

### C. Mode Cuisson en Direct (Live Cooking)
* **Guidage pas à pas en temps réel** : l'écran n'affiche qu'une seule étape à la fois pour éviter toute confusion en pleine préparation.
* **Minuteurs synchronisés** : des compteurs sonores et visuels alertent l'utilisateur au moment exact où il faut remuer, baisser le feu ou couper la cuisson.
* **Préparation au guidage vocal** : scripts narratifs intégrés pour lire les instructions sans avoir à toucher l'écran avec des doigts mouillés ou huileux.

### D. L'Assistant Culinaire IA Hybride
Pendant la cuisine, les débutants font souvent face à des imprévus (*"ma sauce est trop salée"*, *"mon riz brûle au fond"*, *"la pâte a des grumeaux"*). Kulina intègre un assistant intelligent :
1. **Solutions immédiates aux erreurs courantes (*Rules-First*)** : dès qu'une question correspond à un problème classique du plat, la solution validée par des cuisiniers locaux est fournie instantanément.
2. **Conseils ouverts via Google Gemini** : pour toute autre question spontanée, l'IA formule une réponse claire, courte (3 phrases maximum) et sécuritaire.
3. **Le Photo-Check** : l'utilisateur peut prendre en photo sa casserole. L'IA analyse l'image (couleur, texture, réduction de la sauce) et confirme si la cuisson est réussie ou s'il faut ajuster le feu.

### E. Organisation & Vie Quotidienne
* **Planning des repas de la semaine** : organisation des menus du lundi au dimanche pour toute la famille.
* **Liste de courses automatisée** : génération de la liste des ingrédients nécessaires à partir du planning, avec estimation du coût total prévisionnel en FCFA.
* **Suivi budgétaire** : tableau de bord pour suivre ses dépenses alimentaires au mois.

### F. Communauté & Partage
* **Avis et retours d'expérience** : notes étoilées et commentaires sous chaque recette.
* **Favoris** : carnet de recettes personnelles sauvegardées.
* **Espace communautaire** : partage de photos de ses réussites, questions et astuces entre passionnés de cuisine.

---

## 4. Ce qui rend Kulina unique

| Défi classique en cuisine | Solution apportée par Kulina |
| :--- | :--- |
| *« Je ne sais pas doser ou gérer la cuisson »* | Étapes chronométrées avec durées idéales, min et max. |
| *« Les recettes trouvées en ligne coûtent trop cher »* | Coûts réels calculés en FCFA selon les prix des marchés béninois et togolais. |
| *« Je ne connais pas le nom français de l'ingrédient »* | Traduction et recherche en Fon, Mina et Éwé. |
| *« J'ai fait une bêtise pendant la cuisson et je panique »* | L'assistant IA intervient immédiatement pour sauver le plat. |
| *« Je n'ai pas les moyens de payer pour apprendre »* | Plateforme ouverte et accessible à tous gratuitement. |

---

## 5. Résumé technique succinct

* **Technologie Backend** : NestJS, TypeScript, PostgreSQL, TypeORM, Redis, Socket.IO, Google Gemini API, Cloudinary.
* **Accès API** : `/api/v1/` avec documentation interactive Swagger intégrée.
* **Temps réel** : Passerelle WebSockets `/cooking` pour le suivi des sessions et du chat.
