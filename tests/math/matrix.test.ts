import { describe, it, expect } from 'vitest';
import * as mat from '../../src/lib/math/matrix';

describe('Matrix Math Library', () => {
  describe('Matrix Creation', () => {
    it('should create zero matrices', () => {
      const m = mat.zeros(2, 3);
      expect(m).toEqual([[0, 0, 0], [0, 0, 0]]);
    });

    it('should create identity matrices', () => {
      expect(mat.identity(2)).toEqual([[1, 0], [0, 1]]);
      expect(mat.identity(3)).toEqual([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
    });

    it('should create from array', () => {
      const data = [[1, 2], [3, 4]];
      const m = mat.create(data);
      expect(m).toEqual(data);
      // Should be a copy
      data[0][0] = 999;
      expect(m[0][0]).toBe(1);
    });

    it('should get dimensions', () => {
      expect(mat.dimensions([[1, 2, 3]])).toEqual([1, 3]);
      expect(mat.dimensions([[1], [2], [3]])).toEqual([3, 1]);
      expect(mat.dimensions([[1, 2], [3, 4]])).toEqual([2, 2]);
    });
  });

  describe('Matrix Multiplication', () => {
    it('should multiply 2x2 matrices', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      const result = mat.multiply(a, b);
      expect(result).toEqual([
        [19, 22],  // 1*5+2*7, 1*6+2*8
        [43, 50]   // 3*5+4*7, 3*6+4*8
      ]);
    });

    it('should multiply 3x3 matrices', () => {
      const a = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      const b = mat.identity(3);
      const result = mat.multiply(a, b);
      expect(result).toEqual(a);
    });

    it('should multiply matrices of different dimensions', () => {
      const a = [[1, 2, 3]];  // 1x3
      const b = [[4], [5], [6]];  // 3x1
      const result = mat.multiply(a, b);
      expect(result).toEqual([[32]]);  // 1*4 + 2*5 + 3*6
    });

    it('should throw error for incompatible dimensions', () => {
      const a = [[1, 2]];  // 1x2
      const b = [[3], [4], [5]];  // 3x1
      expect(() => mat.multiply(a, b)).toThrow();
    });

    it('should respect identity property', () => {
      const a = [[1, 2], [3, 4]];
      const I = mat.identity(2);
      expect(mat.multiply(a, I)).toEqual(a);
      expect(mat.multiply(I, a)).toEqual(a);
    });
  });

  describe('Matrix Transpose', () => {
    it('should transpose square matrices', () => {
      const m = [[1, 2], [3, 4]];
      expect(mat.transpose(m)).toEqual([[1, 3], [2, 4]]);
    });

    it('should transpose rectangular matrices', () => {
      const m = [[1, 2, 3], [4, 5, 6]];
      expect(mat.transpose(m)).toEqual([
        [1, 4],
        [2, 5],
        [3, 6]
      ]);
    });

    it('should satisfy double transpose property', () => {
      const m = [[1, 2], [3, 4]];
      const result = mat.transpose(mat.transpose(m));
      expect(result).toEqual(m);
    });
  });

  describe('Matrix Addition', () => {
    it('should add matrices', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      expect(mat.add(a, b)).toEqual([[6, 8], [10, 12]]);
    });

    it('should be commutative', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[5, 6], [7, 8]];
      expect(mat.add(a, b)).toEqual(mat.add(b, a));
    });

    it('should throw error for incompatible dimensions', () => {
      const a = [[1, 2]];
      const b = [[3], [4]];
      expect(() => mat.add(a, b)).toThrow();
    });
  });

  describe('Scalar Multiplication', () => {
    it('should scale matrices', () => {
      const m = [[1, 2], [3, 4]];
      expect(mat.scale(m, 2)).toEqual([[2, 4], [6, 8]]);
    });

    it('should handle negative scaling', () => {
      const m = [[1, 2], [3, 4]];
      expect(mat.scale(m, -1)).toEqual([[-1, -2], [-3, -4]]);
    });

    it('should create zero matrix with zero scaling', () => {
      const m = [[1, 2], [3, 4]];
      expect(mat.scale(m, 0)).toEqual([[0, 0], [0, 0]]);
    });
  });

  describe('Determinant', () => {
    it('should calculate 2x2 determinant', () => {
      const m = [[1, 2], [3, 4]];
      expect(mat.determinant(m)).toBe(-2);  // 1*4 - 2*3
    });

    it('should calculate 3x3 determinant', () => {
      const m = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0]
      ];
      expect(mat.determinant(m)).toBe(1);
    });

    it('should return zero for singular matrices', () => {
      const m = [[1, 2], [2, 4]];  // Row 2 is 2 * Row 1
      expect(mat.determinant(m)).toBe(0);
    });

    it('should return value for 1x1 matrix', () => {
      expect(mat.determinant([[5]])).toBe(5);
    });

    it('should throw error for non-square matrices', () => {
      const m = [[1, 2, 3], [4, 5, 6]];
      expect(() => mat.determinant(m)).toThrow();
    });

    it('should respect identity determinant', () => {
      expect(mat.determinant(mat.identity(2))).toBe(1);
      expect(mat.determinant(mat.identity(3))).toBe(1);
    });
  });

  describe('Matrix Inverse', () => {
    it('should invert 2x2 matrices', () => {
      const m = [[1, 2], [3, 4]];
      const inv = mat.inverse(m);
      const product = mat.multiply(m, inv);
      expect(mat.equals(product, mat.identity(2), 1e-10)).toBe(true);
    });

    it('should invert 3x3 matrices', () => {
      const m = [
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0]
      ];
      const inv = mat.inverse(m);
      const product = mat.multiply(m, inv);
      expect(mat.equals(product, mat.identity(3), 1e-10)).toBe(true);
    });

    it('should satisfy A * A^-1 = I', () => {
      const m = [[2, 3], [1, 4]];
      const inv = mat.inverse(m);
      const I = mat.identity(2);
      expect(mat.equals(mat.multiply(m, inv), I, 1e-10)).toBe(true);
      expect(mat.equals(mat.multiply(inv, m), I, 1e-10)).toBe(true);
    });

    it('should throw error for singular matrices', () => {
      const m = [[1, 2], [2, 4]];  // Singular (determinant = 0)
      expect(() => mat.inverse(m)).toThrow(/singular/i);
    });

    it('should throw error for non-square matrices', () => {
      const m = [[1, 2, 3], [4, 5, 6]];
      expect(() => mat.inverse(m)).toThrow();
    });

    it('should invert identity to identity', () => {
      const I = mat.identity(3);
      const inv = mat.inverse(I);
      expect(mat.equals(inv, I)).toBe(true);
    });
  });

  describe('Matrix-Vector Multiplication', () => {
    it('should apply matrix to vector', () => {
      const m = [[1, 2], [3, 4]];
      const v = [5, 6];
      const result = mat.applyToVector(m, v);
      expect(result).toEqual([17, 39]);  // [1*5+2*6, 3*5+4*6]
    });

    it('should transform 3D vectors', () => {
      const m = mat.identity(3);
      const v = [1, 2, 3];
      expect(mat.applyToVector(m, v)).toEqual(v);
    });

    it('should throw error for incompatible dimensions', () => {
      const m = [[1, 2], [3, 4]];
      const v = [1, 2, 3];
      expect(() => mat.applyToVector(m, v)).toThrow();
    });
  });

  describe('Matrix Equality', () => {
    it('should compare matrices', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[1, 2], [3, 4]];
      expect(mat.equals(a, b)).toBe(true);
    });

    it('should handle floating point precision', () => {
      const a = [[1.0, 2.0]];
      const b = [[1.0000000001, 2.0000000001]];
      expect(mat.equals(a, b, 1e-8)).toBe(true);
      expect(mat.equals(a, b, 1e-12)).toBe(false);
    });

    it('should return false for different dimensions', () => {
      const a = [[1, 2]];
      const b = [[1], [2]];
      expect(mat.equals(a, b)).toBe(false);
    });

    it('should return false for different values', () => {
      const a = [[1, 2], [3, 4]];
      const b = [[1, 2], [3, 5]];
      expect(mat.equals(a, b)).toBe(false);
    });
  });

  describe('Matrix Utilities', () => {
    it('should convert to string', () => {
      const m = [[1.5, 2.7], [3.1, 4.9]];
      const str = mat.toString(m, 1);
      expect(str).toContain('1.5');
      expect(str).toContain('2.7');
    });

    it('should copy matrices', () => {
      const m = [[1, 2], [3, 4]];
      const copy = mat.copy(m);
      expect(copy).toEqual(m);
      m[0][0] = 999;
      expect(copy[0][0]).toBe(1);
    });
  });

  describe('Robotics Applications', () => {
    it('should represent robot configuration', () => {
      // 2D rotation by 90 degrees
      const theta = Math.PI / 2;
      const R = [
        [Math.cos(theta), -Math.sin(theta)],
        [Math.sin(theta), Math.cos(theta)]
      ];
      const point = [1, 0];
      const rotated = mat.applyToVector(R, point);
      expect(rotated[0]).toBeCloseTo(0);
      expect(rotated[1]).toBeCloseTo(1);
    });

    it('should compose transformations', () => {
      // Rotate 45° then rotate another 45° = 90° total
      const theta = Math.PI / 4;
      const R1 = [
        [Math.cos(theta), -Math.sin(theta)],
        [Math.sin(theta), Math.cos(theta)]
      ];
      const R2 = R1;
      const R_total = mat.multiply(R2, R1);

      const point = [1, 0];
      const result = mat.applyToVector(R_total, point);
      expect(result[0]).toBeCloseTo(0, 5);
      expect(result[1]).toBeCloseTo(1, 5);
    });

    it('should detect singular configurations', () => {
      // Jacobian matrix for 2-link planar robot at singularity
      const J = [
        [1, 0],
        [0, 0]
      ];
      expect(mat.determinant(J)).toBe(0);  // Singular!
    });
  });

  describe('Large Matrix Operations', () => {
    it('should handle 4x4 matrices', () => {
      const m = [
        [1, 0, 0, 5],
        [0, 1, 0, 3],
        [0, 0, 1, 2],
        [0, 0, 0, 1]
      ];
      expect(mat.determinant(m)).toBe(1);

      const inv = mat.inverse(m);
      const product = mat.multiply(m, inv);
      expect(mat.equals(product, mat.identity(4), 1e-10)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle 1x1 matrices', () => {
      const m = [[5]];
      expect(mat.determinant(m)).toBe(5);
      expect(mat.inverse(m)).toEqual([[0.2]]);
    });

    it('should handle very small numbers', () => {
      const m = [[1e-10, 0], [0, 1e-10]];
      const det = mat.determinant(m);
      expect(det).toBeCloseTo(1e-20);
    });
  });
});
