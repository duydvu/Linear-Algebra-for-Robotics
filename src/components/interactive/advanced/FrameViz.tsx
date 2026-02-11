import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, MatrixDisplay } from '../core/Controls';
import { homogeneousTransform2D, transformPoint2D } from '../../../lib/math/transforms';

/**
 * FrameViz - Interactive visualization of 2D coordinate frames
 * Shows frame {A} (world) and frame {B} (body), with a point expressed in both.
 */
export default function FrameViz() {
  const [angle, setAngle] = useState(Math.PI / 4);
  const [tx, setTx] = useState(2);
  const [ty, setTy] = useState(1);
  const [px, setPx] = useState(1);
  const [py, setPy] = useState(0.5);
  const [showFrameA, setShowFrameA] = useState(true);
  const [showFrameB, setShowFrameB] = useState(true);
  const [showPoint, setShowPoint] = useState(true);

  // Build T_B^A (converts from {B} to {A})
  const T = homogeneousTransform2D(angle, tx, ty);

  // Transform point from {B} to {A}
  const pointB = { x: px, y: py };
  const pointA = transformPoint2D(T, pointB);

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 55;

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

    const axisLen = 1.5;

    // Frame {A} — world frame at origin
    if (showFrameA) {
      const aOrigin = worldToScreen(0, 0, originX, originY, scale);

      // X-axis (red)
      const axEnd = worldToScreen(axisLen, 0, originX, originY, scale);
      drawFrameArrow(p, aOrigin.x, aOrigin.y, axEnd.x, axEnd.y, [220, 40, 40]);

      // Y-axis (green)
      const ayEnd = worldToScreen(0, axisLen, originX, originY, scale);
      drawFrameArrow(p, aOrigin.x, aOrigin.y, ayEnd.x, ayEnd.y, [40, 160, 40]);

      // Origin dot
      p.fill(60);
      p.noStroke();
      p.circle(aOrigin.x, aOrigin.y, 8);

      // Label
      p.fill(60);
      p.textSize(14);
      p.textAlign(p.RIGHT, p.TOP);
      p.text('{A}', aOrigin.x - 8, aOrigin.y + 4);
    }

    // Frame {B} — body frame at (tx, ty) rotated by angle
    if (showFrameB) {
      const bOrigin = worldToScreen(tx, ty, originX, originY, scale);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // X-axis of {B} in world coords
      const bxEnd = worldToScreen(tx + axisLen * cosA, ty + axisLen * sinA, originX, originY, scale);
      drawFrameArrow(p, bOrigin.x, bOrigin.y, bxEnd.x, bxEnd.y, [220, 40, 40]);

      // Y-axis of {B} in world coords
      const byEnd = worldToScreen(tx - axisLen * sinA, ty + axisLen * cosA, originX, originY, scale);
      drawFrameArrow(p, bOrigin.x, bOrigin.y, byEnd.x, byEnd.y, [40, 160, 40]);

      // Origin dot
      p.fill(0, 100, 180);
      p.noStroke();
      p.circle(bOrigin.x, bOrigin.y, 8);

      // Label
      p.fill(0, 100, 180);
      p.textSize(14);
      p.textAlign(p.LEFT, p.TOP);
      p.text('{B}', bOrigin.x + 8, bOrigin.y + 4);

      // Dashed line from {A} origin to {B} origin (translation vector)
      const aOrigin = worldToScreen(0, 0, originX, originY, scale);
      p.stroke(0, 100, 180, 80);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([4, 4]);
      p.line(aOrigin.x, aOrigin.y, bOrigin.x, bOrigin.y);
      p.drawingContext.setLineDash([]);
    }

    // Point
    if (showPoint) {
      // Point in frame {A} coordinates (world position)
      const ptScreen = worldToScreen(pointA.x, pointA.y, originX, originY, scale);

      // Draw the point
      p.fill(80, 80, 220);
      p.noStroke();
      p.circle(ptScreen.x, ptScreen.y, 10);

      // Label with both coordinate representations
      p.fill(80, 80, 220);
      p.textSize(11);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text(
        `(${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)})_A`,
        ptScreen.x + 8, ptScreen.y - 2
      );
      p.textAlign(p.LEFT, p.TOP);
      p.fill(0, 100, 180);
      p.text(
        `(${px.toFixed(1)}, ${py.toFixed(1)})_B`,
        ptScreen.x + 8, ptScreen.y + 6
      );

      // Dashed line from {A} origin to point (coordinates in A)
      if (showFrameA) {
        const aOrigin = worldToScreen(0, 0, originX, originY, scale);
        p.stroke(80, 80, 220, 80);
        p.strokeWeight(1);
        p.drawingContext.setLineDash([3, 3]);
        p.line(aOrigin.x, aOrigin.y, ptScreen.x, ptScreen.y);
        p.drawingContext.setLineDash([]);
      }

      // Dashed line from {B} origin to point (coordinates in B)
      if (showFrameB) {
        const bOrigin = worldToScreen(tx, ty, originX, originY, scale);
        p.stroke(0, 100, 180, 80);
        p.strokeWeight(1);
        p.drawingContext.setLineDash([3, 3]);
        p.line(bOrigin.x, bOrigin.y, ptScreen.x, ptScreen.y);
        p.drawingContext.setLineDash([]);
      }
    }
  };

  const drawFrameArrow = (
    p: any,
    x1: number, y1: number,
    x2: number, y2: number,
    color: [number, number, number]
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;

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

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Frame {'{B}'} relative to {'{A}'}</h4>
              <SliderControl
                label={`Rotation: ${(angle * 180 / Math.PI).toFixed(0)}°`}
                value={angle} onChange={setAngle}
                min={-Math.PI} max={Math.PI} step={0.05}
                showValue={false}
              />
              <SliderControl
                label={`tₓ = ${tx.toFixed(1)}`}
                value={tx} onChange={setTx}
                min={-3} max={3} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`tᵧ = ${ty.toFixed(1)}`}
                value={ty} onChange={setTy}
                min={-3} max={3} step={0.1}
                showValue={false}
              />

              <h4 className="font-semibold text-sm pt-2">Point in frame {'{B}'}</h4>
              <SliderControl
                label={`pₓ = ${px.toFixed(1)}`}
                value={px} onChange={setPx}
                min={-2} max={2} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`pᵧ = ${py.toFixed(1)}`}
                value={py} onChange={setPy}
                min={-2} max={2} step={0.1}
                showValue={false}
              />

              <CheckboxControl label="Show frame {A}" checked={showFrameA} onChange={setShowFrameA} />
              <CheckboxControl label="Show frame {B}" checked={showFrameB} onChange={setShowFrameB} />
              <CheckboxControl label="Show point" checked={showPoint} onChange={setShowPoint} />

              <MatrixDisplay
                title="Transform T_B^A"
                matrix={T}
                precision={2}
              />

              <ResultDisplay title="Point Coordinates">
                <div className="space-y-1">
                  <div>
                    In {'{A}'}: <span className="text-primary font-bold">({pointA.x.toFixed(2)}, {pointA.y.toFixed(2)})</span>
                  </div>
                  <div>
                    In {'{B}'}: <span className="font-bold" style={{ color: '#0064b4' }}>({px.toFixed(2)}, {py.toFixed(2)})</span>
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Move frame {'{B}'} around and watch how the same physical point
          has different coordinates in each frame. The transform T_B^A converts coordinates
          from {'{B}'} to {'{A}'}: multiply T_B^A by the point's {'{B}'}-coordinates to get its {'{A}'}-coordinates.
        </p>
      </div>
    </div>
  );
}
