import { useState } from 'react';
import Canvas3D, { createCoordinateFrame } from '../core/Canvas3D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, SelectControl } from '../core/Controls';
import * as THREE from 'three';

/**
 * QuaternionViz - Interactive 3D visualization of quaternion SLERP interpolation
 * Demonstrates smooth interpolation between two orientations using quaternions.
 */

interface OrientationPreset {
  label: string;
  start: { axis: [number, number, number]; angle: number };
  end: { axis: [number, number, number]; angle: number };
}

const presets: Record<string, OrientationPreset> = {
  z_rotation: {
    label: 'Z-axis rotation (0° → 120°)',
    start: { axis: [0, 0, 1], angle: 0 },
    end: { axis: [0, 0, 1], angle: 120 },
  },
  x_to_z: {
    label: 'X-axis 90° → Z-axis 90°',
    start: { axis: [1, 0, 0], angle: 90 },
    end: { axis: [0, 0, 1], angle: 90 },
  },
  opposite: {
    label: 'Identity → 180° about X',
    start: { axis: [1, 0, 0], angle: 0 },
    end: { axis: [1, 0, 0], angle: 180 },
  },
  complex: {
    label: 'Y −90° → Y +90°',
    start: { axis: [0, 1, 0], angle: -90 },
    end: { axis: [0, 1, 0], angle: 90 },
  },
};

function axisAngleToQuaternion(axis: [number, number, number], angleDeg: number): THREE.Quaternion {
  const angleRad = (angleDeg * Math.PI) / 180;
  const axisVec = new THREE.Vector3(...axis).normalize();
  const q = new THREE.Quaternion();
  q.setFromAxisAngle(axisVec, angleRad);
  return q;
}

function quaternionToAxisAngle(q: THREE.Quaternion): { axis: [number, number, number]; angle: number } {
  const angle = 2 * Math.acos(Math.min(1, Math.max(-1, q.w)));
  const sinHalf = Math.sin(angle / 2);
  if (sinHalf < 1e-6) {
    return { axis: [0, 0, 1], angle: 0 };
  }
  return {
    axis: [q.x / sinHalf, q.y / sinHalf, q.z / sinHalf],
    angle: (angle * 180) / Math.PI,
  };
}

export default function QuaternionViz() {
  const [presetKey, setPresetKey] = useState('z_rotation');
  const [t, setT] = useState(0);
  const [showGhosts, setShowGhosts] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [showWorldFrame, setShowWorldFrame] = useState(true);

  const preset = presets[presetKey];

  // Build quaternions
  const q0 = axisAngleToQuaternion(preset.start.axis, preset.start.angle);
  const q1 = axisAngleToQuaternion(preset.end.axis, preset.end.angle);

  // Ensure shortest path
  if (q0.dot(q1) < 0) {
    q1.set(-q1.x, -q1.y, -q1.z, -q1.w);
  }

  // SLERP
  const qCurrent = new THREE.Quaternion();
  qCurrent.slerpQuaternions(q0, q1, t);

  // Extract display values
  const currentAxisAngle = quaternionToAxisAngle(qCurrent);
  const slerpAngle = 2 * Math.acos(Math.min(1, Math.abs(q0.dot(q1)))) * (180 / Math.PI);

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
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        if ('geometry' in obj) obj.geometry.dispose();
        if ('material' in obj) {
          const material = obj.material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      }
      scene.remove(obj);
    });

    const markDynamic = (obj: THREE.Object3D) => {
      obj.userData.isDynamic = true;
      obj.traverse((child) => { child.userData.isDynamic = true; });
    };

    // World frame
    if (showWorldFrame) {
      const worldFrame = createCoordinateFrame(2);
      markDynamic(worldFrame);
      scene.add(worldFrame);
    }

    // Ghost: start orientation
    if (showGhosts) {
      const startFrame = createCoordinateFrame(1.2);
      startFrame.quaternion.copy(q0);
      markDynamic(startFrame);
      scene.add(startFrame);

      const startBox = createGhostBox(q0, 0x88aaff, 0.08);
      markDynamic(startBox);
      scene.add(startBox);

      // Ghost: end orientation
      const endFrame = createCoordinateFrame(1.2);
      endFrame.quaternion.copy(q1);
      markDynamic(endFrame);
      scene.add(endFrame);

      const endBox = createGhostBox(q1, 0xffaa88, 0.08);
      markDynamic(endBox);
      scene.add(endBox);
    }

    // SLERP path: trail of small spheres
    if (showPath) {
      const pathSteps = 20;
      for (let i = 0; i <= pathSteps; i++) {
        const pathT = i / pathSteps;
        const pathQ = new THREE.Quaternion();
        pathQ.slerpQuaternions(q0, q1, pathT);

        // Place a small sphere at the tip of the X-axis of the rotated frame
        const tipPos = new THREE.Vector3(1.4, 0, 0).applyQuaternion(pathQ);
        const dotGeom = new THREE.SphereGeometry(0.03, 6, 6);
        const dotMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().lerpColors(new THREE.Color(0x88aaff), new THREE.Color(0xffaa88), pathT),
          transparent: true,
          opacity: 0.6,
        });
        const dot = new THREE.Mesh(dotGeom, dotMat);
        dot.position.copy(tipPos);
        markDynamic(dot);
        scene.add(dot);
      }
    }

    // Current interpolated orientation: solid box + frame
    const currentFrame = createCoordinateFrame(1.5);
    currentFrame.quaternion.copy(qCurrent);
    markDynamic(currentFrame);
    scene.add(currentFrame);

    const boxGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.quaternion.copy(qCurrent);
    markDynamic(box);
    scene.add(box);

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });
    const edges = new THREE.LineSegments(boxEdges, edgeMaterial);
    edges.quaternion.copy(qCurrent);
    markDynamic(edges);
    scene.add(edges);
  };

  const createGhostBox = (q: THREE.Quaternion, color: number, opacity: number) => {
    const group = new THREE.Group();

    const boxGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 3,
    });
    const edges = new THREE.LineSegments(boxEdges, edgeMaterial);
    edges.quaternion.copy(q);
    group.add(edges);

    return group;
  };

  const presetOptions = Object.entries(presets).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

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
            Drag to orbit &nbsp;|&nbsp; Scroll to zoom
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:self-start">
          <Controls>
            <div className="space-y-3">
              <SelectControl
                label="Orientation pair"
                value={presetKey}
                onChange={(v) => { setPresetKey(v); setT(0); }}
                options={presetOptions}
              />

              <SliderControl
                label={`SLERP t = ${t.toFixed(2)}`}
                value={t} onChange={setT}
                min={0} max={1} step={0.01}
                showValue={false}
              />

              <CheckboxControl label="Show start/end ghosts" checked={showGhosts} onChange={setShowGhosts} />
              <CheckboxControl label="Show SLERP path" checked={showPath} onChange={setShowPath} />
              <CheckboxControl label="Show world frame" checked={showWorldFrame} onChange={setShowWorldFrame} />

              <ResultDisplay title="Current Quaternion">
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div><span className="text-base-content/50">w:</span> {qCurrent.w.toFixed(3)}</div>
                    <div><span className="text-base-content/50">x:</span> {qCurrent.x.toFixed(3)}</div>
                    <div><span className="text-base-content/50">y:</span> {qCurrent.y.toFixed(3)}</div>
                    <div><span className="text-base-content/50">z:</span> {qCurrent.z.toFixed(3)}</div>
                  </div>
                  <div className="border-t border-base-content/10 pt-1 text-xs">
                    <div>
                      <span className="text-base-content/50">Angle: </span>
                      {currentAxisAngle.angle.toFixed(1)}°
                    </div>
                    <div>
                      <span className="text-base-content/50">Axis: </span>
                      ({currentAxisAngle.axis[0].toFixed(2)}, {currentAxisAngle.axis[1].toFixed(2)}, {currentAxisAngle.axis[2].toFixed(2)})
                    </div>
                  </div>
                  <div className="border-t border-base-content/10 pt-1 text-xs">
                    <span className="text-base-content/50">Total SLERP angle: </span>
                    {slerpAngle.toFixed(1)}°
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Scrub the SLERP slider from 0 to 1 and watch the box rotate smoothly
          along the shortest path. The colored dots trace the path of the X-axis tip — always a great-circle
          arc. Try different presets to see how SLERP handles various start/end orientations.
        </p>
      </div>
    </div>
  );
}
