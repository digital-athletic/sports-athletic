export type MaxValueType = {
  barbell?: number; // two sided exercises with LH
  dumbbells?: number; // one KH on two sided exercises with KH
  oneSidedUpper?: number; // one KH on one arm exercises with KH
  oneSidedBarbell?: number; // LH exercises on one leg
  oneSidedLower?: number; // one KH on one leg exercises with KH
  oneSidedLowerSupported?: number; // one KH on one sided leg exercises with KH and support from the second leg
};
