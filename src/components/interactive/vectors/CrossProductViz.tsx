import { useState } from 'react';
import Canvas3D, { createVectorArrow, createCoordinateFrame } from '../core/Canvas3D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl } from '../core/Controls';
import * as vec from '../../../lib/math/vector';
import * as THREE from 'three';

/**
 * CrossProductViz - Interactive 3D visualization of cross product
 * Demonstrates: a × b = perpendicular vector with magnitude |a||b|sin(θ)
 */
export default function CrossProductViz() {
  const [vectorA, setVectorA] = useState({ x: 1, y: 0.5, z: 0 });
  const [vectorB, setVectorB] = useState({ x: 0, y: 1, z: 0.5 });
  const [showAxes, setShowAxes] = useState(true);
  const [showParallelogram, setShowParallelogram] = useState(true);

  // Calculate cross product
  const crossProduct = vec.cross(vectorA, vectorB);
  const magA = vec.magnitude(vectorA);
  const magB = vec.magnitude(vectorB);
  const magCross = vec.magnitude(crossProduct);
  const angle = vec.angleBetween(vectorA, vectorB);
  const angleDegrees = (angle * 180) / Math.PI;

  // Verify magnitude formula
  const expectedMag = magA * magB * Math.sin(angle);

  const setup = (scene: THREE.Scene) => {
    // Add coordinate frame
    if (showAxes) {
      const axes = createCoordinateFrame(2);
      scene.add(axes);
    }

    // Add grid
    const grid = new THREE.GridHelper(4, 8, 0xcccccc, 0xeeeeee);
    scene.add(grid);
  };

  const animate = (scene: THREE.Scene) => {
    // Clear previous vectors
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (object.userData.isVector || object.userData.isParallelogram) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach((obj) => scene.remove(obj));

    // Vector A (blue)
    const arrowA = createVectorArrow(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(vectorA.x, vectorA.y, vectorA.z),
      magA,
      0x0066ff
    );
    arrowA.userData.isVector = true;
    scene.add(arrowA);

    // Vector B (green)
    const arrowB = createVectorArrow(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(vectorB.x, vectorB.y, vectorB.z),
      magB,
      0x00cc66
    );
    arrowB.userData.isVector = true;
    scene.add(arrowB);

    // Cross product (red)
    if (magCross > 0.01) {
      const arrowCross = createVectorArrow(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(crossProduct.x, crossProduct.y, crossProduct.z),
        magCross,
        0xff3333
      );
      arrowCross.userData.isVector = true;
      scene.add(arrowCross);
    }

    // Show parallelogram
    if (showParallelogram && magA > 0.01 && magB > 0.01) {
      const parallelogramGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        vectorA.x, vectorA.y, vectorA.z,
        vectorA.x + vectorB.x, vectorA.y + vectorB.y, vectorA.z + vectorB.z,
        vectorB.x, vectorB.y, vectorB.z
      ]);
      const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
      parallelogramGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      parallelogramGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
      parallelogramGeometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const parallelogram = new THREE.Mesh(parallelogramGeometry, material);
      parallelogram.userData.isParallelogram = true;
      scene.add(parallelogram);

      // Outline
      const edges = new THREE.EdgesGeometry(parallelogramGeometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 })
      );
      line.userData.isParallelogram = true;
      scene.add(line);
    }
  };

  return (
    <div className="interactive-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Canvas3D
            width={500}
            height={400}
            setup={setup}
            animate={animate}
            cameraPosition={[4, 3, 4]}
          />
          <div className="mt-2 text-xs text-base-content/60 text-center">
            Use mouse to rotate view • Scroll to zoom
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
        <Controls>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Vector a (blue)</h3>
              <SliderControl
                label="x"
                value={vectorA.x}
                onChange={(x) => setVectorA({ ...vectorA, x })}
                min={-2}
                max={2}
                step={0.1}
              />
              <SliderControl
                label="y"
                value={vectorA.y}
                onChange={(y) => setVectorA({ ...vectorA, y })}
                min={-2}
                max={2}
                step={0.1}
              />
              <SliderControl
                label="z"
                value={vectorA.z}
                onChange={(z) => setVectorA({ ...vectorA, z })}
                min={-2}
                max={2}
                step={0.1}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Vector b (green)</h3>
              <SliderControl
                label="x"
                value={vectorB.x}
                onChange={(x) => setVectorB({ ...vectorB, x })}
                min={-2}
                max={2}
                step={0.1}
              />
              <SliderControl
                label="y"
                value={vectorB.y}
                onChange={(y) => setVectorB({ ...vectorB, y })}
                min={-2}
                max={2}
                step={0.1}
              />
              <SliderControl
                label="z"
                value={vectorB.z}
                onChange={(z) => setVectorB({ ...vectorB, z })}
                min={-2}
                max={2}
                step={0.1}
              />
            </div>

            <div className="border-t pt-4">
              <CheckboxControl
                label="Show coordinate axes"
                checked={showAxes}
                onChange={setShowAxes}
              />
              <CheckboxControl
                label="Show parallelogram"
                checked={showParallelogram}
                onChange={setShowParallelogram}
              />
            </div>

            <ResultDisplay title="Cross Product Results">
              <div className="space-y-2">
                <div className="text-primary font-bold">
                  <div>a × b = ({crossProduct.x.toFixed(3)}, {crossProduct.y.toFixed(3)}, {crossProduct.z.toFixed(3)})</div>
                </div>
                <div className="text-sm space-y-1 border-t pt-2 mt-2">
                  <div>|a| = {magA.toFixed(3)}</div>
                  <div>|b| = {magB.toFixed(3)}</div>
                  <div>|a × b| = {magCross.toFixed(3)}</div>
                  <div>θ = {angleDegrees.toFixed(2)}°</div>
                  <div>sin(θ) = {Math.sin(angle).toFixed(3)}</div>
                </div>
                <div className="text-xs border-t pt-2 mt-2">
                  <div className="font-semibold mb-1">Verification:</div>
                  <div>|a||b|sin(θ) = {expectedMag.toFixed(3)}</div>
                </div>
                <div className="text-xs border-t pt-2 mt-2">
                  <div className="font-semibold mb-1">Properties:</div>
                  <div>a · (a × b) = {vec.dot(vectorA, crossProduct).toFixed(6)}</div>
                  <div>b · (a × b) = {vec.dot(vectorB, crossProduct).toFixed(6)}</div>
                  <div className="text-base-content/60">(both should be ≈ 0)</div>
                </div>
              </div>
            </ResultDisplay>
          </div>
        </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70 space-y-2">
        <p>
          <strong>Right-hand rule:</strong> Point your fingers along vector <strong>a</strong>,
          curl them toward vector <strong>b</strong>, and your thumb points in the direction of <strong>a × b</strong>.
        </p>
        <p>
          <strong>Geometric meaning:</strong> The magnitude of the cross product equals the area
          of the parallelogram formed by the two vectors (shown in yellow).
        </p>
      </div>
    </div>
  );
}
