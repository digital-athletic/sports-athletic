/** Turns a `#RGB` or `#RRGGBB` color into an `rgba()` string with the given opacity (0 to 1). */
export const withOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace("#", "");
  const fullHex =
    hex.length === 3
      ? hex
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : hex;
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
