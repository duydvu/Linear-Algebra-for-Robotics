import { useState } from 'react';
import Canvas2D, { worldToScreen } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, SelectControl, MatrixDisplay } from '../core/Controls';
import * as mat from '../../../lib/math/matrix';
import { rotationMatrix2D, scalingMatrix, transformPoint2D } from '../../../lib/math/transforms';

/**
 * Transform2DViz - Interactive visualization of 2D transformations
 * Demonstrates: rotation, translation, scaling, and composition order
 */
export default function Transform2DViz() {
  const [theta, setTheta] = useState(Math.PI / 6);
  const [tx, setTx] = useState(1.0);
  const [ty, setTy] = useState(0.5);
  const [sx, setSx] = useState(1.0);
  const [sy, setSy] = useState(1.0);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showIndividual, setShowIndividual] = useState(false);
  const [transformOrder, setTransformOrder] = useState('RST');

  // L-shape vertices
  const lShape = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.5 },
    { x: 0.5, y: 0.5 }, { x: 0.5, y: 1.5 }, { x: 0, y: 1.5 }
  ];

  // Build individual 3x3 transformation matrices
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const rotMatrix: mat.Matrix = [
    [cosT, -sinT, 0],
    [sinT, cosT, 0],
    [0, 0, 1]
  ];
  const scaleMatrix: mat.Matrix = [
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1]
  ];
  const transMatrix: mat.Matrix = [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1]
  ];

  // Compose based on selected order (applied right-to-left)
  let composite: mat.Matrix;
  let step1Matrix: mat.Matrix;
  let step2Matrix: mat.Matrix;
  let step1Label: string;
  let step2Label: string;

  if (transformOrder === 'RST') {
    // Translate last, Scale middle, Rotate first
    step1Matrix = rotMatrix;
    step2Matrix = mat.multiply(scaleMatrix, rotMatrix);
    composite = mat.multiply(transMatrix, step2Matrix);
    step1Label = 'After Rotation';
    step2Label = 'After Rotation + Scale';
  } else if (transformOrder === 'TSR') {
    // Rotate last, Scale middle, Translate first
    step1Matrix = transMatrix;
    step2Matrix = mat.multiply(scaleMatrix, transMatrix);
    composite = mat.multiply(rotMatrix, step2Matrix);
    step1Label = 'After Translation';
    step2Label = 'After Translation + Scale';
  } else {
    // STR: Rotate last, Translate middle, Scale first
    step1Matrix = scaleMatrix;
    step2Matrix = mat.multiply(transMatrix, scaleMatrix);
    composite = mat.multiply(rotMatrix, step2Matrix);
    step1Label = 'After Scale';
    step2Label = 'After Scale + Translation';
  }

  // Transform shape vertices
  const transformShape = (shape: { x: number; y: number }[], T: mat.Matrix) =>
    shape.map(pt => transformPoint2D(T, pt));

  const transformedShape = transformShape(lShape, composite);
  const step1Shape = transformShape(lShape, step1Matrix);
  const step2Shape = transformShape(lShape, step2Matrix);

  // Compute center of transformed shape
  const center = transformedShape.reduce(
    (acc, pt) => ({ x: acc.x + pt.x / transformedShape.length, y: acc.y + pt.y / transformedShape.length }),
    { x: 0, y: 0 }
  );

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 50;

  const drawShape = (p: any, shape: { x: number; y: number }[], fillColor: number[], strokeColor: number[]) => {
    p.fill(fillColor[0], fillColor[1], fillColor[2], fillColor[3] ?? 100);
    p.stroke(strokeColor[0], strokeColor[1], strokeColor[2]);
    p.strokeWeight(2);
    p.beginShape();
    shape.forEach(pt => {
      const screen = worldToScreen(pt.x, pt.y, originX, originY, scale);
      p.vertex(screen.x, screen.y);
    });
    p.endShape(p.CLOSE);
  };

  const drawFrameArrows = (p: any, px: number, py: number, angle: number, arrowLen: number = 0.6) => {
    const screen = worldToScreen(px, py, originX, originY, scale);
    // x-axis (red)
    const xEnd = worldToScreen(
      px + arrowLen * Math.cos(angle),
      py + arrowLen * Math.sin(angle),
      originX, originY, scale
    );
    p.stroke(220, 50, 50);
    p.strokeWeight(2);
    p.line(screen.x, screen.y, xEnd.x, xEnd.y);
    // y-axis (green)
    const yEnd = worldToScreen(
      px + arrowLen * Math.cos(angle + Math.PI / 2),
      py + arrowLen * Math.sin(angle + Math.PI / 2),
      originX, originY, scale
    );
    p.stroke(50, 180, 50);
    p.line(screen.x, screen.y, yEnd.x, yEnd.y);
  };

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
    p.stroke(150);
    p.strokeWeight(2);
    p.line(0, originY, p.width, originY);
    p.line(originX, 0, originX, p.height);

    // Draw original shape
    if (showOriginal) {
      drawShape(p, lShape, [100, 100, 255, 80], [80, 80, 200]);

      // Label
      p.fill(80, 80, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      const labelScreen = worldToScreen(0.5, 0.75, originX, originY, scale);
      p.text('Original', labelScreen.x, labelScreen.y);
    }

    // Draw intermediate steps
    if (showIndividual) {
      drawShape(p, step1Shape, [100, 200, 100, 60], [80, 170, 80]);
      p.fill(80, 170, 80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      const s1Center = step1Shape.reduce(
        (acc, pt) => ({ x: acc.x + pt.x / step1Shape.length, y: acc.y + pt.y / step1Shape.length }),
        { x: 0, y: 0 }
      );
      const s1Screen = worldToScreen(s1Center.x, s1Center.y, originX, originY, scale);
      p.text(step1Label, s1Screen.x, s1Screen.y);

      drawShape(p, step2Shape, [255, 180, 50, 60], [220, 150, 30]);
      p.fill(220, 150, 30);
      p.noStroke();
      p.textSize(10);
      const s2Center = step2Shape.reduce(
        (acc, pt) => ({ x: acc.x + pt.x / step2Shape.length, y: acc.y + pt.y / step2Shape.length }),
        { x: 0, y: 0 }
      );
      const s2Screen = worldToScreen(s2Center.x, s2Center.y, originX, originY, scale);
      p.text(step2Label, s2Screen.x, s2Screen.y);
    }

    // Draw final transformed shape
    drawShape(p, transformedShape, [255, 100, 100, 100], [200, 60, 60]);
    p.fill(200, 60, 60);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    const tScreen = worldToScreen(center.x, center.y, originX, originY, scale);
    p.text('Transformed', tScreen.x, tScreen.y);

    // Draw coordinate frame at transformed origin
    const transformedOrigin = transformPoint2D(composite, { x: 0, y: 0 });
    const transformAngle = Math.atan2(composite[1][0], composite[0][0]);
    drawFrameArrows(p, transformedOrigin.x, transformedOrigin.y, transformAngle);

    // Grid labels
    p.fill(120);
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

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas2D width={width} height={height} draw={draw} />
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <SliderControl
              label={`Rotation: ${(theta * 180 / Math.PI).toFixed(1)}°`}
              value={theta}
              onChange={setTheta}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />
            <SliderControl
              label="Translation X"
              value={tx}
              onChange={setTx}
              min={-3}
              max={3}
              step={0.1}
            />
            <SliderControl
              label="Translation Y"
              value={ty}
              onChange={setTy}
              min={-3}
              max={3}
              step={0.1}
            />
            <SliderControl
              label="Scale X"
              value={sx}
              onChange={setSx}
              min={0.1}
              max={3}
              step={0.1}
            />
            <SliderControl
              label="Scale Y"
              value={sy}
              onChange={setSy}
              min={0.1}
              max={3}
              step={0.1}
            />

            <SelectControl
              label="Composition Order"
              value={transformOrder}
              onChange={setTransformOrder}
              options={[
                { value: 'RST', label: 'Rotate → Scale → Translate' },
                { value: 'TSR', label: 'Translate → Scale → Rotate' },
                { value: 'STR', label: 'Scale → Translate → Rotate' }
              ]}
            />

            <CheckboxControl
              label="Show original shape"
              checked={showOriginal}
              onChange={setShowOriginal}
            />
            <CheckboxControl
              label="Show intermediate steps"
              checked={showIndividual}
              onChange={setShowIndividual}
            />

            <MatrixDisplay
              title="Composite Matrix"
              matrix={composite}
              precision={3}
              highlight
            />

            <ResultDisplay title="Transformed Center">
              <div>x: {center.x.toFixed(3)}, y: {center.y.toFixed(3)}</div>
            </ResultDisplay>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Change the composition order and notice how
          "Rotate then Translate" gives a different result from "Translate then Rotate".
          In robotics, getting this order wrong can send your robot to the wrong position.
        </p>
      </div>
    </div>
  );
}
