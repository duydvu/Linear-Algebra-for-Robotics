import { useEffect, useRef } from 'react';
import type p5 from 'p5';

interface Canvas2DProps {
  width?: number;
  height?: number;
  setup?: (p: p5) => void;
  draw: (p: p5) => void;
  mousePressed?: (p: p5) => void;
  mouseDragged?: (p: p5) => void;
  mouseReleased?: (p: p5) => void;
  className?: string;
}

/**
 * Canvas2D - Wrapper component for p5.js
 * Provides a canvas for 2D visualizations and animations
 */
export default function Canvas2D({
  width = 600,
  height = 400,
  setup,
  draw,
  mousePressed,
  mouseDragged,
  mouseReleased,
  className = ''
}: Canvas2DProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  // Store callbacks in refs so they can be updated without recreating canvas
  const drawRef = useRef(draw);
  const setupRef = useRef(setup);
  const mousePressedRef = useRef(mousePressed);
  const mouseDraggedRef = useRef(mouseDragged);
  const mouseReleasedRef = useRef(mouseReleased);

  // Update refs when callbacks change
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    mousePressedRef.current = mousePressed;
  }, [mousePressed]);

  useEffect(() => {
    mouseDraggedRef.current = mouseDragged;
  }, [mouseDragged]);

  useEffect(() => {
    mouseReleasedRef.current = mouseReleased;
  }, [mouseReleased]);

  // Create p5 instance only once
  useEffect(() => {
    if (!canvasRef.current) return;

    let p5Loaded = false;

    // Dynamically import p5 (client-side only)
    import('p5').then((P5) => {
      if (!canvasRef.current || p5Loaded) return;
      p5Loaded = true;

      const sketch = (p: p5) => {
        p.setup = () => {
          // Size canvas to fit parent container on initial load
          const parent = canvasRef.current;
          const parentWidth = parent ? parent.clientWidth : width;
          const ratio = parentWidth / width;
          p.createCanvas(parentWidth, height * ratio);
          p.frameRate(60);

          // Call custom setup if provided
          setupRef.current?.(p);
        };

        p.draw = () => {
          // Always use the latest draw function from ref
          drawRef.current(p);
        };

        p.mousePressed = () => {
          // Only trigger if mouse is within canvas
          if (p.mouseX >= 0 && p.mouseX <= width && p.mouseY >= 0 && p.mouseY <= height) {
            mousePressedRef.current?.(p);
          }
        };

        p.mouseDragged = () => {
          if (p.mouseX >= 0 && p.mouseX <= width && p.mouseY >= 0 && p.mouseY <= height) {
            mouseDraggedRef.current?.(p);
          }
        };

        p.mouseReleased = () => {
          mouseReleasedRef.current?.(p);
        };

        // Handle window resize - scale both up and down to fill container
        p.windowResized = () => {
          const parent = canvasRef.current;
          if (parent) {
            const parentWidth = parent.clientWidth;
            if (parentWidth !== p.width) {
              const ratio = parentWidth / width;
              p.resizeCanvas(parentWidth, height * ratio);
            }
          }
        };
      };

      // Create p5 instance
      p5Instance.current = new P5.default(sketch, canvasRef.current);
    });

    // Cleanup on unmount only
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [width, height]); // Only recreate if canvas size changes

  return (
    <div
      ref={canvasRef}
      className={`canvas-2d-container ${className}`}
      style={{ width: '100%' }}
    />
  );
}

/**
 * Utility functions for common p5.js operations
 */

/**
 * Draw a coordinate grid
 */
export function drawGrid(p: p5, spacing: number = 50, color: string = '#e0e0e0') {
  p.push();
  p.stroke(color);
  p.strokeWeight(1);

  // Vertical lines
  for (let x = 0; x <= p.width; x += spacing) {
    p.line(x, 0, x, p.height);
  }

  // Horizontal lines
  for (let y = 0; y <= p.height; y += spacing) {
    p.line(0, y, p.width, y);
  }

  p.pop();
}

/**
 * Draw coordinate axes
 */
export function drawAxes(
  p: p5,
  originX: number,
  originY: number,
  scale: number = 1,
  showLabels: boolean = true
) {
  p.push();

  // X-axis (red)
  p.stroke(255, 0, 0);
  p.strokeWeight(2);
  p.line(0, originY, p.width, originY);
  if (showLabels) {
    p.fill(255, 0, 0);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.text('x', p.width - 5, originY + 5);
  }

  // Y-axis (green)
  p.stroke(0, 255, 0);
  p.line(originX, 0, originX, p.height);
  if (showLabels) {
    p.fill(0, 255, 0);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.text('y', originX + 5, 5);
  }

  // Origin
  p.fill(0);
  p.noStroke();
  p.circle(originX, originY, 6);

  p.pop();
}

/**
 * Draw a vector as an arrow
 */
export function drawVector(
  p: p5,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string | number[] = [0, 0, 255],
  label?: string
) {
  p.push();

  // Set color
  if (Array.isArray(color)) {
    p.stroke(color[0], color[1], color[2]);
    p.fill(color[0], color[1], color[2]);
  } else {
    p.stroke(color);
    p.fill(color);
  }

  p.strokeWeight(2);

  // Draw line
  p.line(x, y, x + vx, y + vy);

  // Draw arrowhead
  const angle = Math.atan2(vy, vx);
  const arrowSize = 10;
  p.push();
  p.translate(x + vx, y + vy);
  p.rotate(angle);
  p.triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
  p.pop();

  // Draw label
  if (label) {
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(label, x + vx / 2, y + vy / 2 - 5);
  }

  p.pop();
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number,
  scale: number = 1
): { x: number; y: number } {
  return {
    x: (screenX - originX) / scale,
    y: (originY - screenY) / scale // Flip Y axis
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  originX: number,
  originY: number,
  scale: number = 1
): { x: number; y: number } {
  return {
    x: originX + worldX * scale,
    y: originY - worldY * scale // Flip Y axis
  };
}
