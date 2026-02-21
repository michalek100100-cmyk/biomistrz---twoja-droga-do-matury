// src/services/srsService.ts
// Upgraded to SM-2 algorithm for better spaced repetition

/**
 * SM-2 Algorithm Implementation
 * Based on SuperMemo's spaced repetition algorithm.
 * 
 * Quality ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but easily recalled
 * 3 - Correct, with significant difficulty
 * 4 - Correct, with some hesitation
 * 5 - Perfect recall
 */

export interface SRSData {
  easeFactor: number;   // 1.3 - 2.5, difficulty of the item
  interval: number;     // Days until next review
  repetitions: number;  // Number of correct reviews in a row
  nextReviewDate: string;
  quality?: number;     // Last quality rating
}

// Default values for new items
export const DEFAULT_SRS_DATA: SRSData = {
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  nextReviewDate: new Date().toISOString()
};

/**
 * Check if a review is due
 */
export const isReviewDue = (nextReviewDate?: string): boolean => {
  if (!nextReviewDate) return false;
  return new Date() >= new Date(nextReviewDate);
};

/**
 * Calculate next review based on SM-2 algorithm
 * @param currentData - Current SRS data
 * @param quality - Quality of response (0-5)
 * @returns Updated SRS data
 */
export const calculateSM2 = (
  currentData: Partial<SRSData> = {},
  quality: number
): SRSData => {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  let {
    easeFactor = 2.5,
    interval = 1,
    repetitions = 0
  } = currentData;

  // Quality < 3 means failure - reset repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Custom sequence: 1, 3, 7, 14, 21, 90 (approx 3 months)
    const intervals = [1, 3, 7, 14, 21, 90];
    if (repetitions < intervals.length) {
      interval = intervals[repetitions];
    } else {
      interval = intervals[intervals.length - 1];
    }
    repetitions += 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor should never go below 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextDate.toISOString(),
    quality
  };
};

/**
 * Convert quiz score to SM-2 quality rating
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @returns Quality rating 0-5
 */
export const scoreToQuality = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;

  const percentage = (correctAnswers / totalQuestions) * 100;

  if (percentage >= 95) return 5;      // Perfect
  if (percentage >= 80) return 4;      // Good
  if (percentage >= 60) return 3;      // Pass
  if (percentage >= 40) return 2;      // Struggle
  if (percentage >= 20) return 1;      // Poor
  return 0;                            // Fail
};

/**
 * Legacy function for backwards compatibility
 * Maps to new SM-2 algorithm
 */
export const calculateNextReview = (currentLevel: number, passed: boolean) => {
  const quality = passed ? 4 : 1;
  const result = calculateSM2({ repetitions: currentLevel }, quality);

  return {
    nextLevel: result.repetitions,
    nextDate: result.nextReviewDate
  };
};

/**
 * Get human-readable time until next review
 */
export const getTimeUntilReview = (nextReviewDate?: string): string => {
  if (!nextReviewDate) return 'Teraz';

  const now = new Date();
  const review = new Date(nextReviewDate);
  const diffMs = review.getTime() - now.getTime();

  if (diffMs <= 0) return 'Teraz';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? 'Jutro' : `Za ${diffDays} dni`;
  }

  return `Za ${diffHours} godz.`;
};

/**
 * Get difficulty label based on ease factor
 */
export const getDifficultyLabel = (easeFactor: number): string => {
  if (easeFactor >= 2.3) return 'Łatwe';
  if (easeFactor >= 2.0) return 'Normalne';
  if (easeFactor >= 1.7) return 'Trudne';
  return 'Bardzo trudne';
};