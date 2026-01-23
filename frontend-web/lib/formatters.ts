export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(d);
};

export const formatBMI = (bmi: number): string => {
  return bmi.toFixed(1);
};

export const formatPercentage = (value: number): string => {
  const percentage = value <= 1 ? value * 100 : value;
  return percentage.toFixed(1) + "%";
};

export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatFingerName = (name: string): string => {
  const parts = name.split("_");
  if (parts.length === 2) {
    const [finger, hand] = parts;
    return `${capitalize(hand)} ${capitalize(finger)}`;
  }
  return capitalize(name.replace(/_/g, " "));
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
