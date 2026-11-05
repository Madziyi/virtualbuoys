export const compass = (angle: number) => ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round((((angle % 360) + 360) % 360) / 22.5) % 16]
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
export function range(query: URLSearchParams, now = Date.now()) {
  const hours = query.get('hours'), start = query.get('start'), end = query.get('end')
  if ((hours !== null && (start !== null || end !== null)) || ((start === null) !== (end === null))) throw new ApiError(400, 'INVALID_RANGE', 'Use hours or both start and end.')
  let a: number, b: number
  if (start !== null && end !== null) {
    const utc = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/
    if (!utc.test(start) || !utc.test(end)) throw new ApiError(400, 'INVALID_RANGE', 'Start and end must be UTC ISO timestamps.')
    a = Date.parse(start); b = Date.parse(end)
  } else {
    const h = hours === null ? 24 : Number(hours)
    if (!hours?.trim() && hours !== null || !Number.isFinite(h) || h <= 0) throw new ApiError(400, 'INVALID_RANGE', 'Hours must be a positive number.')
    b = now; a = b - h * 3600000
  }
  if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) throw new ApiError(400, 'INVALID_RANGE', 'Start must be before or equal to end.')
  if (b - a > 7 * 86400000) throw new ApiError(400, 'INVALID_RANGE', 'The requested time range exceeds the 7-day maximum.')
  return { start: new Date(a).toISOString(), end: new Date(b).toISOString() }
}
