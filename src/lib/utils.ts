import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getEdgeFunctionError(error: any): Promise<string> {
  try {
    if (error?.context?.json) {
      const body = await error.context.json();
      return body?.error || error.message || "An unexpected error occurred";
    }
  } catch {}
  return error?.message || "An unexpected error occurred";
}
