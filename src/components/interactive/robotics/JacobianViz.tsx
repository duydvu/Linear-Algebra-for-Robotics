import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl, MatrixDisplay } from '../core/Controls';

/**
 * JacobianViz - Interactive Jacobian visualization for a 2-link planar arm
 * Shows how the Jacobian maps joint velocities to end-effector velocities,
 * the manipulability ellipsoid, and singularity conditions.
 */
export default function JacobianViz() {
  const [theta1, setTheta1] = useState(Math.PI / 4);
  const [theta2, setTheta2] = useState(Math.PI / 3);
  const [dtheta1, setDtheta1] = useState(1.0);
  const [dtheta2, setDtheta2] = useState(0.0);
  const [showEllipsoid, setShowEllipsoid] = useState(true);
  const [showVelocity, setShowVelocity] = useState(true);

  const L1 = 2.0;
  const L2 = 1.5;

  // Forward kinematics
  const c1 = Math.cos(theta1);
  const s1 = Math.sin(theta1);
  const c12 = Math.cos(theta1 + theta2);
  const s12 = Math.sin(theta1 + theta2);

  const joint2 = { x: L1 * c1, y: L1 * s1 };
  const endEffector = { x: L1 * c1 + L2 * c12, y: L1 * s1 + L2 * s12 };

  // Jacobian: J = [[-L1*s1 - L2*s12, -L2*s12],
  //               [ L1*c1 + L2*c12,  L2*c12]]
  const J = [
    [-L1 * s1 - L2 * s12, -L2 * s12],
    [L1 * c1 + L2 * c12, L2 * c12]
  ];

  const detJ = J[0][0] * J[1][1] - J[0][1] * J[1][0]; // = L1*L2*sin(theta2)
  const manipulability = Math.abs(detJ);
  const isSingular = manipulability < 0.05;

  // End-effector velocity: v = J * dtheta
  const vx = J[0][0] * dtheta1 + J[0][1] * dtheta2;
  const vy = J[1][0] * dtheta1 + J[1][1] * dtheta2;

  // Manipulability ellipsoid: eigenvalues of J*J^T
  const JJT = [
    [J[0][0] * J[0][0] + J[0][1] * J[0][1], J[0][0] * J[1][0] + J[0][1] * J[1][1]],
    [J[1][0] * J[0][0] + J[1][1] * J[0][1], J[1][0] * J[1][0] + J[1][1] * J[1][1]]
  ];

  const traceJJT = JJT[0][0] + JJT[1][1];
  const detJJT = JJT[0][0] * JJT[1][1] - JJT[0][1] * JJT[1][0];
  const disc = Math.sqrt(Math.max(0, traceJJT * traceJJT - 4 * detJJT));
  const sigma1Sq = (traceJJT + disc) / 2;
  const sigma2Sq = (traceJJT - disc) / 2;
  const sigma1 = Math.sqrt(Math.max(0, sigma1Sq));
  const sigma2 = Math.sqrt(Math.max(0, sigma2Sq));

  // Eigenvectors of JJT for ellipsoid orientation
  let ellipseAngle = 0;
  if (Math.abs(JJT[0][1]) > 1e-8) {
    ellipseAngle = Math.atan2(sigma1Sq - JJT[0][0], JJT[0][1]);
  } else {
    ellipseAngle = JJT[0][0] >= JJT[1][1] ? 0 : Math.PI / 2;
  }

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2 + 40;
  const scl = 50;

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Grid
    p.stroke(235);
    p.strokeWeight(1);
    for (let i = -8; i <= 8; i++) {
      p.line(0, originY + i * scl, p.width, originY + i * scl);
      p.line(originX + i * scl, 0, originX + i * scl, p.height);
    }

    // Axes
    p.stroke(200);
    p.strokeWeight(1.5);
    p.line(0, originY, p.width, originY);
    p.line(originX, 0, originX, p.height);

    // Grid labels
    p.fill(160);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = -4; i <= 4; i++) {
      if (i !== 0) {
        p.text(i, originX + i * scl, originY + 13);
        p.text(i, originX - 13, originY - i * scl);
      }
    }

    // Robot arm
    const j1s = worldToScreen(0, 0, originX, originY, scl);
    const j2s = worldToScreen(joint2.x, joint2.y, originX, originY, scl);
    const ees = worldToScreen(endEffector.x, endEffector.y, originX, originY, scl);

    // Link 1
    p.stroke(80, 80, 80);
    p.strokeWeight(8);
    p.strokeCap(p.ROUND);
    p.line(j1s.x, j1s.y, j2s.x, j2s.y);

    // Link 2
    p.stroke(120, 120, 120);
    p.strokeWeight(6);
    p.line(j2s.x, j2s.y, ees.x, ees.y);

    // Manipulability ellipsoid at end-effector
    if (showEllipsoid && sigma1 > 0.01) {
      p.push();
      p.translate(ees.x, ees.y);
      // Negate angle because screen Y is flipped
      p.rotate(-ellipseAngle);
      p.noFill();
      p.stroke(0, 180, 100, 120);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([4, 3]);
      // Scale sigma values for visibility
      const ellipseScale = scl * 0.6;
      p.ellipse(0, 0, sigma1 * 2 * ellipseScale, sigma2 * 2 * ellipseScale);
      p.drawingContext.setLineDash([]);

      // Semi-axis lines
      p.stroke(0, 180, 100, 80);
      p.strokeWeight(1);
      p.line(-sigma1 * ellipseScale, 0, sigma1 * ellipseScale, 0);
      p.line(0, -sigma2 * ellipseScale, 0, sigma2 * ellipseScale);

      // Labels
      p.fill(0, 150, 80);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(`σ₁=${sigma1.toFixed(2)}`, sigma1 * ellipseScale * 0.6, -4);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(`σ₂=${sigma2.toFixed(2)}`, 4, -sigma2 * ellipseScale * 0.6);
      p.pop();
    }

    // End-effector velocity vector
    if (showVelocity && (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01)) {
      const velScale = scl * 0.4;
      const vxs = vx * velScale;
      const vys = -vy * velScale; // flip Y
      drawArrow(p, ees.x, ees.y, ees.x + vxs, ees.y + vys, [200, 60, 60]);

      p.fill(200, 60, 60);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text('v_ee', ees.x + vxs + 6, ees.y + vys - 4);
    }

    // Joints
    p.fill(60);
    p.noStroke();
    p.circle(j1s.x, j1s.y, 14);
    p.fill(80);
    p.circle(j2s.x, j2s.y, 12);

    // End-effector
    p.fill(isSingular ? 255 : 220, isSingular ? 60 : 60, 60);
    p.noStroke();
    p.circle(ees.x, ees.y, 10);

    // Singularity warning
    if (isSingular) {
      p.fill(255, 0, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text('SINGULARITY — det(J) ≈ 0', p.width / 2, 22);
    }
  };

  const drawArrow = (
    p: any,
    x1: number, y1: number,
    x2: number, y2: number,
    color: [number, number, number]
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    p.stroke(color[0], color[1], color[2]);
    p.strokeWeight(2.5);
    p.line(x1, y1, x2, y2);

    const angle = Math.atan2(dy, dx);
    const arrowSize = 8;
    p.fill(color[0], color[1], color[2]);
    p.noStroke();
    p.push();
    p.translate(x2, y2);
    p.rotate(angle);
    p.triangle(0, 0, -arrowSize, -arrowSize / 2, -arrowSize, arrowSize / 2);
    p.pop();
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'extended':
        setTheta1(0.3);
        setTheta2(0.05);
        break;
      case 'right-angle':
        setTheta1(Math.PI / 4);
        setTheta2(Math.PI / 2);
        break;
      case 'singular':
        setTheta1(Math.PI / 4);
        setTheta2(0);
        break;
      case 'folded':
        setTheta1(Math.PI / 4);
        setTheta2(Math.PI * 0.95);
        break;
    }
  };

  const conditionNumber = sigma2 > 1e-6 ? sigma1 / sigma2 : Infinity;

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Configuration</h4>
              <SliderControl
                label={`θ₁ = ${(theta1 * 180 / Math.PI).toFixed(0)}°`}
                value={theta1} onChange={setTheta1}
                min={-Math.PI} max={Math.PI} step={0.02}
                showValue={false}
              />
              <SliderControl
                label={`θ₂ = ${(theta2 * 180 / Math.PI).toFixed(0)}°`}
                value={theta2} onChange={setTheta2}
                min={-Math.PI} max={Math.PI} step={0.02}
                showValue={false}
              />

              <h4 className="font-semibold text-sm pt-2">Joint Velocities</h4>
              <SliderControl
                label={`dθ₁/dt = ${dtheta1.toFixed(1)} rad/s`}
                value={dtheta1} onChange={setDtheta1}
                min={-2} max={2} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`dθ₂/dt = ${dtheta2.toFixed(1)} rad/s`}
                value={dtheta2} onChange={setDtheta2}
                min={-2} max={2} step={0.1}
                showValue={false}
              />

              <div className="flex flex-wrap gap-1">
                <ButtonControl label="Extended" onClick={() => applyPreset('extended')} variant="outline" size="sm" />
                <ButtonControl label="Right Angle" onClick={() => applyPreset('right-angle')} variant="outline" size="sm" />
                <ButtonControl label="Singular" onClick={() => applyPreset('singular')} variant="outline" size="sm" />
                <ButtonControl label="Folded" onClick={() => applyPreset('folded')} variant="outline" size="sm" />
              </div>

              <CheckboxControl label="Show manipulability ellipsoid" checked={showEllipsoid} onChange={setShowEllipsoid} />
              <CheckboxControl label="Show velocity vector" checked={showVelocity} onChange={setShowVelocity} />

              <MatrixDisplay
                title="Jacobian J(θ)"
                matrix={J}
                precision={2}
              />

              <ResultDisplay title="Analysis">
                <div className="space-y-1">
                  <div>
                    <span className="text-base-content/60">det(J) = </span>
                    <span className={`font-bold ${isSingular ? 'text-error' : 'text-success'}`}>
                      {detJ.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-base-content/60">w (manipulability) = </span>
                    <span className="text-primary font-bold">{manipulability.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-base-content/60">σ₁ = </span>{sigma1.toFixed(3)}
                    <span className="text-base-content/60 ml-2">σ₂ = </span>{sigma2.toFixed(3)}
                  </div>
                  <div>
                    <span className="text-base-content/60">condition # = </span>
                    {conditionNumber === Infinity ? '∞' : conditionNumber.toFixed(1)}
                  </div>
                  <div className="border-t border-base-content/10 pt-1">
                    <span className="text-base-content/60">v_ee = </span>
                    ({vx.toFixed(2)}, {vy.toFixed(2)})
                  </div>
                  <div>
                    <span className="text-base-content/60">|v_ee| = </span>
                    {Math.sqrt(vx * vx + vy * vy).toFixed(3)}
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Set "Right Angle" for a well-conditioned configuration (round ellipsoid).
          Then click "Singular" (θ₂ → 0) and watch the ellipsoid collapse to a line — the robot
          loses the ability to move radially. Try different joint velocity inputs to see how the
          Jacobian maps them to end-effector velocity.
        </p>
      </div>
    </div>
  );
}
