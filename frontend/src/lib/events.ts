/** CRUD sonrası veri güncellemesi – Dashboard vb. bileşenler dinler */
export const DATA_UPDATED = "aerotech-data-updated";

export function notifyDataUpdated(): void {
  window.dispatchEvent(new CustomEvent(DATA_UPDATED));
}
