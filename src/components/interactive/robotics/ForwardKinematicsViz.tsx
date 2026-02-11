import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl, MatrixDisplay } from '../core/Controls';
import { dhTransform } from '../../../lib/math/transforms';
import { multiply } from '../../../lib/math/matrix';

/**
 * ForwardKinematicsViz - Interactive 2-link planar robot arm
 * Demonstrates forward kinematics using DH parameters.
 * Users adjust joint angles and see end-effector position computed via DH chain.
 */
export default function ForwardKinematicsViz() {
  const [theta1, setTheta1] = useState(Math.PI / 4);
  const [theta2, setTheta2] = useState(Math.PI / 3);
  const [L1, setL1] = useState(2.0);
  const [L2, setL2] = useState(1.5);
  const [showFrames, setShowFrames] = useState(true);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  // Trace of end-effector positions
  const [trace, setTrace] = useState<Array<{ x: number; y: number }>>([]);

  // DH parameters for 2R planar arm:
  //   Link 1: a=L1, alpha=0, d=0, theta=theta1
  //   Link 2: a=L2, alpha=0, d=0, theta=theta2
  const T01 = dhTransform(L1, 0, 0, theta1);
  const T12 = dhTransform(L2, 0, 0, theta2);
  const T02 = multiply(T01, T12);

  // Joint positions (for drawing)
  const joint1 = { x: 0, y: 0 };
  const joint2 = { x: T01[0][3], y: T01[1][3] };
  const endEffector = { x: T02[0][3], y: T02[1][3] };

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2 + 40;
  const scale = 50;

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Grid
    p.stroke(235);
    p.strokeWeight(1);
    for (let i = -8; i <= 8; i++) {
      p.line(0, originY + i * scale, p.width, originY + i * scale);
      p.line(originX + i * scale, 0, originX + i * scale, p.height);
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
        p.text(i, originX + i * scale, originY + 13);
        p.text(i, originX - 13, originY - i * scale);
      }
    }

    // Workspace boundary (reachable region)
    if (showWorkspace) {
      p.noFill();
      p.stroke(100, 200, 100, 60);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([4, 4]);
      // Outer boundary
      const rOuter = L1 + L2;
      const outerCenter = worldToScreen(0, 0, originX, originY, scale);
      p.ellipse(outerCenter.x, outerCenter.y, rOuter * 2 * scale, rOuter * 2 * scale);
      // Inner boundary (only when L1 > L2)
      const rInner = Math.abs(L1 - L2);
      if (rInner > 0.01) {
        p.ellipse(outerCenter.x, outerCenter.y, rInner * 2 * scale, rInner * 2 * scale);
      }
      p.drawingContext.setLineDash([]);
    }

    // Trace
    if (showTrace && trace.length > 1) {
      p.noFill();
      p.stroke(100, 100, 255, 80);
      p.strokeWeight(1.5);
      p.beginShape();
      for (const pt of trace) {
        const s = worldToScreen(pt.x, pt.y, originX, originY, scale);
        p.vertex(s.x, s.y);
      }
      p.endShape();
    }

    // Link 1
    const j1s = worldToScreen(joint1.x, joint1.y, originX, originY, scale);
    const j2s = worldToScreen(joint2.x, joint2.y, originX, originY, scale);
    const ees = worldToScreen(endEffector.x, endEffector.y, originX, originY, scale);

    p.stroke(80, 80, 80);
    p.strokeWeight(8);
    p.strokeCap(p.ROUND);
    p.line(j1s.x, j1s.y, j2s.x, j2s.y);

    // Link 2
    p.stroke(120, 120, 120);
    p.strokeWeight(6);
    p.line(j2s.x, j2s.y, ees.x, ees.y);

    // Coordinate frames at each joint
    if (showFrames) {
      const frameLen = 0.6;

      // Frame 0 (base)
      drawFrame(p, 0, 0, 0, frameLen, originX, originY, scale, '{0}');

      // Frame 1 (at joint 2)
      drawFrame(p, joint2.x, joint2.y, theta1, frameLen, originX, originY, scale, '{1}');

      // Frame 2 (at end-effector)
      drawFrame(p, endEffector.x, endEffector.y, theta1 + theta2, frameLen * 0.8, originX, originY, scale, '{2}');
    }

    // Joint circles
    p.fill(60);
    p.noStroke();
    p.circle(j1s.x, j1s.y, 14);
    p.fill(80);
    p.circle(j2s.x, j2s.y, 12);

    // End-effector
    p.fill(220, 60, 60);
    p.noStroke();
    p.circle(ees.x, ees.y, 10);

    // Joint angle arcs
    p.noFill();
    p.strokeWeight(1.5);

    // theta1 arc
    p.stroke(0, 120, 200, 150);
    const arcR1 = 0.5 * scale;
    p.arc(j1s.x, j1s.y, arcR1 * 2, arcR1 * 2, -theta1, 0);
    p.fill(0, 120, 200);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    const t1LabelAngle = -theta1 / 2;
    p.text('θ₁', j1s.x + (arcR1 + 12) * Math.cos(t1LabelAngle), j1s.y + (arcR1 + 12) * Math.sin(t1LabelAngle));

    // theta2 arc (relative to link 1 direction)
    p.noFill();
    p.stroke(200, 120, 0, 150);
    p.strokeWeight(1.5);
    const arcR2 = 0.4 * scale;
    const link1Angle = -theta1;
    p.arc(j2s.x, j2s.y, arcR2 * 2, arcR2 * 2, link1Angle - theta2, link1Angle);
    p.fill(200, 120, 0);
    p.noStroke();
    p.textSize(11);
    const t2LabelAngle = link1Angle - theta2 / 2;
    p.text('θ₂', j2s.x + (arcR2 + 12) * Math.cos(t2LabelAngle), j2s.y + (arcR2 + 12) * Math.sin(t2LabelAngle));

    // Labels for link lengths
    p.fill(60);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    const mid1x = (j1s.x + j2s.x) / 2;
    const mid1y = (j1s.y + j2s.y) / 2;
    p.text(`L₁=${L1.toFixed(1)}`, mid1x - 15, mid1y - 12);
    const mid2x = (j2s.x + ees.x) / 2;
    const mid2y = (j2s.y + ees.y) / 2;
    p.text(`L₂=${L2.toFixed(1)}`, mid2x - 15, mid2y - 12);
  };

  const drawFrame = (
    p: any,
    ox: number, oy: number,
    angle: number,
    len: number,
    originX: number, originY: number, scale: number,
    label: string
  ) => {
    const o = worldToScreen(ox, oy, originX, originY, scale);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // X-axis (red)
    const xEnd = worldToScreen(ox + len * cos, oy + len * sin, originX, originY, scale);
    p.stroke(220, 40, 40);
    p.strokeWeight(2);
    p.line(o.x, o.y, xEnd.x, xEnd.y);
    drawSmallArrow(p, o.x, o.y, xEnd.x, xEnd.y, [220, 40, 40]);

    // Y-axis (green)
    const yEnd = worldToScreen(ox - len * sin, oy + len * cos, originX, originY, scale);
    p.stroke(40, 160, 40);
    p.strokeWeight(2);
    p.line(o.x, o.y, yEnd.x, yEnd.y);
    drawSmallArrow(p, o.x, o.y, yEnd.x, yEnd.y, [40, 160, 40]);

    // Label
    p.fill(100);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(label, o.x + 4, o.y + 4);
  };

  const drawSmallArrow = (
    p: any,
    x1: number, y1: number,
    x2: number, y2: number,
    color: [number, number, number]
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const size = 6;
    p.fill(color[0], color[1], color[2]);
    p.noStroke();
    p.push();
    p.translate(x2, y2);
    p.rotate(angle);
    p.triangle(0, 0, -size, -size / 2, -size, size / 2);
    p.pop();
  };

  const handleAngleChange = (setter: (v: number) => void) => (value: number) => {
    setter(value);
    if (showTrace) {
      const c1 = Math.cos(theta1);
      const s1 = Math.sin(theta1);
      const c12 = Math.cos(theta1 + theta2);
      const s12 = Math.sin(theta1 + theta2);
      const ex = L1 * c1 + L2 * c12;
      const ey = L1 * s1 + L2 * s12;
      setTrace(prev => [...prev.slice(-200), { x: ex, y: ey }]);
    }
  };

  const applyPreset = (preset: string) => {
    setTrace([]);
    switch (preset) {
      case 'home': setTheta1(0); setTheta2(0); break;
      case 'reach': setTheta1(0.3); setTheta2(-0.1); break;
      case 'fold': setTheta1(Math.PI / 2); setTheta2(Math.PI); break;
      case 'elbow-up': setTheta1(Math.PI / 3); setTheta2(-Math.PI / 3); break;
    }
  };

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Joint Angles</h4>
              <SliderControl
                label={`θ₁ = ${(theta1 * 180 / Math.PI).toFixed(0)}°`}
                value={theta1} onChange={handleAngleChange(setTheta1)}
                min={-Math.PI} max={Math.PI} step={0.02}
                showValue={false}
              />
              <SliderControl
                label={`θ₂ = ${(theta2 * 180 / Math.PI).toFixed(0)}°`}
                value={theta2} onChange={handleAngleChange(setTheta2)}
                min={-Math.PI} max={Math.PI} step={0.02}
                showValue={false}
              />

              <h4 className="font-semibold text-sm pt-2">Link Lengths</h4>
              <SliderControl
                label={`L₁ = ${L1.toFixed(1)}`}
                value={L1} onChange={setL1}
                min={0.5} max={3} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`L₂ = ${L2.toFixed(1)}`}
                value={L2} onChange={setL2}
                min={0.5} max={3} step={0.1}
                showValue={false}
              />

              <div className="flex flex-wrap gap-1">
                <ButtonControl label="Home" onClick={() => applyPreset('home')} variant="outline" size="sm" />
                <ButtonControl label="Reach" onClick={() => applyPreset('reach')} variant="outline" size="sm" />
                <ButtonControl label="Fold" onClick={() => applyPreset('fold')} variant="outline" size="sm" />
                <ButtonControl label="Elbow Up" onClick={() => applyPreset('elbow-up')} variant="outline" size="sm" />
              </div>

              <CheckboxControl label="Show coordinate frames" checked={showFrames} onChange={setShowFrames} />
              <CheckboxControl label="Show workspace boundary" checked={showWorkspace} onChange={setShowWorkspace} />
              <CheckboxControl label="Trace end-effector" checked={showTrace} onChange={(v) => { setShowTrace(v); if (!v) setTrace([]); }} />

              <ResultDisplay title="End-Effector Position">
                <div className="space-y-1">
                  <div>
                    <span className="text-base-content/60">x = </span>
                    <span className="text-primary font-bold">{endEffector.x.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-base-content/60">y = </span>
                    <span className="text-primary font-bold">{endEffector.y.toFixed(3)}</span>
                  </div>
                  <div className="border-t border-base-content/10 pt-1">
                    <span className="text-base-content/60">orientation = </span>
                    {((theta1 + theta2) * 180 / Math.PI).toFixed(1)}°
                  </div>
                </div>
              </ResultDisplay>

              <MatrixDisplay
                title="T₀² (Base to End-Effector)"
                matrix={T02}
                precision={2}
              />
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Start at "Home" (both angles zero) to see the arm fully extended.
          Then adjust θ₂ to bend the elbow. Enable "Trace" and sweep θ₁ to see the end-effector
          trace an arc. Enable "Workspace" to see the full reachable region.
        </p>
      </div>
    </div>
  );
}
