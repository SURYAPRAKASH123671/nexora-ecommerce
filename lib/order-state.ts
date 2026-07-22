export const FULFILMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  CONFIRMED: ["PROCESSING", "ORDER_CANCELLED"],
  PROCESSING: ["SHIPPED", "ORDER_CANCELLED"],
  PACKED: ["SHIPPED", "ORDER_CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  ORDER_CANCELLED: [],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export const ORDER_TIMELINE = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export function canTransitionOrder(from: string, to: string): boolean {
  return FULFILMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function customerCanCancel(status: string): boolean {
  return ["PLACED", "CONFIRMED", "PROCESSING", "PACKED"].includes(status);
}

export function displayOrderStatus(status: string): string {
  return (status === "PACKED" ? "PROCESSING" : status)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
