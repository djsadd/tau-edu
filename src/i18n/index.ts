import { en } from "./en";
import { kk } from "./kk";
import { ru, type Dictionary } from "./ru";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { kk, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
