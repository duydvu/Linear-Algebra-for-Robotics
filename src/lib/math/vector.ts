/**
 * Vector Math Library for Robotics
 * Provides 2D and 3D vector operations
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type Vector = Vector2 | Vector3;

/**
 * Check if a vector is 3D
 */
export function isVector3(v: Vector): v is Vector3 {
  return 'z' in v;
}

/**
 * Add two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Sum of vectors a + b
 */
export function add(a: Vector2, b: Vector2): Vector2;
export function add(a: Vector3, b: Vector3): Vector3;
export function add(a: Vector, b: Vector): Vector {
  if (isVector3(a) && isVector3(b)) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Difference a - b
 */
export function subtract(a: Vector2, b: Vector2): Vector2;
export function subtract(a: Vector3, b: Vector3): Vector3;
export function subtract(a: Vector, b: Vector): Vector {
  if (isVector3(a) && isVector3(b)) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Scale a vector by a scalar
 * @param v Vector to scale
 * @param s Scalar value
 * @returns Scaled vector s * v
 */
export function scale(v: Vector2, s: number): Vector2;
export function scale(v: Vector3, s: number): Vector3;
export function scale(v: Vector, s: number): Vector {
  if (isVector3(v)) {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  }
  return { x: v.x * s, y: v.y * s };
}

/**
 * Calculate the magnitude (length) of a vector
 * @param v Input vector
 * @returns ||v|| = sqrt(x² + y² + z²)
 */
export function magnitude(v: Vector): number {
  if (isVector3(v)) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector to unit length
 * @param v Input vector
 * @returns Unit vector in the same direction, or zero vector if input is zero
 */
export function normalize(v: Vector2): Vector2;
export function normalize(v: Vector3): Vector3;
export function normalize(v: Vector): Vector {
  const mag = magnitude(v);
  if (mag === 0) {
    return isVector3(v) ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 };
  }
  return scale(v, 1 / mag) as typeof v;
}

/**
 * Calculate the dot product of two vectors
 * @param a First vector
 * @param b Second vector
 * @returns a · b = a.x * b.x + a.y * b.y + a.z * b.z
 */
export function dot(a: Vector, b: Vector): number {
  if (isVector3(a) && isVector3(b)) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate the cross product of two 3D vectors
 * @param a First vector
 * @param b Second vector
 * @returns a × b (perpendicular to both a and b)
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

/**
 * Calculate the angle between two vectors in radians
 * @param a First vector
 * @param b Second vector
 * @returns Angle in radians [0, π]
 */
export function angleBetween(a: Vector, b: Vector): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) {
    return 0;
  }
  const cosTheta = dot(a, b) / (magA * magB);
  // Clamp to handle floating point errors
  return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
}

/**
 * Project vector a onto vector b
 * @param a Vector to project
 * @param b Vector to project onto
 * @returns Projection of a onto b
 */
export function project(a: Vector2, b: Vector2): Vector2;
export function project(a: Vector3, b: Vector3): Vector3;
export function project(a: Vector, b: Vector): Vector {
  const magB = magnitude(b);
  if (magB === 0) {
    return isVector3(a) ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0 };
  }
  const scalar = dot(a, b) / (magB * magB);
  return scale(b, scalar) as typeof a;
}

/**
 * Calculate distance between two points (vectors)
 * @param a First point
 * @param b Second point
 * @returns Distance ||a - b||
 */
export function distance(a: Vector, b: Vector): number {
  return magnitude(subtract(a as any, b as any));
}

/**
 * Linear interpolation between two vectors
 * @param a Start vector
 * @param b End vector
 * @param t Interpolation parameter [0, 1]
 * @returns Interpolated vector a + t * (b - a)
 */
export function lerp(a: Vector2, b: Vector2, t: number): Vector2;
export function lerp(a: Vector3, b: Vector3, t: number): Vector3;
export function lerp(a: Vector, b: Vector, t: number): Vector {
  const diff = subtract(b as any, a as any);
  return add(a as any, scale(diff, t));
}

/**
 * Create a zero vector
 */
export function zero2D(): Vector2 {
  return { x: 0, y: 0 };
}

export function zero3D(): Vector3 {
  return { x: 0, y: 0, z: 0 };
}

/**
 * Create a vector from an array
 */
export function fromArray2D(arr: [number, number]): Vector2 {
  return { x: arr[0], y: arr[1] };
}

export function fromArray3D(arr: [number, number, number]): Vector3 {
  return { x: arr[0], y: arr[1], z: arr[2] };
}

/**
 * Convert vector to array
 */
export function toArray(v: Vector2): [number, number];
export function toArray(v: Vector3): [number, number, number];
export function toArray(v: Vector): number[] {
  if (isVector3(v)) {
    return [v.x, v.y, v.z];
  }
  return [v.x, v.y];
}

/**
 * Check if two vectors are approximately equal
 * @param a First vector
 * @param b Second vector
 * @param epsilon Tolerance for comparison
 */
export function equals(a: Vector, b: Vector, epsilon: number = 1e-10): boolean {
  if (isVector3(a) && isVector3(b)) {
    return (
      Math.abs(a.x - b.x) < epsilon &&
      Math.abs(a.y - b.y) < epsilon &&
      Math.abs(a.z - b.z) < epsilon
    );
  }
  if (!isVector3(a) && !isVector3(b)) {
    return (
      Math.abs(a.x - b.x) < epsilon &&
      Math.abs(a.y - b.y) < epsilon
    );
  }
  return false;
}
