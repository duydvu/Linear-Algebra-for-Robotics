import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Canvas3DProps {
  width?: number;
  height?: number;
  setup?: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
  animate?: (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
  backgroundColor?: number;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
  className?: string;
}

/**
 * Canvas3D - Wrapper component for Three.js
 * Provides a 3D canvas for visualizations with camera controls
 */
export default function Canvas3D({
  width = 600,
  height = 400,
  setup,
  animate,
  backgroundColor = 0xf0f0f0,
  cameraPosition = [5, 5, 5],
  enableControls = true,
  className = ''
}: Canvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Store callbacks in refs so they can be updated without recreating scene
  const setupRef = useRef(setup);
  const animateRef = useRef(animate);

  // Update refs when callbacks change
  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  // Create Three.js scene only once
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(...cameraPosition);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    let controls: OrbitControls | null = null;
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 50;
      controlsRef.current = controls;
    }

    // Add default lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Call custom setup
    setupRef.current?.(scene, camera, renderer);

    // Animation loop
    const animateLoop = () => {
      animationIdRef.current = requestAnimationFrame(animateLoop);

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Call custom animate (using latest version from ref)
      animateRef.current?.(scene, camera, renderer);

      // Render
      renderer.render(scene, camera);
    };

    animateLoop();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const parentWidth = containerRef.current.clientWidth;
      if (parentWidth < width) {
        const scale = parentWidth / width;
        const newWidth = parentWidth;
        const newHeight = height * scale;

        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount only
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      // Dispose of scene objects
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [width, height, backgroundColor, cameraPosition, enableControls]); // Only recreate if these change

  return (
    <div
      ref={containerRef}
      className={`canvas-3d-container ${className}`}
      style={{ width: '100%', maxWidth: width }}
    />
  );
}

/**
 * Utility functions for common Three.js operations
 */

/**
 * Create a coordinate frame (axes helper)
 */
export function createCoordinateFrame(size: number = 1): THREE.Object3D {
  const group = new THREE.Group();

  // X-axis (red)
  const xGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(size, 0, 0)
  ]);
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
  const xLine = new THREE.Line(xGeometry, xMaterial);
  group.add(xLine);

  // X-axis arrow
  const xArrow = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.05, size * 0.15, 8),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  xArrow.position.set(size, 0, 0);
  xArrow.rotation.z = -Math.PI / 2;
  group.add(xArrow);

  // Y-axis (green)
  const yGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, size, 0)
  ]);
  const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
  const yLine = new THREE.Line(yGeometry, yMaterial);
  group.add(yLine);

  // Y-axis arrow
  const yArrow = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.05, size * 0.15, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  yArrow.position.set(0, size, 0);
  group.add(yArrow);

  // Z-axis (blue)
  const zGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, size)
  ]);
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
  const zLine = new THREE.Line(zGeometry, zMaterial);
  group.add(zLine);

  // Z-axis arrow
  const zArrow = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.05, size * 0.15, 8),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  zArrow.position.set(0, 0, size);
  zArrow.rotation.x = Math.PI / 2;
  group.add(zArrow);

  return group;
}

/**
 * Create a grid helper
 */
export function createGrid(size: number = 10, divisions: number = 10, color: number = 0x888888): THREE.GridHelper {
  return new THREE.GridHelper(size, divisions, color, color);
}

/**
 * Create a vector arrow
 */
export function createVectorArrow(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  color: number = 0x0000ff
): THREE.ArrowHelper {
  const normalizedDir = direction.clone().normalize();
  return new THREE.ArrowHelper(normalizedDir, origin, length, color, length * 0.2, length * 0.1);
}

/**
 * Create a robot link (cylinder)
 */
export function createRobotLink(
  length: number,
  radius: number = 0.05,
  color: number = 0x4444ff
): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);

  // Position so it extends along positive Z axis
  mesh.rotation.x = Math.PI / 2;
  mesh.position.z = length / 2;

  return mesh;
}

/**
 * Create a robot joint (sphere)
 */
export function createRobotJoint(
  radius: number = 0.08,
  color: number = 0xff4444
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color });
  return new THREE.Mesh(geometry, material);
}
