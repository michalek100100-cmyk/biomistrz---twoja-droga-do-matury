import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { subscribeToTerritories, contributeToTerritory } from '../services/territoryService';
import { Territory, Clan } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Swords, Map } from 'lucide-react';
import L from 'leaflet';

interface ClanTerritoryMapProps {
    clan: Clan;
    userId: string;
}

// Custom icons
const territoryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1183/1183204.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const myClanIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/8695/8695914.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
});

const ClanTerritoryMap: React.FC<ClanTerritoryMapProps> = ({ clan }) => {
    const { t } = useLanguage();
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);
    const [attackingId, setAttackingId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = subscribeToTerritories((data) => {
            setTerritories(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleAttack = async (territoryId: string) => {
        setAttackingId(territoryId);
        // Simulate sending troops / contributing points
        // In a real game, this might cost Kasztany or ELO
        const attackPower = 100; // arbitrary value
        await contributeToTerritory(territoryId, clan.id, attackPower);
        setAttackingId(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-700 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-3xl">
                <h3 className="font-black text-white text-lg flex items-center gap-2 mb-2">
                    <Map className="w-5 h-5 text-emerald-400" /> {t.clans.territory.title}
                </h3>
                <p className="text-gray-400 text-xs">
                    {t.clans.territory.desc}
                </p>
            </div>

            <div className="rounded-3xl overflow-hidden border-2 border-gray-700 h-[400px] relative shadow-2xl relative z-0">
                <MapContainer
                    center={[52.0, 19.5]}
                    zoom={5}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Clan's Home Base */}
                    {clan.location && (
                        <Marker position={[clan.location.lat, clan.location.lng]} icon={myClanIcon}>
                            <Popup>
                                <div className="text-center font-bold">
                                    <p className="text-sm">{t.clans.territory.homeBase}</p>
                                    <p className="text-emerald-500">{clan.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Contested Territories */}
                    {territories.map(territory => {
                        const isOwner = territory.ownerClanId === clan.id;
                        const myPoints = territory.contestedBy[clan.id] || 0;
                        const totalPoints = Object.values(territory.contestedBy).reduce((a, b) => a + b, 0);
                        const progress = totalPoints > 0 ? Math.min(100, Math.round((myPoints / 1000) * 100)) : 0;

                        return (
                            <React.Fragment key={territory.id}>
                                <Circle
                                    center={[territory.location.lat, territory.location.lng]}
                                    radius={territory.location.radius * 200} // visual scaling
                                    pathOptions={{
                                        color: isOwner ? '#10b981' : '#ef4444',
                                        fillColor: isOwner ? '#10b981' : '#ef4444',
                                        fillOpacity: 0.2
                                    }}
                                />
                                <Marker position={[territory.location.lat, territory.location.lng]} icon={territoryIcon}>
                                    <Popup className="territory-popup">
                                        <div className="p-1 space-y-2 min-w-[150px]">
                                            <h4 className="font-black text-gray-800 text-sm border-b pb-1">{territory.name}</h4>

                                            <div className="text-xs space-y-1">
                                                <p><span className="font-bold text-gray-500">{t.clans.territory.status}:</span> {isOwner ? <span className="text-emerald-600 font-bold">{t.clans.territory.yourStatus}</span> : territory.ownerClanId ? <span className="text-red-500 font-bold">{t.clans.territory.occupiedStatus}</span> : <span className="text-gray-400 font-bold">{t.clans.territory.neutralStatus}</span>}</p>
                                                <p><span className="font-bold text-gray-500">{t.clans.territory.yield}:</span> +{territory.resourceYield.gems} 🌰 / {t.clans.territory.perDay}</p>

                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-gray-400 text-[10px] uppercase">{t.clans.territory.capture}</span>
                                                        <span className="font-bold text-blue-600 text-[10px]">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAttack(territory.id); }}
                                                disabled={attackingId === territory.id}
                                                className="w-full mt-2 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                {attackingId === territory.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Swords className="w-3 h-3" />
                                                )}
                                                {isOwner ? t.clans.territory.strengthen : t.clans.territory.attack}
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default ClanTerritoryMap;
