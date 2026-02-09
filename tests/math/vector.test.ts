import { describe, it, expect } from 'vitest';
import * as vec from '../../src/lib/math/vector';

describe('Vector Math Library', () => {
  describe('Vector Creation', () => {
    it('should create zero vectors', () => {
      expect(vec.zero2D()).toEqual({ x: 0, y: 0 });
      expect(vec.zero3D()).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should create vectors from arrays', () => {
      expect(vec.fromArray2D([3, 4])).toEqual({ x: 3, y: 4 });
      expect(vec.fromArray3D([1, 2, 3])).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should convert vectors to arrays', () => {
      expect(vec.toArray({ x: 3, y: 4 })).toEqual([3, 4]);
      expect(vec.toArray({ x: 1, y: 2, z: 3 })).toEqual([1, 2, 3]);
    });
  });

  describe('Vector Addition', () => {
    it('should add 2D vectors', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      expect(vec.add(a, b)).toEqual({ x: 4, y: 6 });
    });

    it('should add 3D vectors', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      expect(vec.add(a, b)).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('should handle zero vectors', () => {
      const v = { x: 5, y: 7 };
      expect(vec.add(v, vec.zero2D())).toEqual(v);
    });
  });

  describe('Vector Subtraction', () => {
    it('should subtract 2D vectors', () => {
      const a = { x: 5, y: 8 };
      const b = { x: 2, y: 3 };
      expect(vec.subtract(a, b)).toEqual({ x: 3, y: 5 });
    });

    it('should subtract 3D vectors', () => {
      const a = { x: 10, y: 8, z: 6 };
      const b = { x: 2, y: 3, z: 1 };
      expect(vec.subtract(a, b)).toEqual({ x: 8, y: 5, z: 5 });
    });

    it('should return zero when subtracting from itself', () => {
      const v = { x: 5, y: 7 };
      const result = vec.subtract(v, v);
      expect(vec.equals(result, vec.zero2D())).toBe(true);
    });
  });

  describe('Scalar Multiplication', () => {
    it('should scale 2D vectors', () => {
      const v = { x: 3, y: 4 };
      expect(vec.scale(v, 2)).toEqual({ x: 6, y: 8 });
      expect(vec.scale(v, 0.5)).toEqual({ x: 1.5, y: 2 });
    });

    it('should scale 3D vectors', () => {
      const v = { x: 1, y: 2, z: 3 };
      expect(vec.scale(v, 3)).toEqual({ x: 3, y: 6, z: 9 });
    });

    it('should handle negative scaling', () => {
      const v = { x: 2, y: 3 };
      expect(vec.scale(v, -1)).toEqual({ x: -2, y: -3 });
    });

    it('should return zero for zero scaling', () => {
      const v = { x: 5, y: 7 };
      expect(vec.scale(v, 0)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Magnitude', () => {
    it('should calculate 2D magnitude', () => {
      expect(vec.magnitude({ x: 3, y: 4 })).toBe(5);
      expect(vec.magnitude({ x: 0, y: 5 })).toBe(5);
    });

    it('should calculate 3D magnitude', () => {
      expect(vec.magnitude({ x: 1, y: 2, z: 2 })).toBe(3);
      expect(vec.magnitude({ x: 2, y: 3, z: 6 })).toBe(7);
    });

    it('should return zero for zero vectors', () => {
      expect(vec.magnitude(vec.zero2D())).toBe(0);
      expect(vec.magnitude(vec.zero3D())).toBe(0);
    });
  });

  describe('Normalization', () => {
    it('should normalize 2D vectors to unit length', () => {
      const v = { x: 3, y: 4 };
      const normalized = vec.normalize(v);
      expect(vec.magnitude(normalized)).toBeCloseTo(1, 10);
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
    });

    it('should normalize 3D vectors to unit length', () => {
      const v = { x: 1, y: 2, z: 2 };
      const normalized = vec.normalize(v);
      expect(vec.magnitude(normalized)).toBeCloseTo(1, 10);
    });

    it('should return zero for zero vector', () => {
      expect(vec.normalize(vec.zero2D())).toEqual(vec.zero2D());
      expect(vec.normalize(vec.zero3D())).toEqual(vec.zero3D());
    });

    it('should preserve direction', () => {
      const v = { x: 5, y: 12 };
      const normalized = vec.normalize(v);
      // Normalized should be parallel (same direction)
      const scaled = vec.scale(normalized, vec.magnitude(v));
      expect(vec.equals(scaled, v, 1e-10)).toBe(true);
    });
  });

  describe('Dot Product', () => {
    it('should calculate 2D dot product', () => {
      const a = { x: 2, y: 3 };
      const b = { x: 4, y: 5 };
      expect(vec.dot(a, b)).toBe(23); // 2*4 + 3*5
    });

    it('should calculate 3D dot product', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      expect(vec.dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it('should be zero for perpendicular vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 0, y: 1 };
      expect(vec.dot(a, b)).toBe(0);
    });

    it('should be commutative', () => {
      const a = { x: 2, y: 3 };
      const b = { x: 4, y: 5 };
      expect(vec.dot(a, b)).toBe(vec.dot(b, a));
    });
  });

  describe('Cross Product', () => {
    it('should calculate cross product', () => {
      const a = { x: 1, y: 0, z: 0 };
      const b = { x: 0, y: 1, z: 0 };
      const result = vec.cross(a, b);
      expect(result).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('should follow right-hand rule', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      const result = vec.cross(a, b);
      expect(result.x).toBe(-3);
      expect(result.y).toBe(6);
      expect(result.z).toBe(-3);
    });

    it('should be zero for parallel vectors', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = vec.scale(a, 2);
      const result = vec.cross(a, b);
      expect(vec.equals(result, vec.zero3D())).toBe(true);
    });

    it('should be anti-commutative', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      const ab = vec.cross(a, b);
      const ba = vec.cross(b, a);
      expect(vec.equals(ab, vec.scale(ba, -1), 1e-10)).toBe(true);
    });

    it('should be perpendicular to both input vectors', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 4, y: 5, z: 6 };
      const c = vec.cross(a, b);
      expect(vec.dot(a, c)).toBeCloseTo(0);
      expect(vec.dot(b, c)).toBeCloseTo(0);
    });
  });

  describe('Angle Between Vectors', () => {
    it('should calculate angle between parallel vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 2, y: 0 };
      expect(vec.angleBetween(a, b)).toBeCloseTo(0);
    });

    it('should calculate angle between perpendicular vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 0, y: 1 };
      expect(vec.angleBetween(a, b)).toBeCloseTo(Math.PI / 2);
    });

    it('should calculate angle between opposite vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: -1, y: 0 };
      expect(vec.angleBetween(a, b)).toBeCloseTo(Math.PI);
    });

    it('should work with 3D vectors', () => {
      const a = { x: 1, y: 0, z: 0 };
      const b = { x: 0, y: 1, z: 0 };
      expect(vec.angleBetween(a, b)).toBeCloseTo(Math.PI / 2);
    });

    it('should return zero for zero vectors', () => {
      const a = { x: 1, y: 2 };
      expect(vec.angleBetween(a, vec.zero2D())).toBe(0);
    });
  });

  describe('Projection', () => {
    it('should project 2D vectors', () => {
      const a = { x: 3, y: 4 };
      const b = { x: 1, y: 0 };
      const proj = vec.project(a, b);
      expect(proj).toEqual({ x: 3, y: 0 });
    });

    it('should project 3D vectors', () => {
      const a = { x: 1, y: 2, z: 3 };
      const b = { x: 1, y: 0, z: 0 };
      const proj = vec.project(a, b);
      expect(proj).toEqual({ x: 1, y: 0, z: 0 });
    });

    it('should return zero when projecting onto zero vector', () => {
      const a = { x: 1, y: 2 };
      const proj = vec.project(a, vec.zero2D());
      expect(proj).toEqual(vec.zero2D());
    });
  });

  describe('Distance', () => {
    it('should calculate distance between 2D points', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(vec.distance(a, b)).toBe(5);
    });

    it('should calculate distance between 3D points', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 1, y: 2, z: 2 };
      expect(vec.distance(a, b)).toBe(3);
    });

    it('should be zero for same point', () => {
      const v = { x: 5, y: 7 };
      expect(vec.distance(v, v)).toBe(0);
    });

    it('should be symmetric', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(vec.distance(a, b)).toBe(vec.distance(b, a));
    });
  });

  describe('Linear Interpolation', () => {
    it('should interpolate 2D vectors', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 10 };
      expect(vec.lerp(a, b, 0)).toEqual(a);
      expect(vec.lerp(a, b, 1)).toEqual(b);
      expect(vec.lerp(a, b, 0.5)).toEqual({ x: 5, y: 5 });
    });

    it('should interpolate 3D vectors', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 6, y: 9, z: 12 };
      const mid = vec.lerp(a, b, 0.5);
      expect(mid).toEqual({ x: 3, y: 4.5, z: 6 });
    });

    it('should handle extrapolation', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 10 };
      expect(vec.lerp(a, b, 2)).toEqual({ x: 20, y: 20 });
      expect(vec.lerp(a, b, -1)).toEqual({ x: -10, y: -10 });
    });
  });

  describe('Equality', () => {
    it('should compare 2D vectors', () => {
      const a = { x: 1.0, y: 2.0 };
      const b = { x: 1.0, y: 2.0 };
      expect(vec.equals(a, b)).toBe(true);
    });

    it('should compare 3D vectors', () => {
      const a = { x: 1.0, y: 2.0, z: 3.0 };
      const b = { x: 1.0, y: 2.0, z: 3.0 };
      expect(vec.equals(a, b)).toBe(true);
    });

    it('should handle floating point precision', () => {
      const a = { x: 1.0, y: 2.0 };
      const b = { x: 1.0000000001, y: 2.0000000001 };
      expect(vec.equals(a, b, 1e-8)).toBe(true);
      expect(vec.equals(a, b, 1e-12)).toBe(false);
    });

    it('should return false for different dimensions', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 1, y: 2, z: 0 };
      expect(vec.equals(a, b)).toBe(false);
    });
  });

  describe('Robotics Applications', () => {
    it('should calculate robot position after movement', () => {
      // Robot at (1, 2) moves by velocity vector (3, 4)
      const position = { x: 1, y: 2 };
      const velocity = { x: 3, y: 4 };
      const newPosition = vec.add(position, velocity);
      expect(newPosition).toEqual({ x: 4, y: 6 });
    });

    it('should calculate torque using cross product', () => {
      // Force applied at distance from pivot
      const r = { x: 0.5, y: 0, z: 0 }; // 0.5m from pivot
      const F = { x: 0, y: 10, z: 0 }; // 10N force
      const torque = vec.cross(r, F);
      expect(torque.z).toBe(5); // 5 N⋅m torque
    });

    it('should find angle between robot links', () => {
      // Two robot links forming 90 degree angle
      const link1 = { x: 1, y: 0, z: 0 };
      const link2 = { x: 0, y: 1, z: 0 };
      const angle = vec.angleBetween(link1, link2);
      expect(angle).toBeCloseTo(Math.PI / 2);
    });
  });
});
