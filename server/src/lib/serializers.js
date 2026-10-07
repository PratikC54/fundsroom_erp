export const asNumber = (value) =>
  typeof value === "object" && value?.toNumber
    ? value.toNumber()
    : Number(value);

export function withInventoryAvailable(inventory) {
  if (!inventory) return null;
  return {
    ...inventory,
    availableQuantity:
      inventory.physicalQuantity -
      inventory.reservedQuantity -
      inventory.damagedQuantity,
  };
}

export function serialize(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, entry) =>
      typeof entry === "bigint" ? Number(entry) : entry,
    ),
  );
}
