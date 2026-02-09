import { describe, it, expect } from 'vitest';
import * as tf from '../../src/lib/math/transforms';
import * as mat from '../../src/lib/math/matrix';

describe('Transformation Math Library', () => {
  describe('2D Rotation Matrix', () => {
    it('should create identity for zero rotation', () => {
      const R = tf.rotationMatrix2D(0);
      expect(mat.equals(R, mat.identity(2))).toBe(true);
    });

    it('should rotate 90 degrees', () => {
      const R = tf.rotationMatrix2D(Math.PI / 2);
      expect(R[0][0]).toBeCloseTo(0);
      expect(R[0][1]).toBeCloseTo(-1);
      expect(R[1][0]).toBeCloseTo(1);
      expect(R[1][1]).toBeCloseTo(0);
    });

    it('should be a valid rotation matrix', () => {
      const R = tf.rotationMatrix2D(Math.PI / 3);
      expect(tf.isValidRotationMatrix(R)).toBe(true);
    });

    it('should satisfy full rotation property', () => {
      const R = tf.rotationMatrix2D(2 * Math.PI);
      expect(mat.equals(R, mat.identity(2), 1e-10)).toBe(true);
    });
  });

  describe('3D Rotation Matrices', () => {
    it('should create X-axis rotation', () => {
      const R = tf.rotationMatrixX(Math.PI / 2);
      expect(R[0][0]).toBeCloseTo(1);
      expect(R[1][1]).toBeCloseTo(0);
      expect(R[1][2]).toBeCloseTo(-1);
      expect(R[2][1]).toBeCloseTo(1);
      expect(R[2][2]).toBeCloseTo(0);
    });

    it('should create Y-axis rotation', () => {
      const R = tf.rotationMatrixY(Math.PI / 2);
      expect(R[0][0]).toBeCloseTo(0);
      expect(R[0][2]).toBeCloseTo(1);
      expect(R[1][1]).toBeCloseTo(1);
      expect(R[2][0]).toBeCloseTo(-1);
      expect(R[2][2]).toBeCloseTo(0);
    });

    it('should create Z-axis rotation', () => {
      const R = tf.rotationMatrixZ(Math.PI / 2);
      expect(R[0][0]).toBeCloseTo(0);
      expect(R[0][1]).toBeCloseTo(-1);
      expect(R[1][0]).toBeCloseTo(1);
      expect(R[1][1]).toBeCloseTo(0);
      expect(R[2][2]).toBeCloseTo(1);
    });

    it('should create valid rotation matrices', () => {
      expect(tf.isValidRotationMatrix(tf.rotationMatrixX(0.5))).toBe(true);
      expect(tf.isValidRotationMatrix(tf.rotationMatrixY(0.5))).toBe(true);
      expect(tf.isValidRotationMatrix(tf.rotationMatrixZ(0.5))).toBe(true);
    });
  });

  describe('Euler Angles', () => {
    it('should create rotation from Euler angles', () => {
      const R = tf.rotationMatrixFromEuler(0, 0, Math.PI / 2);
      // Should be same as Z rotation
      const Rz = tf.rotationMatrixZ(Math.PI / 2);
      expect(mat.equals(R, Rz, 1e-10)).toBe(true);
    });

    it('should extract Euler angles', () => {
      const roll = 0.1;
      const pitch = 0.2;
      const yaw = 0.3;
      const R = tf.rotationMatrixFromEuler(roll, pitch, yaw);
      const [r, p, y] = tf.eulerFromRotationMatrix(R);
      expect(r).toBeCloseTo(roll, 5);
      expect(p).toBeCloseTo(pitch, 5);
      expect(y).toBeCloseTo(yaw, 5);
    });

    it('should handle round-trip conversion', () => {
      const angles: [number, number, number] = [0.5, 0.3, 0.8];
      const R = tf.rotationMatrixFromEuler(...angles);
      const extracted = tf.eulerFromRotationMatrix(R);
      const R2 = tf.rotationMatrixFromEuler(...extracted);
      expect(mat.equals(R, R2, 1e-10)).toBe(true);
    });
  });

  describe('2D Homogeneous Transformations', () => {
    it('should create pure translation', () => {
      const T = tf.homogeneousTransform2D(0, 5, 3);
      const point = { x: 1, y: 2 };
      const result = tf.transformPoint2D(T, point);
      expect(result.x).toBeCloseTo(6);
      expect(result.y).toBeCloseTo(5);
    });

    it('should create pure rotation', () => {
      const T = tf.homogeneousTransform2D(Math.PI / 2, 0, 0);
      const point = { x: 1, y: 0 };
      const result = tf.transformPoint2D(T, point);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(1);
    });

    it('should combine rotation and translation', () => {
      const T = tf.homogeneousTransform2D(Math.PI / 2, 1, 2);
      const point = { x: 1, y: 0 };
      const result = tf.transformPoint2D(T, point);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(3);
    });

    it('should invert correctly', () => {
      const T = tf.homogeneousTransform2D(0.5, 3, 4);
      const T_inv = tf.inverseTransform2D(T);
      const product = mat.multiply(T, T_inv);
      expect(mat.equals(product, mat.identity(3), 1e-10)).toBe(true);
    });
  });

  describe('3D Homogeneous Transformations', () => {
    it('should create from rotation and translation', () => {
      const R = tf.rotationMatrixZ(Math.PI / 2);
      const t: [number, number, number] = [1, 2, 3];
      const T = tf.homogeneousTransform3D(R, t);

      expect(T[0][3]).toBe(1);
      expect(T[1][3]).toBe(2);
      expect(T[2][3]).toBe(3);
      expect(T[3][3]).toBe(1);
    });

    it('should extract rotation', () => {
      const R = tf.rotationMatrixX(0.5);
      const t: [number, number, number] = [1, 2, 3];
      const T = tf.homogeneousTransform3D(R, t);
      const R_extracted = tf.extractRotation(T);
      expect(mat.equals(R, R_extracted)).toBe(true);
    });

    it('should extract translation', () => {
      const R = mat.identity(3);
      const t: [number, number, number] = [5, 7, 9];
      const T = tf.homogeneousTransform3D(R, t);
      const t_extracted = tf.extractTranslation(T);
      expect(t_extracted).toEqual(t);
    });

    it('should transform 3D points', () => {
      const R = mat.identity(3);
      const t: [number, number, number] = [1, 2, 3];
      const T = tf.homogeneousTransform3D(R, t);
      const point = { x: 4, y: 5, z: 6 };
      const result = tf.transformPoint3D(T, point);
      expect(result).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('should invert correctly', () => {
      const R = tf.rotationMatrixZ(0.7);
      const t: [number, number, number] = [1, 2, 3];
      const T = tf.homogeneousTransform3D(R, t);
      const T_inv = tf.inverseTransform3D(T);
      const product = mat.multiply(T, T_inv);
      expect(mat.equals(product, mat.identity(4), 1e-10)).toBe(true);
    });
  });

  describe('Translation Matrices', () => {
    it('should create translation matrix', () => {
      const T = tf.translationMatrix(5, 3, 2);
      const point = { x: 1, y: 1, z: 1 };
      const result = tf.transformPoint3D(T, point);
      expect(result).toEqual({ x: 6, y: 4, z: 3 });
    });

    it('should be identity for zero translation', () => {
      const T = tf.translationMatrix(0, 0, 0);
      expect(mat.equals(T, mat.identity(4))).toBe(true);
    });
  });

  describe('Homogeneous Rotation Matrices', () => {
    it('should create 4x4 rotation matrices', () => {
      const Rx = tf.homogeneousRotationX(0.5);
      const Ry = tf.homogeneousRotationY(0.5);
      const Rz = tf.homogeneousRotationZ(0.5);

      expect(mat.dimensions(Rx)).toEqual([4, 4]);
      expect(mat.dimensions(Ry)).toEqual([4, 4]);
      expect(mat.dimensions(Rz)).toEqual([4, 4]);
    });

    it('should have zero translation', () => {
      const R = tf.homogeneousRotationZ(0.5);
      const t = tf.extractTranslation(R);
      expect(t).toEqual([0, 0, 0]);
    });
  });

  describe('DH Transformation', () => {
    it('should create DH transform', () => {
      // Standard DH parameters
      const a = 1;      // link length
      const alpha = 0;  // link twist
      const d = 0;      // link offset
      const theta = 0;  // joint angle

      const T = tf.dhTransform(a, alpha, d, theta);
      expect(mat.dimensions(T)).toEqual([4, 4]);
      expect(T[3][3]).toBe(1);
    });

    it('should match identity for zero parameters', () => {
      const T = tf.dhTransform(0, 0, 0, 0);
      expect(mat.equals(T, mat.identity(4))).toBe(true);
    });

    it('should create valid transformation', () => {
      const T = tf.dhTransform(1, Math.PI / 2, 0.5, Math.PI / 4);
      const point = { x: 0, y: 0, z: 0 };
      const result = tf.transformPoint3D(T, point);
      // Should transform origin to (a*cos(theta), a*sin(theta), d)
      expect(result.x).toBeCloseTo(1 * Math.cos(Math.PI / 4));
      expect(result.y).toBeCloseTo(1 * Math.sin(Math.PI / 4));
    });
  });

  describe('Scaling Matrices', () => {
    it('should create 2D scaling matrix', () => {
      const S = tf.scalingMatrix(2, 3);
      expect(mat.dimensions(S)).toEqual([3, 3]);
      expect(S[0][0]).toBe(2);
      expect(S[1][1]).toBe(3);
    });

    it('should create 3D scaling matrix', () => {
      const S = tf.scalingMatrix(2, 3, 4);
      expect(mat.dimensions(S)).toEqual([4, 4]);
      expect(S[0][0]).toBe(2);
      expect(S[1][1]).toBe(3);
      expect(S[2][2]).toBe(4);
    });

    it('should scale points', () => {
      const S = tf.scalingMatrix(2, 3, 4);
      const point = { x: 1, y: 2, z: 3 };
      const result = tf.transformPoint3D(S, point);
      expect(result).toEqual({ x: 2, y: 6, z: 12 });
    });
  });

  describe('Rotation Matrix Validation', () => {
    it('should validate rotation matrices', () => {
      const R = tf.rotationMatrixZ(0.5);
      expect(tf.isValidRotationMatrix(R)).toBe(true);
    });

    it('should reject non-rotation matrices', () => {
      const notRotation = [[1, 2], [3, 4]];
      expect(tf.isValidRotationMatrix(notRotation)).toBe(false);
    });

    it('should reject scaling matrices', () => {
      const scaled = [[2, 0], [0, 2]];
      expect(tf.isValidRotationMatrix(scaled)).toBe(false);
    });

    it('should reject reflection matrices', () => {
      // Reflection has det = -1, not +1
      const reflection = [[-1, 0], [0, 1]];
      expect(tf.isValidRotationMatrix(reflection)).toBe(false);
    });

    it('should validate 3D rotation matrices', () => {
      const R = tf.rotationMatrixFromEuler(0.1, 0.2, 0.3);
      expect(tf.isValidRotationMatrix(R)).toBe(true);
    });
  });

  describe('Robotics Applications', () => {
    it('should compute 2-link robot forward kinematics', () => {
      // Two links, each 1m long, both at 0 degrees
      const L1 = 1;
      const L2 = 1;
      const theta1 = 0;
      const theta2 = 0;

      const T1 = tf.homogeneousTransform2D(theta1, L1, 0);
      const T2 = tf.homogeneousTransform2D(theta2, L2, 0);
      const T_total = mat.multiply(T1, T2);

      const origin = { x: 0, y: 0 };
      const endEffector = tf.transformPoint2D(T_total, origin);

      expect(endEffector.x).toBeCloseTo(2);
      expect(endEffector.y).toBeCloseTo(0);
    });

    it('should compute 2-link robot at 90 degrees', () => {
      const L1 = 1;
      const L2 = 1;
      const theta1 = Math.PI / 2;
      const theta2 = 0;

      const T1 = tf.homogeneousTransform2D(theta1, L1, 0);
      const T2 = tf.homogeneousTransform2D(theta2, L2, 0);
      const T_total = mat.multiply(T1, T2);

      const origin = { x: 0, y: 0 };
      const endEffector = tf.transformPoint2D(T_total, origin);

      // T1 rotates 90° and translates (1,0), T2 translates (1,0)
      // Result: both transforms combined give position (1, 1)
      expect(endEffector.x).toBeCloseTo(1, 5);
      expect(endEffector.y).toBeCloseTo(1, 5);
    });

    it('should chain multiple transformations', () => {
      // Robot with 3 joints in 3D
      const T1 = tf.homogeneousRotationZ(Math.PI / 4);
      const T2 = tf.translationMatrix(1, 0, 0);
      const T3 = tf.homogeneousRotationY(Math.PI / 4);

      const T_total = mat.multiply(mat.multiply(T1, T2), T3);
      const point = { x: 0, y: 0, z: 0 };
      const result = tf.transformPoint3D(T_total, point);

      // Should have some non-zero position
      expect(result.x).not.toBe(0);
    });

    it('should compute inverse kinematics setup', () => {
      // Transform from base to end-effector
      const T_base_ee = tf.homogeneousTransform2D(Math.PI / 4, 1, 1);

      // Transform from ee back to base
      const T_ee_base = tf.inverseTransform2D(T_base_ee);

      const point = { x: 1, y: 1 };
      const forward = tf.transformPoint2D(T_base_ee, { x: 0, y: 0 });
      const backward = tf.transformPoint2D(T_ee_base, forward);

      expect(backward.x).toBeCloseTo(0);
      expect(backward.y).toBeCloseTo(0);
    });
  });

  describe('Transform Composition', () => {
    it('should compose 2D transforms correctly', () => {
      // Rotate then translate
      const R = tf.homogeneousTransform2D(Math.PI / 2, 0, 0);
      const T = tf.homogeneousTransform2D(0, 1, 0);
      const RT = mat.multiply(T, R);

      const point = { x: 1, y: 0 };
      const result = tf.transformPoint2D(RT, point);

      // First rotate (1,0) -> (0,1), then translate by (1,0)
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
    });

    it('should compose 3D transforms correctly', () => {
      const R = tf.homogeneousRotationZ(Math.PI / 2);
      const T = tf.translationMatrix(1, 0, 0);
      const RT = mat.multiply(T, R);

      const point = { x: 1, y: 0, z: 0 };
      const result = tf.transformPoint3D(RT, point);

      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
      expect(result.z).toBeCloseTo(0);
    });
  });
});
