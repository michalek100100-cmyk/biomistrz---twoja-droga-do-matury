import { db } from '../components/firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, onSnapshot } from 'firebase/firestore';
import { Territory } from '../types';

const TERRITORY_COLLECTION = 'territories';

// Initialize some predefined territories if none exist
export const initializeTerritoriesBase = async () => {
    const defaultTerritories: Territory[] = [
        {
            id: 'warsaw_citadel',
            name: 'Cytadela Warszawska',
            location: { lat: 52.2297, lng: 21.0122, radius: 50 },
            ownerClanId: null,
            contestedBy: {},
            resourceYield: { gems: 50, elo: 10 }
        },
        {
            id: 'cracow_wawel',
            name: 'Zamek na Wawelu',
            location: { lat: 50.0541, lng: 19.9353, radius: 50 },
            ownerClanId: null,
            contestedBy: {},
            resourceYield: { gems: 40, elo: 8 }
        },
        {
            id: 'gdansk_crane',
            name: 'Żuraw Gdański',
            location: { lat: 54.3498, lng: 18.6527, radius: 50 },
            ownerClanId: null,
            contestedBy: {},
            resourceYield: { gems: 45, elo: 9 }
        }
    ];

    try {
        const snapshot = await getDocs(collection(db, TERRITORY_COLLECTION));
        if (snapshot.empty) {
            for (const t of defaultTerritories) {
                await setDoc(doc(db, TERRITORY_COLLECTION, t.id), t);
            }
            console.log("Dodano bazowe terytoria.");
        }
    } catch (e) {
        console.error("Błąd inicjalizacji terytoriów:", e);
    }
};

// Fetch all territories once
export const getTerritories = async (): Promise<Territory[]> => {
    try {
        const snapshot = await getDocs(collection(db, TERRITORY_COLLECTION));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Territory));
    } catch (error) {
        console.error("Error fetching territories:", error);
        return [];
    }
};

// Listen to territory changes in real time
export const subscribeToTerritories = (onUpdate: (territories: Territory[]) => void) => {
    const q = query(collection(db, TERRITORY_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const territories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Territory));
        onUpdate(territories);
    });
};

// Contribute points to capture a territory
// A clan needs to reach a certain threshold of points to claim an unowned or owned territory.
export const contributeToTerritory = async (territoryId: string, clanId: string, amount: number) => {
    try {
        const ref = doc(db, TERRITORY_COLLECTION, territoryId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { success: false, error: 'Nie znaleziono terytorium.' };

        const data = snap.data() as Territory;
        const currentPoints = data.contestedBy[clanId] || 0;
        const newPoints = currentPoints + amount;

        const newContestedBy = { ...data.contestedBy, [clanId]: newPoints };

        // Simple capturing logic: if you reach over 1000 points and have the highest score, you capture it
        // Or if it's already owned, you need more than the owner's points (simplified logic for now)
        let newOwnerDetails: Partial<Territory> = {};

        const POINTS_TO_CAPTURE = 1000;
        if (newPoints >= POINTS_TO_CAPTURE) {
            let maxPoints = 0;
            let currentWinner = data.ownerClanId;

            for (const [cId, points] of Object.entries(newContestedBy)) {
                if (points > maxPoints) {
                    maxPoints = points;
                    currentWinner = cId;
                }
            }

            if (currentWinner && currentWinner !== data.ownerClanId) {
                newOwnerDetails.ownerClanId = currentWinner;
                // Optionally reset contested points or deduct from losers
            }
        }

        await updateDoc(ref, {
            contestedBy: newContestedBy,
            ...newOwnerDetails
        });

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};
