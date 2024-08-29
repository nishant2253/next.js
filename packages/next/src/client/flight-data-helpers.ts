import type {
  CacheNodeSeedData,
  FlightData,
  FlightDataPath,
  FlightDataSegment,
  FlightRouterState,
  FlightSegmentPath,
  Segment,
} from '../server/app-render/types'

export type NormalizedFlightResponse = {
  /**
   * The full `FlightSegmentPath` inclusive of the final `Segment`
   */
  segmentPath: FlightSegmentPath
  /**
   * The `FlightSegmentPath` exclusive of the final `Segment`
   */
  pathToSegment: FlightSegmentPath
  segment: Segment
  tree: FlightRouterState
  seedData: CacheNodeSeedData | null
  head: React.ReactNode | null
  isRootRender: boolean
}

// TODO: We should only have to export `normalizeFlightData`, however because the initial flight data
// that gets passed to `createInitialRouterState` doesn't conform to the `FlightDataPath` type (it's missing the root segment)
// we're currently exporting it so we can use it directly. This should be fixed as part of the unification of
// the different ways we express `FlightSegmentPath`.
export function getFlightDataPartsFromPath(
  flightDataPath: FlightDataPath
): NormalizedFlightResponse {
  // tree, seedData, and head are *always* the last three items in the `FlightDataPath`.
  const [tree, seedData, head] = flightDataPath.slice(-3)
  // The `FlightSegmentPath` is everything except the last three items. For a root render, it won't be present.
  const segmentPath = flightDataPath.slice(0, -3)

  return {
    // TODO: Unify these two segment path helpers. We are inconsistently pushing an empty segment ("")
    // to the start of the segment path in some places which makes it hard to use solely the segment path.
    // Look for "// TODO-APP: remove ''" in the codebase.
    pathToSegment: segmentPath.slice(0, -1),
    segmentPath,
    // if the `FlightDataPath` corresponds with the root, there'll be no segment path,
    // in which case we default to ''.
    segment: segmentPath[segmentPath.length - 1] ?? '',
    tree,
    seedData,
    head,
    isRootRender: flightDataPath.length === 3,
  }
}

export function getNextFlightSegmentPath(
  flightSegmentPath: FlightSegmentPath
): FlightSegmentPath {
  // Since `FlightSegmentPath` is a repeated tuple of `Segment` and `ParallelRouteKey`, we slice off two items
  // to get the next segment path.
  return flightSegmentPath.slice(2)
}

function isFlightDataPathArray(data: any): data is FlightDataPath[] {
  return (
    Array.isArray(data) &&
    data.every((item) => Array.isArray(item) && item.length > 0)
  )
}

export function normalizeFlightData(
  flightData: FlightData
): NormalizedFlightResponse[] | string
export function normalizeFlightData(
  flightData: FlightDataSegment
): NormalizedFlightResponse
export function normalizeFlightData(
  flightData: FlightData | FlightDataSegment
): NormalizedFlightResponse[] | NormalizedFlightResponse | string {
  if (typeof flightData === 'string') {
    return flightData
  }

  // If FlightData is an array, it means we have multiple paths to normalize.
  // Otherwise we only need to normalize a single path.
  return isFlightDataPathArray(flightData)
    ? flightData.map(getFlightDataPartsFromPath)
    : getFlightDataPartsFromPath(flightData)
}
