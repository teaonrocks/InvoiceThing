import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddressParts {
  streetName?: string | null;
  buildingName?: string | null;
  unitNumber?: string | null;
  postalCode?: string | null;
}

export function formatAddressParts({
  streetName,
  buildingName,
  unitNumber,
  postalCode,
}: AddressParts) {
  const lines: string[] = [];

  const trimmedStreet = streetName?.trim();
  const trimmedBuilding = buildingName?.trim();
  const trimmedUnit = unitNumber?.trim();
  const trimmedPostal = postalCode?.trim();

  if (trimmedStreet) {
    lines.push(trimmedStreet);
  }

  const buildingUnit = [
    trimmedBuilding || undefined,
    trimmedUnit ? `Unit ${trimmedUnit}` : undefined,
  ].filter((segment): segment is string => Boolean(segment));

  if (buildingUnit.length) {
    lines.push(buildingUnit.join(", "));
  }

  if (trimmedPostal) {
    lines.push(`Postal Code ${trimmedPostal}`);
  }

  return lines.length ? lines.join("\n") : undefined;
}
