import { useState } from 'react';
import Canvas3D, { createCoordinateFrame } from '../core/Canvas3D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl, MatrixDisplay } from '../core/Controls';
import { rotationMatrixFromEuler } from '../../../lib/math/transforms';
import * as THREE from 'three';

/**
 * Rotation3DViz - Interactive 3D visualization of Euler angle rotations
 * Demonstrates: R_x, R_y, R_z, Euler angles (ZYX), gimbal lock
 */
export default function Rotation3DViz() {
  const [roll, setRoll] = useState(0);   // X rotation
  const [pitch, setPitch] = useState(0); // Y rotation
  const [yaw, setYaw] = useState(0);     // Z rotation
  const [showWorldFrame, setShowWorldFrame] = useState(true);
  const [showRotatedFrame, setShowRotatedFrame] = useState(true);
  const [showBox, setShowBox] = useState(true);

  // Compute rotation matrix
  const R = rotationMatrixFromEuler(roll, pitch, yaw);

  // Detect gimbal lock
  const isGimbalLock = Math.abs(Math.abs(pitch) - Math.PI / 2) < 0.08;

  const setup = (scene: THREE.Scene) => {
    // Ground grid
    const grid = new THREE.GridHelper(6, 12, 0xcccccc, 0xeeeeee);
    scene.add(grid);
  };

  const animate = (scene: THREE.Scene) => {
    // Remove previous dynamic objects
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((object) => {
      if (object.userData.isDynamic) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    // World coordinate frame (large, fixed)
    if (showWorldFrame) {
      const worldFrame = createCoordinateFrame(2);
      worldFrame.userData.isDynamic = true;
      worldFrame.traverse(child => { child.userData.isDynamic = true; });
      scene.add(worldFrame);
    }

    // Build THREE.js rotation matrix from our matrix
    const m = new THREE.Matrix4();
    m.set(
      R[0][0], R[0][1], R[0][2], 0,
      R[1][0], R[1][1], R[1][2], 0,
      R[2][0], R[2][1], R[2][2], 0,
      0, 0, 0, 1
    );

    // Rotated coordinate frame (smaller)
    if (showRotatedFrame) {
      const rotatedFrame = createCoordinateFrame(1.5);
      rotatedFrame.applyMatrix4(m);
      rotatedFrame.userData.isDynamic = true;
      rotatedFrame.traverse(child => { child.userData.isDynamic = true; });
      scene.add(rotatedFrame);
    }

    // Semi-transparent box
    if (showBox) {
      const boxGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const boxEdges = new THREE.EdgesGeometry(boxGeometry);

      const boxColor = isGimbalLock ? 0xff4444 : 0x4488ff;
      const boxMaterial = new THREE.MeshBasicMaterial({
        color: boxColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.applyMatrix4(m);
      box.userData.isDynamic = true;
      scene.add(box);

      const edgeMaterial = new THREE.LineBasicMaterial({ color: boxColor, linewidth: 2 });
      const edges = new THREE.LineSegments(boxEdges, edgeMaterial);
      edges.applyMatrix4(m);
      edges.userData.isDynamic = true;
      scene.add(edges);
    }
  };

  const resetAngles = () => {
    setRoll(0);
    setPitch(0);
    setYaw(0);
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
            Drag to orbit  |  Scroll to zoom
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <SliderControl
              label={`Roll (X): ${(roll * 180 / Math.PI).toFixed(1)}°`}
              value={roll}
              onChange={setRoll}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />
            <SliderControl
              label={`Pitch (Y): ${(pitch * 180 / Math.PI).toFixed(1)}°`}
              value={pitch}
              onChange={setPitch}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />
            <SliderControl
              label={`Yaw (Z): ${(yaw * 180 / Math.PI).toFixed(1)}°`}
              value={yaw}
              onChange={setYaw}
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              showValue={false}
            />

            <ButtonControl label="Reset" onClick={resetAngles} variant="outline" />

            <CheckboxControl label="Show world frame" checked={showWorldFrame} onChange={setShowWorldFrame} />
            <CheckboxControl label="Show rotated frame" checked={showRotatedFrame} onChange={setShowRotatedFrame} />
            <CheckboxControl label="Show box" checked={showBox} onChange={setShowBox} />

            {isGimbalLock && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
                <strong>Gimbal Lock!</strong> Pitch is near ±90°. Roll and yaw axes are aligned — one degree of freedom is lost.
              </div>
            )}

            <MatrixDisplay
              title="Rotation Matrix R"
              matrix={R}
              precision={3}
            />

            <ResultDisplay title="Euler Angles (ZYX)">
              <div>Roll (X): {(roll * 180 / Math.PI).toFixed(1)}°</div>
              <div>Pitch (Y): {(pitch * 180 / Math.PI).toFixed(1)}°</div>
              <div>Yaw (Z): {(yaw * 180 / Math.PI).toFixed(1)}°</div>
            </ResultDisplay>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Set pitch to exactly 90° and then change roll and yaw —
          notice they produce the same rotation (gimbal lock). The world frame (large axes) stays
          fixed while the rotated frame (smaller) moves.
        </p>
      </div>
    </div>
  );
}
