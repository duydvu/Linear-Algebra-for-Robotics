import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl } from '../core/Controls';
import * as mat from '../../../lib/math/matrix';

/**
 * DeterminantViz - Interactive visualization of determinants
 * Demonstrates: geometric meaning (area scaling), singular matrices, robot singularities
 */
export default function DeterminantViz() {
  const [matrix, setMatrix] = useState<number[][]>([
    [2, 0],
    [0, 1.5]
  ]);
  const [showUnitSquare, setShowUnitSquare] = useState(true);
  const [showTransformed, setShowTransformed] = useState(true);
  const [showRobot, setShowRobot] = useState(false);
  const [theta1, setTheta1] = useState(Math.PI / 4);
  const [theta2, setTheta2] = useState(Math.PI / 3);

  // Calculate determinant
  const det = mat.determinant(matrix);
  const isSingular = Math.abs(det) < 0.01;

  // Robot arm parameters (2-link planar)
  const L1 = 1.5; // Length of link 1
  const L2 = 1.5; // Length of link 2

  // Forward kinematics for 2-link arm
  const joint1 = { x: L1 * Math.cos(theta1), y: L1 * Math.sin(theta1) };
  const joint2 = {
    x: joint1.x + L2 * Math.cos(theta1 + theta2),
    y: joint1.y + L2 * Math.sin(theta1 + theta2)
  };

  // Jacobian for 2-link planar arm
  const jacobian = [
    [-L1 * Math.sin(theta1) - L2 * Math.sin(theta1 + theta2), -L2 * Math.sin(theta1 + theta2)],
    [L1 * Math.cos(theta1) + L2 * Math.cos(theta1 + theta2), L2 * Math.cos(theta1 + theta2)]
  ];
  const jacobianDet = mat.determinant(jacobian);
  const robotSingular = Math.abs(jacobianDet) < 0.1;

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = showRobot ? 70 : 50;

  // Update matrix value
  const updateMatrix = (row: number, col: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updated = matrix.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? numValue : c))
    );
    setMatrix(updated);
  };

  const draw = (p: any) => {
    p.clear();
    p.background(255);

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

    if (showRobot) {
      // Draw robot arm
      const j1Screen = worldToScreen(joint1.x, joint1.y, originX, originY, scale);
      const j2Screen = worldToScreen(joint2.x, joint2.y, originX, originY, scale);

      // Base
      p.fill(100);
      p.noStroke();
      p.circle(originX, originY, 15);

      // Link 1
      p.stroke(0, 100, 200);
      p.strokeWeight(6);
      p.line(originX, originY, j1Screen.x, j1Screen.y);

      // Joint 1
      p.fill(0, 100, 200);
      p.noStroke();
      p.circle(j1Screen.x, j1Screen.y, 12);

      // Link 2
      p.stroke(0, 150, 100);
      p.strokeWeight(6);
      p.line(j1Screen.x, j1Screen.y, j2Screen.x, j2Screen.y);

      // End effector
      p.fill(robotSingular ? 'red' : 'orange', 150, 0);
      p.noStroke();
      p.circle(j2Screen.x, j2Screen.y, 10);

      // Draw velocity ellipse from Jacobian
      const numPoints = 32;
      p.noFill();
      p.stroke(100, 100, 255, 150);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const unitVel = [Math.cos(angle), Math.sin(angle)];
        const cartVel = mat.applyToVector(jacobian, unitVel);
        const velScreen = worldToScreen(
          joint2.x + cartVel[0] * 0.3,
          joint2.y + cartVel[1] * 0.3,
          originX,
          originY,
          scale
        );
        p.vertex(velScreen.x, velScreen.y);
      }
      p.endShape();

      // Singularity warning
      if (robotSingular) {
        p.fill(255, 0, 0);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text('⚠ SINGULAR CONFIGURATION', width / 2, 30);
      }
    } else {
      // Unit square vertices
      const unitSquare = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
      ];

      // Draw unit square
      if (showUnitSquare) {
        p.fill(200, 200, 255, 100);
        p.stroke(100, 100, 200);
        p.strokeWeight(2);
        p.beginShape();
        unitSquare.forEach(point => {
          const screen = worldToScreen(point.x, point.y, originX, originY, scale);
          p.vertex(screen.x, screen.y);
        });
        p.endShape(p.CLOSE);

        // Label
        p.fill(100, 100, 200);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        const labelScreen = worldToScreen(0.5, 0.5, originX, originY, scale);
        p.text('Area = 1', labelScreen.x, labelScreen.y);
      }

      // Draw transformed square
      if (showTransformed) {
        const transformedSquare = unitSquare.map(point => {
          const transformed = mat.applyToVector(matrix, [point.x, point.y]);
          return { x: transformed[0], y: transformed[1] };
        });

        p.fill(255, 200, 200, 100);
        p.stroke(200, 100, 100);
        p.strokeWeight(2);
        p.beginShape();
        transformedSquare.forEach(point => {
          const screen = worldToScreen(point.x, point.y, originX, originY, scale);
          p.vertex(screen.x, screen.y);
        });
        p.endShape(p.CLOSE);

        // Calculate center for label
        const centerX = transformedSquare.reduce((sum, p) => sum + p.x, 0) / 4;
        const centerY = transformedSquare.reduce((sum, p) => sum + p.y, 0) / 4;
        const labelScreen = worldToScreen(centerX, centerY, originX, originY, scale);

        p.fill(200, 100, 100);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(`Area = ${Math.abs(det).toFixed(2)}`, labelScreen.x, labelScreen.y);

        // Draw basis vectors
        drawVector(p, originX, originY, matrix[0][0] * scale, -matrix[1][0] * scale, [0, 100, 255], 'v₁');
        drawVector(p, originX, originY, matrix[0][1] * scale, -matrix[1][1] * scale, [255, 100, 0], 'v₂');
      }

      // Singularity warning
      if (isSingular && showTransformed) {
        p.fill(255, 0, 0);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text('⚠ SINGULAR MATRIX (det ≈ 0)', width / 2, 30);
      }
    }

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

  const renderMatrix = (matrix: number[][], label: string) => (
    <div className="mb-4">
      <h4 className="font-semibold mb-2 text-sm">{label}</h4>
      <div className="inline-block">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-1 mb-1">
            {row.map((val, j) => (
              <input
                key={j}
                type="number"
                value={val.toFixed(3)}
                onChange={(e) => updateMatrix(i, j, e.target.value)}
                disabled={showRobot}
                className="input input-bordered input-sm w-20 text-center"
                step="0.1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />

          <div className="mt-4 space-y-2">
            <CheckboxControl
              label="Show robot arm example"
              checked={showRobot}
              onChange={setShowRobot}
            />
            {!showRobot && (
              <>
                <CheckboxControl
                  label="Show unit square"
                  checked={showUnitSquare}
                  onChange={setShowUnitSquare}
                />
                <CheckboxControl
                  label="Show transformed shape"
                  checked={showTransformed}
                  onChange={setShowTransformed}
                />
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
        <Controls>
          <div className="space-y-4">
            {!showRobot ? (
              <>
                {renderMatrix(matrix, 'Transformation Matrix')}

                <ResultDisplay title="Determinant Analysis">
                  <div className="space-y-3">
                    <div className="text-2xl text-primary font-bold">
                      det(A) = {det.toFixed(3)}
                    </div>

                    <div className="text-sm space-y-2">
                      <div>
                        <strong>Geometric Meaning:</strong>
                      </div>
                      <div className="pl-3">
                        The determinant represents the <strong>area scaling factor</strong>.
                        A unit square (area = 1) becomes a parallelogram with area = |det(A)|.
                      </div>

                      {Math.abs(det) > 0.01 ? (
                        <div className="pl-3 text-success">
                          ✓ Non-singular: Matrix is invertible
                        </div>
                      ) : (
                        <div className="pl-3 text-error">
                          ✗ Singular: Matrix collapses space (det ≈ 0)
                        </div>
                      )}

                      {det < 0 && (
                        <div className="pl-3 text-warning">
                          ⚠ Negative determinant: Transformation reverses orientation
                        </div>
                      )}
                    </div>
                  </div>
                </ResultDisplay>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-semibold mb-3">Joint Angles</h4>
                  <SliderControl
                    label={`θ₁ = ${(theta1 * 180 / Math.PI).toFixed(1)}°`}
                    value={theta1}
                    onChange={setTheta1}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.05}
                  />
                  <SliderControl
                    label={`θ₂ = ${(theta2 * 180 / Math.PI).toFixed(1)}°`}
                    value={theta2}
                    onChange={setTheta2}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.05}
                  />
                </div>

                <ResultDisplay title="Jacobian Determinant">
                  <div className="space-y-3">
                    <div className="text-2xl text-primary font-bold">
                      det(J) = {jacobianDet.toFixed(3)}
                    </div>

                    <div className="text-sm space-y-2">
                      <div>
                        <strong>Jacobian Matrix:</strong>
                      </div>
                      <div className="font-mono text-xs bg-base-200 p-2 rounded">
                        [{jacobian[0][0].toFixed(2)}, {jacobian[0][1].toFixed(2)}]
                        <br />
                        [{jacobian[1][0].toFixed(2)}, {jacobian[1][1].toFixed(2)}]
                      </div>

                      {Math.abs(jacobianDet) > 0.1 ? (
                        <div className="text-success">
                          ✓ Normal configuration: Full end-effector control
                        </div>
                      ) : (
                        <div className="text-error">
                          ✗ Singular configuration: Loss of degrees of freedom!
                          <br />
                          The robot cannot move in certain directions.
                        </div>
                      )}

                      <div className="border-t pt-2">
                        <div className="font-semibold">Try these:</div>
                        <div className="text-xs">
                          • θ₁ = 45°, θ₂ = 60° (normal)
                          <br />
                          • θ₁ = 0°, θ₂ = 0° (singular, fully extended)
                          <br />• θ₁ = 90°, θ₂ = 180° (singular, fully folded)
                        </div>
                      </div>
                    </div>
                  </div>
                </ResultDisplay>
              </>
            )}
          </div>
        </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Determinant Intuition:</strong> The determinant tells you how much a transformation
          stretches or shrinks space. When det = 0, the matrix squashes space into a lower dimension
          (singular). In robotics, a singular Jacobian means the robot loses control in some direction.
        </p>
      </div>
    </div>
  );
}
