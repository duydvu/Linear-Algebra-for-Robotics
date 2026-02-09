import { useState } from 'react';
import Canvas2D, { drawAxes, drawGrid, drawVector, worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl } from '../core/Controls';
import * as vec from '../../../lib/math/vector';

/**
 * VectorAddition - Interactive visualization of vector addition
 * Demonstrates: c = a + b
 */
export default function VectorAddition() {
  const [vectorA, setVectorA] = useState({ x: 2, y: 1.5 });
  const [vectorB, setVectorB] = useState({ x: -1, y: 2 });
  const [showGrid, setShowGrid] = useState(true);
  const [showComponents, setShowComponents] = useState(true);

  // Calculate resultant vector
  const resultant = vec.add(vectorA, vectorB);

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 50; // pixels per unit

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Draw grid
    if (showGrid) {
      drawGrid(p, scale, '#f0f0f0');
    }

    // Draw axes
    drawAxes(p, originX, originY, scale);

    // Convert vectors to screen space
    const aScreen = worldToScreen(vectorA.x, vectorA.y, originX, originY, scale);
    const bScreen = worldToScreen(vectorB.x, vectorB.y, originX, originY, scale);
    const rScreen = worldToScreen(resultant.x, resultant.y, originX, originY, scale);

    // Draw vectors from origin
    // Vector A (blue)
    drawVector(
      p,
      originX,
      originY,
      aScreen.x - originX,
      aScreen.y - originY,
      [0, 100, 255],
      'a'
    );

    // Vector B (green) - from origin
    drawVector(
      p,
      originX,
      originY,
      bScreen.x - originX,
      bScreen.y - originY,
      [0, 200, 100],
      'b'
    );

    // Show vector addition visually: a + b
    if (showComponents) {
      // Draw B starting from tip of A (to show addition)
      p.push();
      p.stroke(0, 200, 100, 150);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([5, 5]);
      drawVector(
        p,
        aScreen.x,
        aScreen.y,
        bScreen.x - originX,
        bScreen.y - originY,
        [0, 200, 100, 150]
      );
      p.drawingContext.setLineDash([]);
      p.pop();
    }

    // Resultant vector (red)
    drawVector(
      p,
      originX,
      originY,
      rScreen.x - originX,
      rScreen.y - originY,
      [255, 50, 50],
      'a + b'
    );

    // Add labels
    p.push();
    p.fill(0);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Drag the sliders to change vectors', 10, 10);
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
                  label="Show vector components"
                  checked={showComponents}
                  onChange={setShowComponents}
                />
              </div>

              <ResultDisplay title="Results">
                <div className="space-y-2">
                  <div>
                    <strong>Vector a:</strong> ({vectorA.x.toFixed(2)}, {vectorA.y.toFixed(2)})
                  </div>
                  <div>
                    <strong>Vector b:</strong> ({vectorB.x.toFixed(2)}, {vectorB.y.toFixed(2)})
                  </div>
                  <div className="text-primary font-semibold">
                    <strong>a + b:</strong> ({resultant.x.toFixed(2)}, {resultant.y.toFixed(2)})
                  </div>
                  <div className="text-sm mt-2 pt-2 border-t">
                    <div>|a| = {vec.magnitude(vectorA).toFixed(3)}</div>
                    <div>|b| = {vec.magnitude(vectorB).toFixed(3)}</div>
                    <div>|a + b| = {vec.magnitude(resultant).toFixed(3)}</div>
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Tip:</strong> Vector addition follows the parallelogram rule. The dashed green
          vector shows how vector <strong>b</strong> is placed at the tip of vector <strong>a</strong>.
          The resultant (red) goes from the origin to the final point.
        </p>
      </div>
    </div>
  );
}
