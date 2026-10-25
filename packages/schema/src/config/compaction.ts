export * as ConfigCompaction from "./compaction.js"

import { Schema } from "effect"
import { NonNegativeInt, optional } from "../schema.js"

export class Keep extends Schema.Class<Keep>("Config.Compaction.Keep")({
  tokens: NonNegativeInt.pipe(optional),
}) {}

export class Info extends Schema.Class<Info>("Config.Compaction")({
  auto: Schema.Boolean.pipe(optional),
  keep: Keep.pipe(optional),
  buffer: NonNegativeInt.pipe(optional),
  /** Share of the compaction ceiling at which a background summary starts. Defaults to 0.85. */
  precompute_ratio: Schema.Finite.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(1)).pipe(optional),
  /** Measured prompt tokens below which a background summary is not worth its cost. Defaults to 64000. */
  precompute_min_tokens: NonNegativeInt.pipe(optional),
}) {}
