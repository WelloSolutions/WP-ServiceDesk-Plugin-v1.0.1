export const setPrimaryTheme = (hexColor) => {
  if (!hexColor) return;

  const cleanHex = hexColor.replace("#", "");
  const bigint = parseInt(cleanHex, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  document.documentElement.style.setProperty(
    "--color-primary",
    `${r} ${g} ${b}`
  );

  document.documentElement.style.setProperty(
    "--color-primary-foreground",
    brightness < 160 ? "255 255 255" : "0 0 0"
  );
};