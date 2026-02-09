/**
 * Transformation Math Library for Robotics
 * Provides 2D/3D rotation, translation, and homogeneous transformation matrices
 */

import type { Matrix } from './matrix';
import { identity, multiply } from './matrix';
import type { Vector2, Vector3 } from './vector';

/**
 * Create a 2D rotation matrix
 * @param theta Rotation angle in radians (counter-clockwise)
 * @returns 2×2 rotation matrix
 */
export function rotationMatrix2D(theta: number): Matrix {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    [cos, -sin],
    [sin, cos]
  ];
}

/**
 * Create a 3D rotation matrix around the X axis
 * @param theta Rotation angle in radians
 * @returns 3×3 rotation matrix R_x(θ)
 */
export function rotationMatrixX(theta: number): Matrix {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    [1, 0, 0],
    [0, cos, -sin],
    [0, sin, cos]
  ];
}

/**
 * Create a 3D rotation matrix around the Y axis
 * @param theta Rotation angle in radians
 * @returns 3×3 rotation matrix R_y(θ)
 */
export function rotationMatrixY(theta: number): Matrix {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    [cos, 0, sin],
    [0, 1, 0],
    [-sin, 0, cos]
  ];
}

/**
 * Create a 3D rotation matrix around the Z axis
 * @param theta Rotation angle in radians
 * @returns 3×3 rotation matrix R_z(θ)
 */
export function rotationMatrixZ(theta: number): Matrix {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    [cos, -sin, 0],
    [sin, cos, 0],
    [0, 0, 1]
  ];
}

/**
 * Create a 3D rotation matrix from Euler angles (ZYX convention)
 * @param roll Rotation around X axis (radians)
 * @param pitch Rotation around Y axis (radians)
 * @param yaw Rotation around Z axis (radians)
 * @returns 3×3 rotation matrix R = R_z(yaw) * R_y(pitch) * R_x(roll)
 */
export function rotationMatrixFromEuler(roll: number, pitch: number, yaw: number): Matrix {
  const Rx = rotationMatrixX(roll);
  const Ry = rotationMatrixY(pitch);
  const Rz = rotationMatrixZ(yaw);
  return multiply(multiply(Rz, Ry), Rx);
}

/**
 * Extract Euler angles from a 3D rotation matrix (ZYX convention)
 * @param R 3×3 rotation matrix
 * @returns [roll, pitch, yaw] in radians
 */
export function eulerFromRotationMatrix(R: Matrix): [number, number, number] {
  // Check for gimbal lock
  const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0]);

  const singular = sy < 1e-6;

  let roll: number, pitch: number, yaw: number;

  if (!singular) {
    roll = Math.atan2(R[2][1], R[2][2]);
    pitch = Math.atan2(-R[2][0], sy);
    yaw = Math.atan2(R[1][0], R[0][0]);
  } else {
    roll = Math.atan2(-R[1][2], R[1][1]);
    pitch = Math.atan2(-R[2][0], sy);
    yaw = 0;
  }

  return [roll, pitch, yaw];
}

/**
 * Create a 2D homogeneous transformation matrix (3×3)
 * Combines rotation and translation
 * @param theta Rotation angle in radians
 * @param tx Translation in x
 * @param ty Translation in y
 * @returns 3×3 homogeneous transformation matrix
 */
export function homogeneousTransform2D(theta: number, tx: number, ty: number): Matrix {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    [cos, -sin, tx],
    [sin, cos, ty],
    [0, 0, 1]
  ];
}

/**
 * Create a 3D homogeneous transformation matrix (4×4)
 * Combines rotation and translation
 * @param R 3×3 rotation matrix
 * @param t Translation vector [x, y, z]
 * @returns 4×4 homogeneous transformation matrix [R | t; 0 | 1]
 */
export function homogeneousTransform3D(R: Matrix, t: [number, number, number]): Matrix {
  return [
    [...R[0], t[0]],
    [...R[1], t[1]],
    [...R[2], t[2]],
    [0, 0, 0, 1]
  ];
}

/**
 * Create a 4×4 translation matrix
 * @param tx Translation in x
 * @param ty Translation in y
 * @param tz Translation in z
 * @returns 4×4 translation matrix
 */
export function translationMatrix(tx: number, ty: number, tz: number): Matrix {
  return [
    [1, 0, 0, tx],
    [0, 1, 0, ty],
    [0, 0, 1, tz],
    [0, 0, 0, 1]
  ];
}

/**
 * Create a 4×4 homogeneous rotation matrix around X axis
 * @param theta Rotation angle in radians
 * @returns 4×4 homogeneous rotation matrix
 */
export function homogeneousRotationX(theta: number): Matrix {
  const R = rotationMatrixX(theta);
  return homogeneousTransform3D(R, [0, 0, 0]);
}

/**
 * Create a 4×4 homogeneous rotation matrix around Y axis
 * @param theta Rotation angle in radians
 * @returns 4×4 homogeneous rotation matrix
 */
export function homogeneousRotationY(theta: number): Matrix {
  const R = rotationMatrixY(theta);
  return homogeneousTransform3D(R, [0, 0, 0]);
}

/**
 * Create a 4×4 homogeneous rotation matrix around Z axis
 * @param theta Rotation angle in radians
 * @returns 4×4 homogeneous rotation matrix
 */
export function homogeneousRotationZ(theta: number): Matrix {
  const R = rotationMatrixZ(theta);
  return homogeneousTransform3D(R, [0, 0, 0]);
}

/**
 * Extract rotation matrix from 4×4 homogeneous transformation
 * @param T 4×4 homogeneous transformation matrix
 * @returns 3×3 rotation matrix
 */
export function extractRotation(T: Matrix): Matrix {
  return [
    [T[0][0], T[0][1], T[0][2]],
    [T[1][0], T[1][1], T[1][2]],
    [T[2][0], T[2][1], T[2][2]]
  ];
}

/**
 * Extract translation vector from 4×4 homogeneous transformation
 * @param T 4×4 homogeneous transformation matrix
 * @returns Translation vector [x, y, z]
 */
export function extractTranslation(T: Matrix): [number, number, number] {
  return [T[0][3], T[1][3], T[2][3]];
}

/**
 * Transform a 2D point using a 3×3 homogeneous transformation matrix
 * @param T 3×3 transformation matrix
 * @param point 2D point {x, y}
 * @returns Transformed point
 */
export function transformPoint2D(T: Matrix, point: Vector2): Vector2 {
  const x = T[0][0] * point.x + T[0][1] * point.y + T[0][2];
  const y = T[1][0] * point.x + T[1][1] * point.y + T[1][2];
  return { x, y };
}

/**
 * Transform a 3D point using a 4×4 homogeneous transformation matrix
 * @param T 4×4 transformation matrix
 * @param point 3D point {x, y, z}
 * @returns Transformed point
 */
export function transformPoint3D(T: Matrix, point: Vector3): Vector3 {
  const x = T[0][0] * point.x + T[0][1] * point.y + T[0][2] * point.z + T[0][3];
  const y = T[1][0] * point.x + T[1][1] * point.y + T[1][2] * point.z + T[1][3];
  const z = T[2][0] * point.x + T[2][1] * point.y + T[2][2] * point.z + T[2][3];
  return { x, y, z };
}

/**
 * Create inverse of a 2D homogeneous transformation
 * For SE(2): T^(-1) = [R^T | -R^T * t; 0 | 1]
 * @param T 3×3 homogeneous transformation matrix
 * @returns Inverse transformation
 */
export function inverseTransform2D(T: Matrix): Matrix {
  const cos = T[0][0];
  const sin = T[1][0];
  const tx = T[0][2];
  const ty = T[1][2];

  return [
    [cos, sin, -(cos * tx + sin * ty)],
    [-sin, cos, -(-sin * tx + cos * ty)],
    [0, 0, 1]
  ];
}

/**
 * Create inverse of a 3D homogeneous transformation
 * For SE(3): T^(-1) = [R^T | -R^T * t; 0 | 1]
 * @param T 4×4 homogeneous transformation matrix
 * @returns Inverse transformation
 */
export function inverseTransform3D(T: Matrix): Matrix {
  const R = extractRotation(T);
  const t = extractTranslation(T);

  // R^T (rotation transpose)
  const RT = [
    [R[0][0], R[1][0], R[2][0]],
    [R[0][1], R[1][1], R[2][1]],
    [R[0][2], R[1][2], R[2][2]]
  ];

  // -R^T * t
  const newT: [number, number, number] = [
    -(RT[0][0] * t[0] + RT[0][1] * t[1] + RT[0][2] * t[2]),
    -(RT[1][0] * t[0] + RT[1][1] * t[1] + RT[1][2] * t[2]),
    -(RT[2][0] * t[0] + RT[2][1] * t[1] + RT[2][2] * t[2])
  ];

  return homogeneousTransform3D(RT, newT);
}

/**
 * Create a DH (Denavit-Hartenberg) transformation matrix
 * Standard DH convention
 * @param a Link length
 * @param alpha Link twist (radians)
 * @param d Link offset
 * @param theta Joint angle (radians)
 * @returns 4×4 DH transformation matrix
 */
export function dhTransform(a: number, alpha: number, d: number, theta: number): Matrix {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);

  return [
    [ct, -st * ca, st * sa, a * ct],
    [st, ct * ca, -ct * sa, a * st],
    [0, sa, ca, d],
    [0, 0, 0, 1]
  ];
}

/**
 * Create a scaling matrix
 * @param sx Scale factor in x
 * @param sy Scale factor in y
 * @param sz Scale factor in z (optional, for 3D)
 * @returns Scaling matrix
 */
export function scalingMatrix(sx: number, sy: number, sz?: number): Matrix {
  if (sz !== undefined) {
    return [
      [sx, 0, 0, 0],
      [0, sy, 0, 0],
      [0, 0, sz, 0],
      [0, 0, 0, 1]
    ];
  }
  return [
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1]
  ];
}

/**
 * Check if a matrix is a valid rotation matrix
 * A valid rotation matrix R satisfies: R^T * R = I and det(R) = 1
 * @param R Rotation matrix
 * @param epsilon Tolerance for comparison
 * @returns True if valid rotation matrix
 */
export function isValidRotationMatrix(R: Matrix, epsilon: number = 1e-6): boolean {
  const size = R.length;

  // Check if square
  if (size !== R[0].length || (size !== 3 && size !== 2)) {
    return false;
  }

  // Check R^T * R = I
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let sum = 0;
      for (let k = 0; k < size; k++) {
        sum += R[k][i] * R[k][j];
      }
      const expected = i === j ? 1 : 0;
      if (Math.abs(sum - expected) > epsilon) {
        return false;
      }
    }
  }

  // Check det(R) = 1 (proper rotation, not reflection)
  let det: number;
  if (size === 2) {
    det = R[0][0] * R[1][1] - R[0][1] * R[1][0];
  } else {
    det = R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) -
          R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) +
          R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
  }

  return Math.abs(det - 1) < epsilon;
}
