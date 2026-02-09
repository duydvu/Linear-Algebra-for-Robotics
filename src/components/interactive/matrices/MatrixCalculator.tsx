import { useState } from 'react';
import Controls, { ResultDisplay, CheckboxControl } from '../core/Controls';
import * as mat from '../../../lib/math/matrix';

type MatrixSize = '2x2' | '3x3';

/**
 * MatrixCalculator - Interactive calculator for basic matrix operations
 * Demonstrates: addition, subtraction, scalar multiplication, transpose
 */
export default function MatrixCalculator() {
  const [size, setSize] = useState<MatrixSize>('2x2');
  const [matrixA, setMatrixA] = useState<number[][]>([
    [1, 2],
    [3, 4]
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [5, 6],
    [7, 8]
  ]);
  const [scalar, setScalar] = useState(2);
  const [showOperations, setShowOperations] = useState({
    add: true,
    subtract: false,
    scalarMultiply: false,
    transpose: false
  });

  // Handle size change
  const handleSizeChange = (newSize: MatrixSize) => {
    setSize(newSize);
    if (newSize === '2x2') {
      setMatrixA([
        [1, 2],
        [3, 4]
      ]);
      setMatrixB([
        [5, 6],
        [7, 8]
      ]);
    } else {
      setMatrixA([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      setMatrixB([
        [9, 8, 7],
        [6, 5, 4],
        [3, 2, 1]
      ]);
    }
  };

  // Update matrix value
  const updateMatrix = (
    matrix: 'A' | 'B',
    row: number,
    col: number,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const setter = matrix === 'A' ? setMatrixA : setMatrixB;
    const current = matrix === 'A' ? matrixA : matrixB;

    const updated = current.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? numValue : c))
    );
    setter(updated);
  };

  // Calculate operations
  const addition = mat.add(matrixA, matrixB);
  const subtraction = mat.subtract(matrixA, matrixB);
  const scalarMultiply = mat.scale(matrixA, scalar);
  const transposeA = mat.transpose(matrixA);

  // Format matrix for display
  const formatMatrix = (matrix: number[][]) => {
    return matrix.map(row =>
      row.map(val => val.toFixed(2).padStart(7, ' ')).join(' ')
    ).join('\n');
  };

  const renderMatrix = (matrix: number[][], label: string, onChange?: (row: number, col: number, value: string) => void) => (
    <div className="mb-4">
      <h4 className="font-semibold mb-2 text-sm">{label}</h4>
      <div className="inline-block">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-1 mb-1">
            {row.map((val, j) => (
              <input
                key={j}
                type="number"
                value={val}
                onChange={(e) => onChange?.(i, j, e.target.value)}
                disabled={!onChange}
                className="input input-bordered input-sm w-16 text-center"
                step="0.1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderResultMatrix = (matrix: number[][], label: string, color: string) => (
    <div className="mb-4">
      <h4 className="font-semibold mb-2 text-sm" style={{ color }}>{label}</h4>
      <div className="font-mono text-xs bg-base-200 p-3 rounded whitespace-pre">
        {formatMatrix(matrix)}
      </div>
    </div>
  );

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">Matrix Size</span>
            </label>
            <div className="btn-group">
              <button
                className={`btn btn-sm ${size === '2x2' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleSizeChange('2x2')}
              >
                2×2
              </button>
              <button
                className={`btn btn-sm ${size === '3x3' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleSizeChange('3x3')}
              >
                3×3
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {renderMatrix(matrixA, 'Matrix A', (r, c, v) => updateMatrix('A', r, c, v))}
            {renderMatrix(matrixB, 'Matrix B', (r, c, v) => updateMatrix('B', r, c, v))}
          </div>

          <div className="mb-4">
            <label className="label">
              <span className="label-text">Scalar value</span>
            </label>
            <input
              type="number"
              value={scalar}
              onChange={(e) => setScalar(parseFloat(e.target.value) || 0)}
              className="input input-bordered w-full max-w-xs"
              step="0.1"
            />
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Show Operations</h3>
                <CheckboxControl
                  label="Addition (A + B)"
                  checked={showOperations.add}
                  onChange={(checked) => setShowOperations({ ...showOperations, add: checked })}
                />
                <CheckboxControl
                  label="Subtraction (A - B)"
                  checked={showOperations.subtract}
                  onChange={(checked) => setShowOperations({ ...showOperations, subtract: checked })}
                />
                <CheckboxControl
                  label={`Scalar Multiplication (${scalar} × A)`}
                  checked={showOperations.scalarMultiply}
                  onChange={(checked) => setShowOperations({ ...showOperations, scalarMultiply: checked })}
                />
                <CheckboxControl
                  label="Transpose (Aᵀ)"
                  checked={showOperations.transpose}
                  onChange={(checked) => setShowOperations({ ...showOperations, transpose: checked })}
                />
              </div>

              <ResultDisplay title="Results">
                <div className="space-y-4">
                  {showOperations.add && renderResultMatrix(addition, 'A + B', '#0066ff')}
                  {showOperations.subtract && renderResultMatrix(subtraction, 'A - B', '#ff6600')}
                  {showOperations.scalarMultiply && renderResultMatrix(scalarMultiply, `${scalar} × A`, '#00aa66')}
                  {showOperations.transpose && renderResultMatrix(transposeA, 'Aᵀ', '#aa00ff')}
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Matrix Operations:</strong> Addition and subtraction work element-wise.
          Scalar multiplication scales all elements. Transpose swaps rows and columns (reflects across diagonal).
        </p>
      </div>
    </div>
  );
}
