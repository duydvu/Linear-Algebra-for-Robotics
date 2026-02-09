import { useState } from 'react';
import Canvas2D, { drawAxes, drawGrid, drawVector, worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl } from '../core/Controls';
import * as vec from '../../../lib/math/vector';

/**
 * DotProductViz - Interactive visualization of dot product
 * Demonstrates: a · b = |a||b|cos(θ) and vector projection
 */
export default function DotProductViz() {
  const [vectorA, setVectorA] = useState({ x: 3, y: 1 });
  const [vectorB, setVectorB] = useState({ x: 1, y: 2 });
  const [showGrid, setShowGrid] = useState(true);
  const [showProjection, setShowProjection] = useState(true);

  // Calculate dot product and angle
  const dotProduct = vec.dot(vectorA, vectorB);
  const magA = vec.magnitude(vectorA);
  const magB = vec.magnitude(vectorB);
  const angle = vec.angleBetween(vectorA, vectorB);
  const angleDegrees = (angle * 180) / Math.PI;

  // Calculate projection of A onto B
  const projection = vec.project(vectorA, vectorB);

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 50;

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    if (showGrid) {
      drawGrid(p, scale, '#f0f0f0');
    }

    drawAxes(p, originX, originY, scale);

    // Convert to screen space
    const aScreen = worldToScreen(vectorA.x, vectorA.y, originX, originY, scale);
    const bScreen = worldToScreen(vectorB.x, vectorB.y, originX, originY, scale);
    const projScreen = worldToScreen(projection.x, projection.y, originX, originY, scale);

    // Draw vector B (green)
    drawVector(
      p,
      originX,
      originY,
      bScreen.x - originX,
      bScreen.y - originY,
      [0, 200, 100],
      'b'
    );

    // Draw vector A (blue)
    drawVector(
      p,
      originX,
      originY,
      aScreen.x - originX,
      aScreen.y - originY,
      [0, 100, 255],
      'a'
    );

    // Show projection
    if (showProjection) {
      // Draw projection vector (orange)
      drawVector(
        p,
        originX,
        originY,
        projScreen.x - originX,
        projScreen.y - originY,
        [255, 150, 0],
        'proj'
      );

      // Draw perpendicular line from A to projection
      p.push();
      p.stroke(150);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 3]);
      p.line(aScreen.x, aScreen.y, projScreen.x, projScreen.y);
      p.drawingContext.setLineDash([]);
      p.pop();

      // Draw right angle indicator
      const perpSize = 10;
      const dirB = vec.normalize(vectorB);
      const perpDir = { x: -dirB.y, y: dirB.x };
      const corner1 = {
        x: projScreen.x + perpDir.x * perpSize,
        y: projScreen.y + perpDir.y * perpSize
      };
      const corner2 = {
        x: corner1.x + dirB.x * perpSize,
        y: corner1.y + dirB.y * perpSize
      };

      p.push();
      p.stroke(150);
      p.strokeWeight(1);
      p.noFill();
      p.beginShape();
      p.vertex(projScreen.x, projScreen.y);
      p.vertex(corner1.x, corner1.y);
      p.vertex(corner2.x, corner2.y);
      p.endShape();
      p.pop();
    }

    // Draw angle arc
    p.push();
    p.noFill();
    p.stroke(100);
    p.strokeWeight(2);
    const angleA = Math.atan2(vectorA.y, vectorA.x);
    const angleB = Math.atan2(vectorB.y, vectorB.x);
    const startAngle = -Math.max(angleA, angleB);
    const endAngle = -Math.min(angleA, angleB);
    p.arc(originX, originY, 40, 40, startAngle, endAngle);

    // Angle label
    p.fill(100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    const midAngle = (angleA + angleB) / 2;
    const labelX = originX + Math.cos(midAngle) * 60;
    const labelY = originY - Math.sin(midAngle) * 60;
    p.text(`${angleDegrees.toFixed(1)}°`, labelX, labelY);
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
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Vector a (blue)</h3>
                <SliderControl
                  label="x component"
                  value={vectorA.x}
                  onChange={(x) => setVectorA({ ...vectorA, x })}
                  min={-5}
                  max={5}
                  step={0.1}
                />
                <SliderControl
                  label="y component"
                  value={vectorA.y}
                  onChange={(y) => setVectorA({ ...vectorA, y })}
                  min={-5}
                  max={5}
                  step={0.1}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Vector b (green)</h3>
                <SliderControl
                  label="x component"
                  value={vectorB.x}
                  onChange={(x) => setVectorB({ ...vectorB, x })}
                  min={-5}
                  max={5}
                  step={0.1}
                />
                <SliderControl
                  label="y component"
                  value={vectorB.y}
                  onChange={(y) => setVectorB({ ...vectorB, y })}
                  min={-5}
                  max={5}
                  step={0.1}
                />
              </div>

              <div className="border-t pt-4">
                <CheckboxControl
                  label="Show grid"
                  checked={showGrid}
                  onChange={setShowGrid}
                />
                <CheckboxControl
                  label="Show projection"
                  checked={showProjection}
                  onChange={setShowProjection}
                />
              </div>

              <ResultDisplay title="Dot Product Results">
                <div className="space-y-2">
                  <div className="text-lg text-primary font-bold">
                    a · b = {dotProduct.toFixed(3)}
                  </div>
                  <div className="text-sm space-y-1 border-t pt-2 mt-2">
                    <div>|a| = {magA.toFixed(3)}</div>
                    <div>|b| = {magB.toFixed(3)}</div>
                    <div>θ = {angleDegrees.toFixed(2)}° ({angle.toFixed(3)} rad)</div>
                    <div>cos(θ) = {Math.cos(angle).toFixed(3)}</div>
                  </div>
                  <div className="text-xs border-t pt-2 mt-2">
                    <div className="font-semibold mb-1">Verification:</div>
                    <div>|a||b|cos(θ) = {(magA * magB * Math.cos(angle)).toFixed(3)}</div>
                  </div>
                  {showProjection && (
                    <div className="text-xs border-t pt-2 mt-2">
                      <div className="font-semibold mb-1">Projection of a onto b:</div>
                      <div>proj = ({projection.x.toFixed(3)}, {projection.y.toFixed(3)})</div>
                      <div>|proj| = {vec.magnitude(projection).toFixed(3)}</div>
                    </div>
                  )}
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Interpretation:</strong> The dot product measures how much two vectors point in
          the same direction. When perpendicular (90°), the dot product is 0. The projection (orange)
          shows the "shadow" of vector <strong>a</strong> onto vector <strong>b</strong>.
        </p>
      </div>
    </div>
  );
}
