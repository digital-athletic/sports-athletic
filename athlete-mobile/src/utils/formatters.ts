/**
 * Formats time from seconds to readable string (e.g., "2 h 30 min")
 * @param time - Time in seconds
 * @returns Formatted time string
 */
export const getTimeString = (time: number): string => {
  if (time < 60) {
    return `${time} s`;
  }
  if (time < 3600) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes} min ${seconds} s`;
  }
  const hours = Math.floor(time / 3600);
  const timeLeft = time - hours * 3600;
  const minutes = Math.floor(timeLeft / 60);
  return `${hours} h ${minutes} min`;
};

/**
 * Formats weight from kilograms to readable string (e.g., "500 kg" or "1.25 t")
 * @param weight - Weight in kilograms
 * @returns Formatted weight string
 */
export const getWeightString = (weight: number): string => {
  return weight < 1000 ? `${weight} kg` : `${(weight / 1000).toFixed(2)} t`;
};
