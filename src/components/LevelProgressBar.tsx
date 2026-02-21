
import React, { useState } from 'react';
import { UserStats } from '../types';
import { getUnclaimedMilestones } from '../services/levelRewardService';
import { xpToLevel, XP_PER_LEVEL } from '../services/rankingService';
import LevelRewardModal from './LevelRewardModal';

interface LevelProgressBarProps {
    stats: UserStats;
    userId: string;
    onClaimSuccess: (level: number) => void;
}

const ChestSVG: React.FC<{ glowing: boolean }> = ({ glowing }) => (
    <svg
        width="56" height="56" viewBox="0 0 64 64" fill="none"
        className={`transition-all duration-700 ${glowing ? 'animate-pulse scale-110 cursor-pointer drop-shadow-[0_0_15px_rgba(234,179,8,1)]' : 'opacity-80'}`}
    >
        {/* Crate Base */}
        <path d="M12 28C12 25 14 22 18 22H46C50 22 52 25 52 28V32H12V28Z" fill="#B45309" stroke={glowing ? "#FEF08A" : "#78350F"} strokeWidth={glowing ? "4" : "3"} strokeLinejoin="round" />
        <path d="M12 32H52V46C52 49 50 52 46 52H18C14 52 12 49 12 46V32Z" fill="#92400E" stroke={glowing ? "#FEF08A" : "#78350F"} strokeWidth={glowing ? "4" : "3"} strokeLinejoin="round" />
        {/* Metal bands */}
        <path d="M24 22V52M40 22V52" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        {/* Lock */}
        <rect x="28" y="28" width="8" height="10" rx="2" fill="#FCD34D" stroke="#475569" strokeWidth="2" />
        <circle cx="32" cy="33" r="1.5" fill="#475569" />
    </svg>
);

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ stats, userId, onClaimSuccess }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentLevel = xpToLevel(stats.xp);

    // Flat XP requirements (1000 per level)
    const xpInCurrentLevel = stats.xp % XP_PER_LEVEL;
    const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    // Rewards calculation
    const unclaimed = getUnclaimedMilestones(currentLevel, stats.claimedLevelRewards);
    const hasRewards = unclaimed.length > 0;

    return (
        <>
            <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-6 rounded-full border-[3px] border-green-500 bg-transparent overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div
                    onClick={() => hasRewards && setIsModalOpen(true)}
                    className="shrink-0 relative flex items-center justify-center transition-transform"
                >
                    <ChestSVG glowing={hasRewards} />
                    {hasRewards && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
                            {unclaimed.length}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && userId && hasRewards && (
                <LevelRewardModal
                    userId={userId}
                    unclaimedLevels={unclaimed}
                    onClose={() => setIsModalOpen(false)}
                    onClaimSuccess={onClaimSuccess}
                />
            )}
        </>
    );
};

export default LevelProgressBar;
