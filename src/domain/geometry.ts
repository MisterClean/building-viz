export type Rect = {
  x0: number
  x1: number
  z0: number
  z1: number
}

export function rectWidth(r: Rect): number {
  return r.x1 - r.x0
}

export function rectDepth(r: Rect): number {
  return r.z1 - r.z0
}

export function rectArea(r: Rect): number {
  return rectWidth(r) * rectDepth(r)
}

export function rectCenter(r: Rect): { x: number; z: number } {
  return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 }
}

