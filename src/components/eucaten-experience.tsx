"use client";

import { EucatenHome } from "./eucaten-home";

/**
 * Compatibility wrapper for legacy imports.
 *
 * Older EUCATEN iterations referenced a component named EucatenExperience
 * and expected a previous content schema. The current implementation lives
 * in EucatenHome, so this file intentionally delegates to that component
 * instead of keeping two divergent versions of the site.
 */
export function EucatenExperience() {
  return <EucatenHome />;
}

export default EucatenExperience;
