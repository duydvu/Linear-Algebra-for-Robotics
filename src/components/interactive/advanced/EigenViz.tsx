import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl } from '../core/Controls';
import * as mat from '../../../lib/math/matrix';

/**
 * EigenViz - Interactive visualization of eigenvalues & eigenvectors
 * Shows a symmetric 2×2 matrix transforming the unit circle into an ellipse.
 * Eigenvectors are the ellipse axes; |eigenvalues| are the semi-axis lengths.
 */
export default function EigenViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [d, setD] = useState(1);
  const [showUnitCircle, setShowUnitCircle] = useState(true);
  const [showEigenvectors, setShowEigenvectors] = useState(true);

  // Symmetric matrix [[a, b], [b, d]]
  const matrix = [[a, b], [b, d]];
  const det = mat.determinant(matrix);

  // Eigenvalues (closed-form for 2×2 symmetric)
  const trace = a + d;
  const disc = Math.sqrt((a - d) * (a - d) + 4 * b * b);
  const lambda1 = (trace + disc) / 2;
  const lambda2 = (trace - disc) / 2;

  // Eigenvectors
  let ev1: [number, number];
  let ev2: [number, number];
  if (Math.abs(b) > 1e-8) {
    const mag1 = Math.sqrt(b * b + (lambda1 - a) * (lambda1 - a));
    ev1 = [b / mag1, (lambda1 - a) / mag1];
    const mag2 = Math.sqrt(b * b + (lambda2 - a) * (lambda2 - a));
    ev2 = [b / mag2, (lambda2 - a) / mag2];
  } else {
    // Diagonal matrix: eigenvectors are axis-aligned
    ev1 = a >= d ? [1, 0] : [0, 1];
    ev2 = a >= d ? [0, 1] : [1, 0];
  }

  // Classification
  const isSingular = Math.abs(det) < 0.01;
  const isPositiveDefinite = lambda1 > 0.01 && lambda2 > 0.01;
  const isNegativeDefinite = lambda1 < -0.01 && lambda2 < -0.01;
  const isIndefinite = (lambda1 > 0.01 && lambda2 < -0.01) || (lambda1 < -0.01 && lambda2 > 0.01);

  let classification = '';
  if (isSingular) classification = 'Singular (det ≈ 0)';
  else if (isPositiveDefinite) classification = 'Positive definite';
  else if (isNegativeDefinite) classification = 'Negative definite';
  else if (isIndefinite) classification = 'Indefinite';
  else if (lambda1 >= -0.01 && lambda2 >= -0.01) classification = 'Positive semi-definite';
  else classification = 'Negative semi-definite';

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 60;

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Grid
    p.stroke(230);
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

    // Grid labels
    p.fill(140);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    for (let i = -3; i <= 3; i++) {
      if (i !== 0) {
        p.text(i, originX + i * scale, originY + 14);
        p.text(i, originX - 14, originY - i * scale);
      }
    }

    const numPoints = 64;

    // Unit circle
    if (showUnitCircle) {
      p.noFill();
      p.stroke(100, 150, 255, 120);
      p.strokeWeight(1.5);
      p.drawingContext.setLineDash([5, 5]);
      p.beginShape();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const pt = worldToScreen(Math.cos(angle), Math.sin(angle), originX, originY, scale);
        p.vertex(pt.x, pt.y);
      }
      p.endShape();
      p.drawingContext.setLineDash([]);
    }

    // Transformed ellipse
    p.fill(255, 120, 100, 50);
    p.stroke(220, 80, 60);
    p.strokeWeight(2);
    p.beginShape();
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const transformed = mat.applyToVector(matrix, [cx, cy]);
      const pt = worldToScreen(transformed[0], transformed[1], originX, originY, scale);
      p.vertex(pt.x, pt.y);
    }
    p.endShape(p.CLOSE);

    // Eigenvectors
    if (showEigenvectors) {
      // Eigenvector 1 (scaled by eigenvalue)
      const ev1Len = lambda1;
      const ev1Screen = worldToScreen(ev1[0] * ev1Len, ev1[1] * ev1Len, originX, originY, scale);
      const ev1Neg = worldToScreen(-ev1[0] * ev1Len, -ev1[1] * ev1Len, originX, originY, scale);

      // Draw both directions as a line through origin
      p.stroke(0, 120, 200);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 3]);
      p.line(ev1Neg.x, ev1Neg.y, ev1Screen.x, ev1Screen.y);
      p.drawingContext.setLineDash([]);

      // Arrow in positive direction
      drawArrow(p, originX, originY, ev1Screen.x, ev1Screen.y, [0, 120, 200]);
      p.fill(0, 120, 200);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      const label1X = ev1Screen.x + 8;
      const label1Y = ev1Screen.y - 8;
      p.text(`λ₁=${lambda1.toFixed(2)}`, label1X, label1Y);

      // Eigenvector 2 (scaled by eigenvalue)
      const ev2Len = lambda2;
      const ev2Screen = worldToScreen(ev2[0] * ev2Len, ev2[1] * ev2Len, originX, originY, scale);
      const ev2Neg = worldToScreen(-ev2[0] * ev2Len, -ev2[1] * ev2Len, originX, originY, scale);

      p.stroke(200, 120, 0);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 3]);
      p.line(ev2Neg.x, ev2Neg.y, ev2Screen.x, ev2Screen.y);
      p.drawingContext.setLineDash([]);

      drawArrow(p, originX, originY, ev2Screen.x, ev2Screen.y, [200, 120, 0]);
      p.fill(200, 120, 0);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      const label2X = ev2Screen.x + 8;
      const label2Y = ev2Screen.y - 8;
      p.text(`λ₂=${lambda2.toFixed(2)}`, label2X, label2Y);
    }

    // Singularity warning
    if (isSingular) {
      p.fill(255, 0, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text('SINGULAR — ellipse collapses to a line', p.width / 2, 22);
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
    if (len < 3) return;

    p.stroke(color[0], color[1], color[2]);
    p.strokeWeight(2.5);
    p.line(x1, y1, x2, y2);

    // Arrowhead
    const angle = Math.atan2(dy, dx);
    const arrowSize = 9;
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
      case 'identity': setA(1); setB(0); setD(1); break;
      case 'stretch': setA(3); setB(0); setD(1); break;
      case 'rotated': setA(2); setB(1); setD(1); break;
      case 'singular': setA(2); setB(2); setD(2); break;
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
              <h4 className="font-semibold text-sm">Symmetric Matrix</h4>
              <div className="font-mono text-xs bg-base-300/50 p-2 rounded-lg text-center">
                [ {a.toFixed(1)}, {b.toFixed(1)} ]<br />
                [ {b.toFixed(1)}, {d.toFixed(1)} ]
              </div>
              <SliderControl
                label={`a = ${a.toFixed(1)}`}
                value={a} onChange={setA}
                min={-3} max={3} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`b = ${b.toFixed(1)} (off-diagonal)`}
                value={b} onChange={setB}
                min={-3} max={3} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`d = ${d.toFixed(1)}`}
                value={d} onChange={setD}
                min={-3} max={3} step={0.1}
                showValue={false}
              />

              <div className="flex flex-wrap gap-1">
                <ButtonControl label="Identity" onClick={() => applyPreset('identity')} variant="outline" size="sm" />
                <ButtonControl label="Stretch" onClick={() => applyPreset('stretch')} variant="outline" size="sm" />
                <ButtonControl label="Rotated" onClick={() => applyPreset('rotated')} variant="outline" size="sm" />
                <ButtonControl label="Singular" onClick={() => applyPreset('singular')} variant="outline" size="sm" />
              </div>

              <CheckboxControl label="Show unit circle" checked={showUnitCircle} onChange={setShowUnitCircle} />
              <CheckboxControl label="Show eigenvectors" checked={showEigenvectors} onChange={setShowEigenvectors} />

              <ResultDisplay title="Eigenvalue Analysis">
                <div className="space-y-2">
                  <div>
                    <span className="text-base-content/60">λ₁ = </span>
                    <span className="text-primary font-bold">{lambda1.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-base-content/60">λ₂ = </span>
                    <span className="text-primary font-bold">{lambda2.toFixed(3)}</span>
                  </div>
                  <div className="border-t border-base-content/10 pt-2">
                    <span className="text-base-content/60">v₁ = </span>
                    ({ev1[0].toFixed(3)}, {ev1[1].toFixed(3)})
                  </div>
                  <div>
                    <span className="text-base-content/60">v₂ = </span>
                    ({ev2[0].toFixed(3)}, {ev2[1].toFixed(3)})
                  </div>
                  <div className="border-t border-base-content/10 pt-2">
                    <span className="text-base-content/60">det = </span>{det.toFixed(3)}
                  </div>
                  <div className={`font-semibold ${isSingular ? 'text-error' : isPositiveDefinite ? 'text-success' : isIndefinite ? 'text-warning' : ''}`}>
                    {classification}
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Start with "Identity" (circle maps to circle). Increase <em>a</em> to stretch
          horizontally. Then add off-diagonal <em>b</em> to rotate the eigenvectors. Set "Singular" to see
          the ellipse collapse to a line (λ₂ = 0).
        </p>
      </div>
    </div>
  );
}
