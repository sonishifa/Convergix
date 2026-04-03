const USER_COLORS = [
  '#f87171',
  '#fb923c',
  '#a78bfa',
  '#34d399',
  '#60a5fa',
  '#f472b6',
];

export function randomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}