// Bot configuration
const MIN_ELO = 0;
const MAX_ELO_CAP = 2000; // Bot stops improving after this ELO

// Speed configuration (lower is faster)
const MAX_DELAY_MS = 6000; // Delay for 0 ELO (very slow)
const MIN_DELAY_MS = 2000; // Delay for 2000+ ELO (fast)

// Accuracy configuration (higher is better)
const MIN_ACCURACY = 0.5; // 50% chance for 0 ELO
const MAX_ACCURACY = 0.95; // 95% chance for 2000+ ELO

/**
 * Calculates how long the bot takes to answer based on player's ELO.
 * Higher ELO -> Faster bot (lower delay).
 */
export const getBotDelay = (playerElo: number): number => {
    const normalizedElo = Math.min(Math.max(playerElo, MIN_ELO), MAX_ELO_CAP);
    const ratio = normalizedElo / MAX_ELO_CAP;

    // Linear interpolation: ratio 0 -> MAX_DELAY, ratio 1 -> MIN_DELAY
    return Math.round(MAX_DELAY_MS - (ratio * (MAX_DELAY_MS - MIN_DELAY_MS)));
};

/**
 * Determines if the bot should answer correctly based on player's ELO.
 * Higher ELO -> Smarter bot (higher accuracy).
 */
export const shouldBotAnswerCorrectly = (playerElo: number): boolean => {
    const normalizedElo = Math.min(Math.max(playerElo, MIN_ELO), MAX_ELO_CAP);
    const ratio = normalizedElo / MAX_ELO_CAP;

    // Linear interpolation: ratio 0 -> MIN_ACCURACY, ratio 1 -> MAX_ACCURACY
    const currentAccuracy = MIN_ACCURACY + (ratio * (MAX_ACCURACY - MIN_ACCURACY));

    return Math.random() < currentAccuracy;
};

/**
 * Generates a fake bot profile.
 */
export const generateBotProfile = (targetElo: number): any => {
    // Generate a slightly randomized ELO around the player's ELO to make it realistic
    const botElo = Math.max(0, Math.round(targetElo + (Math.random() * 100 - 50)));

    const botNames = [
        "BioBot Alpha", "Genetyczny GURU", "Mistrz Mitochondriów",
        "Cytoplazma_PL", "Helix DNA", "Dr. Darwin",
        "Neuronek", "Synapsa_X", "Enzym Ewa", "Pan Perocyt"
    ];

    const randomName = botNames[Math.floor(Math.random() * botNames.length)];

    return {
        uid: `BOT_${Date.now()}`,
        displayName: randomName,
        photoURL: '', // Use default avatar or specific bot avatar if available
        isBot: true,
        stats: {
            elo: botElo,
            wins: 100,
            losses: 50,
            tier: 'gold_1' // Placeholder
        }
    };
};
