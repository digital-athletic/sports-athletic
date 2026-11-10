/**
 * Position after one tap on the swap button: 0 is the original exercise,
 * 1 to n the alternatives. A tap past the last alternative returns to 0.
 *
 * nextSwapPosition(3, 3) → 0
 */
export const nextSwapPosition = (
  position: number,
  alternativeCount: number,
): number =>
  alternativeCount === 0 ? 0 : (position + 1) % (alternativeCount + 1);
