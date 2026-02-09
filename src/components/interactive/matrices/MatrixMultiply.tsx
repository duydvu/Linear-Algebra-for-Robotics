import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl } from '../core/Controls';
import * as mat from '../../../lib/math/matrix';

/**
 * MatrixMultiply - Interactive visualization of matrix multiplication
 * Demonstrates: row-column multiplication, transformation composition
 */
export default function MatrixMultiply() {
  const [matrixA, setMatrixA] = useState<number[][]>([
    [2, 0],
    [0, 1]
  ]);
  const [matrixB, setMatrixB] = useState<number[][]>([
    [1, 0],
    [0, 2]
  ]);
  const [highlightRow, setHighlightRow] = useState(0);
  const [highlightCol, setHighlightCol] = useState(0);
  const [showVisualization, setShowVisualization] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  // Calculate result
  const result = mat.multiply(matrixA, matrixB);

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 50;

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

  // Calculate highlighted element
  const calculateElement = (row: number, col: number) => {
    let sum = 0;
    const steps: string[] = [];
    for (let i = 0; i < matrixA[0].length; i++) {
      const term = matrixA[row][i] * matrixB[i][col];
      sum += term;
      steps.push(`(${matrixA[row][i]} × ${matrixB[i][col]} = ${term.toFixed(2)})`);
    }
    return { sum, steps };
  };

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    if (!showVisualization) return;

    // Draw grid
    p.stroke(230);
    p.strokeWeight(1);
    for (let i = -5; i <= 5; i++) {
      p.line(0, originY + i * scale, width, originY + i * scale);
      p.line(originX + i * scale, 0, originX + i * scale, height);
    }

    // Draw axes
    p.stroke(150);
    p.strokeWeight(2);
    p.line(0, originY, width, originY);
    p.line(originX, 0, originX, height);

    // Draw original basis vectors (gray)
    drawVector(p, originX, originY, scale, 0, [150, 150, 150], 'e₁');
    drawVector(p, originX, originY, 0, scale, [150, 150, 150], 'e₂');

    // Apply transformations
    // First transform: B
    const e1_B = { x: matrixB[0][0], y: matrixB[1][0] };
    const e2_B = { x: matrixB[0][1], y: matrixB[1][1] };

    // Draw B-transformed vectors (green)
    const e1_B_screen = worldToScreen(e1_B.x, e1_B.y, originX, originY, scale);
    const e2_B_screen = worldToScreen(e2_B.x, e2_B.y, originX, originY, scale);

    drawVector(p, originX, originY, e1_B_screen.x - originX, e1_B_screen.y - originY, [0, 180, 100], 'Be₁');
    drawVector(p, originX, originY, e2_B_screen.x - originX, e2_B_screen.y - originY, [0, 180, 100], 'Be₂');

    // Second transform: A(B)
    const e1_AB = {
      x: matrixA[0][0] * e1_B.x + matrixA[0][1] * e1_B.y,
      y: matrixA[1][0] * e1_B.x + matrixA[1][1] * e1_B.y
    };
    const e2_AB = {
      x: matrixA[0][0] * e2_B.x + matrixA[0][1] * e2_B.y,
      y: matrixA[1][0] * e2_B.x + matrixA[1][1] * e2_B.y
    };

    // Draw AB-transformed vectors (blue)
    const e1_AB_screen = worldToScreen(e1_AB.x, e1_AB.y, originX, originY, scale);
    const e2_AB_screen = worldToScreen(e2_AB.x, e2_AB.y, originX, originY, scale);

    drawVector(p, originX, originY, e1_AB_screen.x - originX, e1_AB_screen.y - originY, [0, 100, 255], '(AB)e₁');
    drawVector(p, originX, originY, e2_AB_screen.x - originX, e2_AB_screen.y - originY, [0, 100, 255], '(AB)e₂');

    // Draw grid labels
    p.fill(100);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = -4; i <= 4; i++) {
      if (i !== 0) {
        p.text(i, originX + i * scale, originY + 15);
        p.text(i, originX - 15, originY - i * scale);
      }
    }
  };

  const drawVector = (
    p: any,
    startX: number,
    startY: number,
    dx: number,
    dy: number,
    color: [number, number, number],
    label: string
  ) => {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    p.push();
    p.stroke(color[0], color[1], color[2]);
    p.strokeWeight(3);
    p.fill(color[0], color[1], color[2]);

    // Draw line
    p.line(startX, startY, startX + dx, startY + dy);

    // Draw arrowhead
    const angle = Math.atan2(dy, dx);
    const arrowSize = 10;
    p.push();
    p.translate(startX + dx, startY + dy);
    p.rotate(angle);
    p.triangle(0, 0, -arrowSize, -arrowSize / 2, -arrowSize, arrowSize / 2);
    p.pop();

    // Draw label
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    const labelX = startX + dx * 0.6;
    const labelY = startY + dy * 0.6 - 15;
    p.text(label, labelX, labelY);

    p.pop();
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
                className={`input input-bordered input-sm w-16 text-center ${
                  (label === 'Matrix A' && i === highlightRow) ||
                  (label === 'Matrix B' && j === highlightCol)
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                step="0.1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const calculation = calculateElement(highlightRow, highlightCol);

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />

          <div className="mt-4">
            <CheckboxControl
              label="Show transformation visualization"
              checked={showVisualization}
              onChange={setShowVisualization}
            />
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-4">
              {renderMatrix(matrixA, 'Matrix A', (r, c, v) => updateMatrix('A', r, c, v))}
              {renderMatrix(matrixB, 'Matrix B', (r, c, v) => updateMatrix('B', r, c, v))}

              <div>
                <h4 className="font-semibold mb-2 text-sm">Highlight Element</h4>
                <SliderControl
                  label={`Row (${highlightRow + 1})`}
                  value={highlightRow}
                  onChange={setHighlightRow}
                  min={0}
                  max={matrixA.length - 1}
                  step={1}
                />
                <SliderControl
                  label={`Column (${highlightCol + 1})`}
                  value={highlightCol}
                  onChange={setHighlightCol}
                  min={0}
                  max={matrixB[0].length - 1}
                  step={1}
                />
              </div>

              <ResultDisplay title="Matrix Product (AB)">
                <div className="space-y-3">
                  <div className="font-mono text-xs bg-base-200 p-3 rounded">
                    {result.map((row, i) => (
                      <div key={i} className="mb-1">
                        {row.map((val, j) => (
                          <span
                            key={j}
                            className={`inline-block w-16 text-center ${
                              i === highlightRow && j === highlightCol
                                ? 'font-bold text-primary'
                                : ''
                            }`}
                          >
                            {val.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm font-semibold mb-2">
                      Computing element [{highlightRow + 1}][{highlightCol + 1}]:
                    </div>
                    <div className="text-xs space-y-1">
                      {calculation.steps.map((step, i) => (
                        <div key={i}>{step}</div>
                      ))}
                      <div className="border-t mt-2 pt-2 font-bold text-primary">
                        Sum = {calculation.sum.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Transformation Composition:</strong> Matrix multiplication represents composing transformations.
          Gray vectors show the original basis. Green shows after applying B, blue shows after applying A to those results.
          The result AB represents doing B first, then A.
        </p>
      </div>
    </div>
  );
}
