/**
 * Matrix Math Library for Robotics
 * Provides operations for 2x2, 3x3, and 4x4 matrices
 * Matrices are represented as 2D arrays: matrix[row][column]
 */

export type Matrix = number[][];

/**
 * Create a matrix filled with zeros
 * @param rows Number of rows
 * @param cols Number of columns
 * @returns Zero matrix
 */
export function zeros(rows: number, cols: number): Matrix {
  return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

/**
 * Create an identity matrix
 * @param size Size of the square matrix
 * @returns Identity matrix I where I[i][i] = 1
 */
export function identity(size: number): Matrix {
  const matrix = zeros(size, size);
  for (let i = 0; i < size; i++) {
    matrix[i][i] = 1;
  }
  return matrix;
}

/**
 * Create a matrix from a 2D array
 * @param data 2D array of numbers
 * @returns Matrix
 */
export function create(data: number[][]): Matrix {
  return data.map(row => [...row]);
}

/**
 * Get matrix dimensions
 * @param matrix Input matrix
 * @returns [rows, cols]
 */
export function dimensions(matrix: Matrix): [number, number] {
  return [matrix.length, matrix[0]?.length || 0];
}

/**
 * Matrix multiplication: C = A * B
 * @param a First matrix (m × n)
 * @param b Second matrix (n × p)
 * @returns Product matrix (m × p)
 */
export function multiply(a: Matrix, b: Matrix): Matrix {
  const [aRows, aCols] = dimensions(a);
  const [bRows, bCols] = dimensions(b);

  if (aCols !== bRows) {
    throw new Error(`Matrix dimensions incompatible for multiplication: (${aRows}×${aCols}) × (${bRows}×${bCols})`);
  }

  const result = zeros(aRows, bCols);

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

/**
 * Matrix transpose: A^T
 * @param matrix Input matrix
 * @returns Transposed matrix
 */
export function transpose(matrix: Matrix): Matrix {
  const [rows, cols] = dimensions(matrix);
  const result = zeros(cols, rows);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}

/**
 * Matrix addition: C = A + B
 * @param a First matrix
 * @param b Second matrix
 * @returns Sum matrix
 */
export function add(a: Matrix, b: Matrix): Matrix {
  const [aRows, aCols] = dimensions(a);
  const [bRows, bCols] = dimensions(b);

  if (aRows !== bRows || aCols !== bCols) {
    throw new Error(`Matrix dimensions must match for addition: (${aRows}×${aCols}) vs (${bRows}×${bCols})`);
  }

  const result = zeros(aRows, aCols);

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < aCols; j++) {
      result[i][j] = a[i][j] + b[i][j];
    }
  }

  return result;
}

/**
 * Matrix subtraction: C = A - B
 * @param a First matrix
 * @param b Second matrix
 * @returns Difference matrix
 */
export function subtract(a: Matrix, b: Matrix): Matrix {
  const [aRows, aCols] = dimensions(a);
  const [bRows, bCols] = dimensions(b);

  if (aRows !== bRows || aCols !== bCols) {
    throw new Error(`Matrix dimensions must match for subtraction: (${aRows}×${aCols}) vs (${bRows}×${bCols})`);
  }

  const result = zeros(aRows, aCols);

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < aCols; j++) {
      result[i][j] = a[i][j] - b[i][j];
    }
  }

  return result;
}

/**
 * Scalar multiplication: B = s * A
 * @param matrix Input matrix
 * @param scalar Scalar value
 * @returns Scaled matrix
 */
export function scale(matrix: Matrix, scalar: number): Matrix {
  return matrix.map(row => row.map(val => val * scalar));
}

/**
 * Calculate determinant of a square matrix
 * @param matrix Input matrix
 * @returns Determinant value
 */
export function determinant(matrix: Matrix): number {
  const [rows, cols] = dimensions(matrix);

  if (rows !== cols) {
    throw new Error(`Determinant requires a square matrix, got ${rows}×${cols}`);
  }

  const size = rows;

  // Base cases
  if (size === 1) {
    return matrix[0][0];
  }

  if (size === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  if (size === 3) {
    return (
      matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
      matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
      matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
    );
  }

  // Recursive cofactor expansion for larger matrices
  let det = 0;
  for (let j = 0; j < size; j++) {
    det += Math.pow(-1, j) * matrix[0][j] * determinant(minor(matrix, 0, j));
  }

  return det;
}

/**
 * Get minor matrix by removing specified row and column
 * @param matrix Input matrix
 * @param row Row to remove
 * @param col Column to remove
 * @returns Minor matrix
 */
function minor(matrix: Matrix, row: number, col: number): Matrix {
  return matrix
    .filter((_, i) => i !== row)
    .map(r => r.filter((_, j) => j !== col));
}

/**
 * Calculate matrix inverse using Gauss-Jordan elimination
 * @param matrix Input matrix
 * @returns Inverse matrix A^(-1)
 */
export function inverse(matrix: Matrix): Matrix {
  const [rows, cols] = dimensions(matrix);

  if (rows !== cols) {
    throw new Error(`Inverse requires a square matrix, got ${rows}×${cols}`);
  }

  const size = rows;
  const det = determinant(matrix);

  if (Math.abs(det) < 1e-10) {
    throw new Error('Matrix is singular and cannot be inverted');
  }

  // Special case for 2x2 matrix
  if (size === 2) {
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }

  // Special case for 3x3 matrix
  if (size === 3) {
    const [
      [a, b, c],
      [d, e, f],
      [g, h, i]
    ] = matrix;

    return [
      [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
      [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
      [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
    ];
  }

  // Gauss-Jordan elimination for larger matrices
  const augmented = matrix.map((row, i) => [
    ...row,
    ...identity(size)[i]
  ]);

  // Forward elimination
  for (let i = 0; i < size; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < size; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Scale pivot row
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) {
      throw new Error('Matrix is singular and cannot be inverted');
    }

    for (let j = 0; j < size * 2; j++) {
      augmented[i][j] /= pivot;
    }

    // Eliminate column
    for (let k = 0; k < size; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < size * 2; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  return augmented.map(row => row.slice(size));
}

/**
 * Apply matrix to a vector (matrix-vector multiplication)
 * @param matrix m × n matrix
 * @param vector n-dimensional vector
 * @returns m-dimensional result vector
 */
export function applyToVector(matrix: Matrix, vector: number[]): number[] {
  const [rows, cols] = dimensions(matrix);

  if (cols !== vector.length) {
    throw new Error(`Matrix-vector dimensions incompatible: (${rows}×${cols}) × (${vector.length})`);
  }

  const result: number[] = [];

  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += matrix[i][j] * vector[j];
    }
    result.push(sum);
  }

  return result;
}

/**
 * Check if two matrices are approximately equal
 * @param a First matrix
 * @param b Second matrix
 * @param epsilon Tolerance for comparison
 */
export function equals(a: Matrix, b: Matrix, epsilon: number = 1e-10): boolean {
  const [aRows, aCols] = dimensions(a);
  const [bRows, bCols] = dimensions(b);

  if (aRows !== bRows || aCols !== bCols) {
    return false;
  }

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < aCols; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > epsilon) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Convert matrix to string representation
 * @param matrix Input matrix
 * @param precision Number of decimal places
 */
export function toString(matrix: Matrix, precision: number = 3): string {
  return matrix.map(row =>
    '[' + row.map(val => val.toFixed(precision)).join(', ') + ']'
  ).join('\n');
}

/**
 * Create a copy of a matrix
 */
export function copy(matrix: Matrix): Matrix {
  return matrix.map(row => [...row]);
}
