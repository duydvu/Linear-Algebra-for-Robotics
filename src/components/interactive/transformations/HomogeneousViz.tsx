import { useState, useRef } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl, MatrixDisplay } from '../core/Controls';
import { multiply } from '../../../lib/math/matrix';
import type { Matrix } from '../../../lib/math/matrix';

/**
 * HomogeneousViz - Interactive 2-link planar robot arm visualization
 * Demonstrates: homogeneous transformation chaining for forward kinematics
 */
export default function HomogeneousViz() {
  const [theta1, setTheta1] = useState(Math.PI / 4);
  const [theta2, setTheta2] = useState(Math.PI / 3);
  const [L1, setL1] = useState(1.5);
  const [L2, setL2] = useState(1.2);
  const [showFrames, setShowFrames] = useState(true);
  const [showTrail, setShowTrail] = useState(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Build homogeneous transformation matrices
  // T_{i-1,i} = Rot(theta_i) * Trans(L_i, 0)
  // = [[cos, -sin, L*cos], [sin, cos, L*sin], [0, 0, 1]]
  const c1 = Math.cos(theta1), s1 = Math.sin(theta1);
  const c2 = Math.cos(theta2), s2 = Math.sin(theta2);

  const T01: Matrix = [
    [c1, -s1, L1 * c1],
    [s1,  c1, L1 * s1],
    [0,   0,  1]
  ];

  const T12: Matrix = [
    [c2, -s2, L2 * c2],
    [s2,  c2, L2 * s2],
    [0,   0,  1]
  ];

  const T02 = multiply(T01, T12);

  // Joint positions
  const joint1 = { x: T01[0][2], y: T01[1][2] };
  const endEffector = { x: T02[0][2], y: T02[1][2] };

  // Update trail
  if (showTrail) {
    const lastPoint = trailRef.current[trailRef.current.length - 1];
    if (!lastPoint || Math.abs(lastPoint.x - endEffector.x) > 0.01 || Math.abs(lastPoint.y - endEffector.y) > 0.01) {
      trailRef.current.push({ ...endEffector });
      if (trailRef.current.length > 200) {
        trailRef.current = trailRef.current.slice(-200);
      }
    }
  }

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height * 0.65; // Lower origin to show arm reaching up
  const scale = 70;

  const drawFrameArrows = (p: any, px: number, py: number, angle: number, arrowLen: number, labelSuffix: string) => {
    const screen = worldToScreen(px, py, originX, originY, scale);
    const len = arrowLen * scale;

    // x-axis (red)
    const xDx = len * Math.cos(angle);
    const xDy = -len * Math.sin(angle); // flip Y for screen
    p.stroke(220, 50, 50);
    p.strokeWeight(2);
    p.line(screen.x, screen.y, screen.x + xDx, screen.y + xDy);
    // Arrowhead
    p.push();
    p.translate(screen.x + xDx, screen.y + xDy);
    p.rotate(Math.atan2(xDy, xDx));
    p.fill(220, 50, 50);
    p.noStroke();
    p.triangle(0, 0, -7, -3, -7, 3);
    p.pop();

    // x label
    p.fill(220, 50, 50);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`x${labelSuffix}`, screen.x + xDx * 1.2, screen.y + xDy * 1.2);

    // y-axis (green)
    const yAngle = angle + Math.PI / 2;
    const yDx = len * Math.cos(yAngle);
    const yDy = -len * Math.sin(yAngle);
    p.stroke(50, 180, 50);
    p.strokeWeight(2);
    p.line(screen.x, screen.y, screen.x + yDx, screen.y + yDy);
    // Arrowhead
    p.push();
    p.translate(screen.x + yDx, screen.y + yDy);
    p.rotate(Math.atan2(yDy, yDx));
    p.fill(50, 180, 50);
    p.noStroke();
    p.triangle(0, 0, -7, -3, -7, 3);
    p.pop();

    // y label
    p.fill(50, 180, 50);
    p.noStroke();
    p.textSize(9);
    p.text(`y${labelSuffix}`, screen.x + yDx * 1.2, screen.y + yDy * 1.2);
  };

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Grid
    p.stroke(235);
    p.strokeWeight(1);
    for (let i = -6; i <= 6; i++) {
      p.line(0, originY + i * scale, p.width, originY + i * scale);
      p.line(originX + i * scale, 0, originX + i * scale, p.height);
    }

    // Axes
    p.stroke(180);
    p.strokeWeight(1.5);
    p.line(0, originY, p.width, originY);
    p.line(originX, 0, originX, p.height);

    // Trail
    if (showTrail && trailRef.current.length > 1) {
      p.noStroke();
      trailRef.current.forEach((pt, i) => {
        const alpha = (i / trailRef.current.length) * 200 + 55;
        p.fill(255, 120, 0, alpha);
        const screen = worldToScreen(pt.x, pt.y, originX, originY, scale);
        p.circle(screen.x, screen.y, 3);
      });
    }

    // Robot arm
    const baseScreen = worldToScreen(0, 0, originX, originY, scale);
    const j1Screen = worldToScreen(joint1.x, joint1.y, originX, originY, scale);
    const eeScreen = worldToScreen(endEffector.x, endEffector.y, originX, originY, scale);

    // Base
    p.fill(80);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(baseScreen.x, baseScreen.y + 8, 30, 16, 3);
    p.circle(baseScreen.x, baseScreen.y, 14);

    // Link 1
    p.stroke(0, 100, 220);
    p.strokeWeight(7);
    p.line(baseScreen.x, baseScreen.y, j1Screen.x, j1Screen.y);

    // Joint 1
    p.fill(0, 100, 220);
    p.noStroke();
    p.circle(j1Screen.x, j1Screen.y, 12);

    // Link 2
    p.stroke(0, 170, 100);
    p.strokeWeight(7);
    p.line(j1Screen.x, j1Screen.y, eeScreen.x, eeScreen.y);

    // End effector
    p.fill(255, 120, 0);
    p.noStroke();
    p.circle(eeScreen.x, eeScreen.y, 10);

    // Coordinate frames
    if (showFrames) {
      drawFrameArrows(p, 0, 0, 0, 0.4, '₀');
      drawFrameArrows(p, joint1.x, joint1.y, theta1, 0.35, '₁');
      drawFrameArrows(p, endEffector.x, endEffector.y, theta1 + theta2, 0.35, '₂');
    }

    // Grid labels
    p.fill(140);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = -3; i <= 3; i++) {
      if (i !== 0) {
        p.text(i, originX + i * scale, originY + 15);
        p.text(i, originX - 15, originY - i * scale);
      }
    }

    // Joint angle arcs
    p.noFill();
    p.strokeWeight(1.5);

    // theta1 arc at base
    p.stroke(0, 100, 220, 150);
    const arcR1 = 25;
    p.arc(baseScreen.x, baseScreen.y, arcR1 * 2, arcR1 * 2, -theta1, 0);
    p.fill(0, 100, 220);
    p.noStroke();
    p.textSize(10);
    const t1LabelAngle = -theta1 / 2;
    p.text('θ₁', baseScreen.x + (arcR1 + 10) * Math.cos(t1LabelAngle), baseScreen.y + (arcR1 + 10) * Math.sin(t1LabelAngle));

    // theta2 arc at joint1
    p.noFill();
    p.stroke(0, 170, 100, 150);
    p.strokeWeight(1.5);
    const arcR2 = 20;
    p.push();
    p.translate(j1Screen.x, j1Screen.y);
    p.rotate(-theta1);
    p.arc(0, 0, arcR2 * 2, arcR2 * 2, -theta2, 0);
    p.fill(0, 170, 100);
    p.noStroke();
    p.textSize(10);
    const t2LabelAngle = -theta2 / 2;
    p.text('θ₂', (arcR2 + 10) * Math.cos(t2LabelAngle), (arcR2 + 10) * Math.sin(t2LabelAngle));
    p.pop();
  };

  const clearTrail = () => {
    trailRef.current = [];
  };

  const handleTheta1Change = (val: number) => {
    setTheta1(val);
  };

  const handleTheta2Change = (val: number) => {
    setTheta2(val);
  };

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <SliderControl
              label={`θ₁ (Joint 1): ${(theta1 * 180 / Math.PI).toFixed(1)}°`}
              value={theta1}
              onChange={handleTheta1Change}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />
            <SliderControl
              label={`θ₂ (Joint 2): ${(theta2 * 180 / Math.PI).toFixed(1)}°`}
              value={theta2}
              onChange={handleTheta2Change}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />
            <SliderControl
              label="L₁ (Link 1)"
              value={L1}
              onChange={setL1}
              min={0.5}
              max={2.5}
              step={0.1}
            />
            <SliderControl
              label="L₂ (Link 2)"
              value={L2}
              onChange={setL2}
              min={0.5}
              max={2.0}
              step={0.1}
            />

            <CheckboxControl label="Show coordinate frames" checked={showFrames} onChange={setShowFrames} />
            <div className="flex items-center gap-2">
              <CheckboxControl label="Show end-effector trail" checked={showTrail} onChange={setShowTrail} />
              {showTrail && (
                <ButtonControl label="Clear" onClick={clearTrail} variant="outline" size="sm" />
              )}
            </div>

            <MatrixDisplay title="T₀₁ (Base → Joint 1)" matrix={T01} precision={3} />
            <MatrixDisplay title="T₁₂ (Joint 1 → End)" matrix={T12} precision={3} />
            <MatrixDisplay title="T₀₂ = T₀₁ · T₁₂" matrix={T02} precision={3} highlight />

            <ResultDisplay title="End-Effector Pose">
              <div>Position: ({endEffector.x.toFixed(3)}, {endEffector.y.toFixed(3)})</div>
              <div>Orientation: {((theta1 + theta2) * 180 / Math.PI).toFixed(1)}°</div>
            </ResultDisplay>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Key insight:</strong> The end-effector pose T₀₂ is computed by multiplying
          T₀₁ · T₁₂. This "chaining" of homogeneous transforms is the foundation of
          forward kinematics — computing where the end-effector is from joint angles.
        </p>
      </div>
    </div>
  );
}
