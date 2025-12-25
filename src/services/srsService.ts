
// src/services/srsService.ts

export const isReviewDue = (nextReviewDate?: string): boolean => {
  if (!nextReviewDate) return false;
  // Sprawdza, czy dzisiejsza data jest późniejsza niż data planowanej powtórki
  return new Date() >= new Date(nextReviewDate);
};

export const calculateNextReview = (currentLevel: number, passed: boolean) => {
  if (!passed) {
    // Jeśli użytkownik nie zdał, resetujemy poziom do 0 i powtórka jest natychmiast
    return { 
      nextLevel: 0, 
      nextDate: new Date().toISOString() 
    };
  }

  // Interwały powtórek w dniach (np. po 1 dniu, po 3, po 7, po 14...)
  const intervals = [1, 3, 7, 14, 30, 90, 180];
  
  // Zwiększamy poziom, ale nie więcej niż mamy interwałów
  const nextLevel = Math.min(currentLevel + 1, intervals.length - 1);
  const daysToAdd = intervals[currentLevel] || 1;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return { 
    nextLevel, 
    nextDate: nextDate.toISOString() 
  };
};