export const bouillieDeRizSeed = {
    slug: 'bouillie-de-riz',
    title: 'Bouillie de riz',
    description:
        'Une bouillie de riz douce et économique, parfaite pour le petit-déjeuner.',
    country: 'BOTH',
    category: 'Bouillies',
    difficulty: 'easy',
    prepMinutes: 10,
    cookMinutes: 35,
    baseServings: 2,
    estimatedBudgetXof: 1000,
    ingredients: [
        { name: 'Riz', quantity: 1, unit: 'tasse' },
        { name: 'Eau', quantity: 5, unit: 'tasse' },
        { name: 'Sel', quantity: 1, unit: 'pincée', optional: true },
        { name: 'Sucre', quantity: 1, unit: 'cuillère', optional: true },
        { name: 'Lait', quantity: 1, unit: 'tasse', optional: true },
    ],
    steps: [
        {
            position: 1,
            title: 'Laver le riz',
            instruction: "Verse de l'eau chaude sur le riz et lave-le.",
        },
        {
            position: 2,
            title: 'Laisser reposer',
            instruction: "Laisse le riz dans l'eau chaude.",
            idealSeconds: 300,
            minSeconds: 240,
            maxSeconds: 600,
        },
        {
            position: 3,
            title: 'Mettre à cuire',
            instruction: "Égoutte le riz et mets-le dans l'eau bouillante.",
        },
        {
            position: 4,
            title: 'Cuisson',
            instruction: 'Cuis à feu moyen et remue de temps en temps.',
            idealSeconds: 1800,
            minSeconds: 1500,
            maxSeconds: 2100,
            isCritical: true,
        },
        {
            position: 5,
            title: 'Finition',
            instruction:
                'Écrase ou mixe selon la texture voulue, sale ou sucre.',
        },
    ],
    issues: [
        {
            step: 2,
            symptom: 'Le riz a trempé 20 minutes au lieu de 5',
            cause: 'Le riz a trop gonflé',
            fix: 'Égoutte, rince vite, et réduis la cuisson d’environ 5 minutes. Vérifie la texture avant la fin.',
            severity: 'medium',
        },
        {
            step: 4,
            symptom: 'Trop épaisse',
            fix: "Ajoute de l'eau chaude petit à petit en remuant.",
            severity: 'low',
        },
        {
            step: 4,
            symptom: 'Trop liquide',
            fix: 'Prolonge la cuisson de 5 à 10 minutes à feu doux.',
            severity: 'low',
        },
        {
            step: 4,
            symptom: 'Ça brûle au fond',
            fix: 'Ne gratte pas. Transfère sans le fond dans une autre casserole.',
            severity: 'high',
        },
        {
            step: 5,
            symptom: 'Grumeaux',
            fix: 'Fouette ou mixe.',
            severity: 'low',
        },
    ],
};
