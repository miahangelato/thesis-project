export function kgToLb(kg: number) {
  return kg * 2.20462;
}

export function lbToKg(lb: number) {
  return lb / 2.20462;
}

export function cmToFtIn(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number) {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
}
