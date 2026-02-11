import { useState, useCallback } from 'react';
import Canvas2D, { worldToScreen, screenToWorld } from '../core/Canvas2D';
import Controls, { SliderControl, ResultDisplay, CheckboxControl, ButtonControl } from '../core/Controls';

interface Obstacle {
  x: number;
  y: number;
  r: number;
}

/**
 * PathPlanningViz - Interactive potential field path planning
 * Demonstrates attractive/repulsive potential fields for robot navigation.
 * Users place obstacles and see the gradient field + planned path.
 */
export default function PathPlanningViz() {
  const [goalX, setGoalX] = useState(3.5);
  const [goalY, setGoalY] = useState(3.0);
  const [startX] = useState(-3.5);
  const [startY] = useState(-3.0);
  const [xi, setXi] = useState(1.0);        // attractive gain
  const [eta, setEta] = useState(2.0);       // repulsive gain
  const [rho0, setRho0] = useState(1.5);     // repulsive influence radius
  const [showField, setShowField] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [showPotential, setShowPotential] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { x: 0, y: 0.5, r: 0.7 },
    { x: -1.5, y: 2.0, r: 0.5 },
    { x: 1.5, y: -1.0, r: 0.6 },
  ]);

  // Canvas settings
  const width = 500;
  const height = 400;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 45;

  // Compute gradient of potential field at a point
  const computeGradient = useCallback((px: number, py: number): [number, number] => {
    // Attractive gradient: grad(U_att) = xi * (q - q_goal)
    let gx = xi * (px - goalX);
    let gy = xi * (py - goalY);

    // Repulsive gradient from each obstacle
    for (const obs of obstacles) {
      const dx = px - obs.x;
      const dy = py - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rho = Math.max(dist - obs.r, 0.01); // distance to obstacle surface

      if (rho < rho0) {
        const repMag = eta * (1 / rho - 1 / rho0) * (1 / (rho * rho));
        // Direction: away from obstacle
        const nx = dx / dist;
        const ny = dy / dist;
        gx -= repMag * nx;
        gy -= repMag * ny;
      }
    }

    return [gx, gy];
  }, [xi, eta, rho0, goalX, goalY, obstacles]);

  // Compute potential value at a point
  const computePotential = useCallback((px: number, py: number): number => {
    const dx = px - goalX;
    const dy = py - goalY;
    let U = 0.5 * xi * (dx * dx + dy * dy);

    for (const obs of obstacles) {
      const ddx = px - obs.x;
      const ddy = py - obs.y;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      const rho = Math.max(dist - obs.r, 0.01);

      if (rho < rho0) {
        U += 0.5 * eta * Math.pow(1 / rho - 1 / rho0, 2);
      }
    }

    return U;
  }, [xi, eta, rho0, goalX, goalY, obstacles]);

  // Gradient descent path
  const computePath = useCallback((): Array<{ x: number; y: number }> => {
    const path: Array<{ x: number; y: number }> = [];
    let cx = startX;
    let cy = startY;
    const stepSize = 0.05;
    const maxSteps = 500;

    path.push({ x: cx, y: cy });

    for (let i = 0; i < maxSteps; i++) {
      const [gx, gy] = computeGradient(cx, cy);
      const gradMag = Math.sqrt(gx * gx + gy * gy);

      if (gradMag < 0.01) break;

      // Normalized gradient descent step
      const step = Math.min(stepSize, gradMag * stepSize);
      cx -= (gx / gradMag) * step;
      cy -= (gy / gradMag) * step;

      path.push({ x: cx, y: cy });

      // Check if reached goal
      const dx = cx - goalX;
      const dy = cy - goalY;
      if (Math.sqrt(dx * dx + dy * dy) < 0.15) break;
    }

    return path;
  }, [startX, startY, computeGradient, goalX, goalY]);

  const path = showPath ? computePath() : [];
  const reachedGoal = path.length > 0 &&
    Math.sqrt((path[path.length - 1].x - goalX) ** 2 + (path[path.length - 1].y - goalY) ** 2) < 0.2;

  const draw = (p: any) => {
    p.clear();
    p.background(255);

    // Potential field heatmap
    if (showPotential) {
      const gridStep = 6;
      for (let sx = 0; sx < p.width; sx += gridStep) {
        for (let sy = 0; sy < p.height; sy += gridStep) {
          const world = screenToWorld(sx, sy, originX, originY, scale);
          const U = computePotential(world.x, world.y);
          const intensity = Math.min(255, U * 20);
          p.noStroke();
          p.fill(255, 255 - intensity * 0.6, 255 - intensity, 60);
          p.rect(sx, sy, gridStep, gridStep);
        }
      }
    }

    // Grid
    p.stroke(showPotential ? 200 : 235);
    p.strokeWeight(1);
    for (let i = -6; i <= 6; i++) {
      p.line(0, originY + i * scale, p.width, originY + i * scale);
      p.line(originX + i * scale, 0, originX + i * scale, p.height);
    }

    // Axes
    p.stroke(200);
    p.strokeWeight(1);
    p.line(0, originY, p.width, originY);
    p.line(originX, 0, originX, p.height);

    // Gradient field arrows
    if (showField) {
      const fieldStep = 0.8;
      for (let wx = -4.5; wx <= 4.5; wx += fieldStep) {
        for (let wy = -4; wy <= 4; wy += fieldStep) {
          // Skip if inside an obstacle
          let insideObs = false;
          for (const obs of obstacles) {
            const d = Math.sqrt((wx - obs.x) ** 2 + (wy - obs.y) ** 2);
            if (d < obs.r + 0.1) { insideObs = true; break; }
          }
          if (insideObs) continue;

          const [gx, gy] = computeGradient(wx, wy);
          const gradMag = Math.sqrt(gx * gx + gy * gy);
          if (gradMag < 0.001) continue;

          // Negative gradient = direction of steepest descent
          const ngx = -gx / gradMag;
          const ngy = -gy / gradMag;

          const arrowLen = Math.min(0.3, gradMag * 0.1);
          const from = worldToScreen(wx, wy, originX, originY, scale);
          const to = worldToScreen(wx + ngx * arrowLen, wy + ngy * arrowLen, originX, originY, scale);

          // Color based on gradient magnitude
          const colorIntensity = Math.min(200, gradMag * 30);
          p.stroke(100, 100 + colorIntensity * 0.4, 200, 120);
          p.strokeWeight(1);
          p.line(from.x, from.y, to.x, to.y);

          // Tiny arrowhead
          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          p.fill(100, 100 + colorIntensity * 0.4, 200, 120);
          p.noStroke();
          p.push();
          p.translate(to.x, to.y);
          p.rotate(angle);
          p.triangle(0, 0, -4, -2, -4, 2);
          p.pop();
        }
      }
    }

    // Obstacles
    for (const obs of obstacles) {
      const os = worldToScreen(obs.x, obs.y, originX, originY, scale);
      // Influence radius
      p.noFill();
      p.stroke(255, 100, 100, 40);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 3]);
      p.ellipse(os.x, os.y, (obs.r + rho0) * 2 * scale, (obs.r + rho0) * 2 * scale);
      p.drawingContext.setLineDash([]);

      // Obstacle body
      p.fill(180, 60, 60, 180);
      p.stroke(150, 40, 40);
      p.strokeWeight(1.5);
      p.ellipse(os.x, os.y, obs.r * 2 * scale, obs.r * 2 * scale);
    }

    // Path
    if (showPath && path.length > 1) {
      p.noFill();
      p.stroke(60, 60, 220);
      p.strokeWeight(2.5);
      p.beginShape();
      for (const pt of path) {
        const s = worldToScreen(pt.x, pt.y, originX, originY, scale);
        p.vertex(s.x, s.y);
      }
      p.endShape();

      // Path dots at intervals
      p.fill(60, 60, 220);
      p.noStroke();
      for (let i = 0; i < path.length; i += 15) {
        const s = worldToScreen(path[i].x, path[i].y, originX, originY, scale);
        p.circle(s.x, s.y, 4);
      }
    }

    // Start point
    const ss = worldToScreen(startX, startY, originX, originY, scale);
    p.fill(60, 180, 60);
    p.stroke(40, 140, 40);
    p.strokeWeight(2);
    p.circle(ss.x, ss.y, 14);
    p.fill(255);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('S', ss.x, ss.y);

    // Goal point
    const gs = worldToScreen(goalX, goalY, originX, originY, scale);
    p.fill(220, 180, 40);
    p.stroke(180, 140, 20);
    p.strokeWeight(2);

    // Star shape for goal
    p.beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 10 : 5;
      p.vertex(gs.x + r * Math.cos(angle), gs.y + r * Math.sin(angle));
    }
    p.endShape(p.CLOSE);

    p.fill(80);
    p.noStroke();
    p.textSize(9);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('G', gs.x, gs.y);
  };

  const addObstacle = () => {
    if (obstacles.length >= 6) return;
    const newObs: Obstacle = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      r: 0.4 + Math.random() * 0.4
    };
    setObstacles([...obstacles, newObs]);
  };

  const removeLastObstacle = () => {
    if (obstacles.length === 0) return;
    setObstacles(obstacles.slice(0, -1));
  };

  const resetObstacles = () => {
    setObstacles([
      { x: 0, y: 0.5, r: 0.7 },
      { x: -1.5, y: 2.0, r: 0.5 },
      { x: 1.5, y: -1.0, r: 0.6 },
    ]);
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
              <h4 className="font-semibold text-sm">Goal Position</h4>
              <SliderControl
                label={`Goal x = ${goalX.toFixed(1)}`}
                value={goalX} onChange={setGoalX}
                min={-4} max={4} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`Goal y = ${goalY.toFixed(1)}`}
                value={goalY} onChange={setGoalY}
                min={-4} max={4} step={0.1}
                showValue={false}
              />

              <h4 className="font-semibold text-sm pt-2">Potential Field Gains</h4>
              <SliderControl
                label={`ξ (attractive) = ${xi.toFixed(1)}`}
                value={xi} onChange={setXi}
                min={0.1} max={3} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`η (repulsive) = ${eta.toFixed(1)}`}
                value={eta} onChange={setEta}
                min={0.1} max={5} step={0.1}
                showValue={false}
              />
              <SliderControl
                label={`ρ₀ (influence range) = ${rho0.toFixed(1)}`}
                value={rho0} onChange={setRho0}
                min={0.3} max={3} step={0.1}
                showValue={false}
              />

              <h4 className="font-semibold text-sm pt-2">Obstacles ({obstacles.length})</h4>
              <div className="flex flex-wrap gap-1">
                <ButtonControl label="Add" onClick={addObstacle} variant="outline" size="sm" />
                <ButtonControl label="Remove" onClick={removeLastObstacle} variant="outline" size="sm" />
                <ButtonControl label="Reset" onClick={resetObstacles} variant="outline" size="sm" />
              </div>

              <CheckboxControl label="Show gradient field" checked={showField} onChange={setShowField} />
              <CheckboxControl label="Show planned path" checked={showPath} onChange={setShowPath} />
              <CheckboxControl label="Show potential heatmap" checked={showPotential} onChange={setShowPotential} />

              <ResultDisplay title="Path Status">
                <div className="space-y-1">
                  <div>
                    <span className="text-base-content/60">Path length: </span>
                    <span className="font-bold">{path.length} steps</span>
                  </div>
                  <div className={`font-semibold ${reachedGoal ? 'text-success' : 'text-warning'}`}>
                    {reachedGoal ? 'Goal reached' : 'Path may be trapped in local minimum'}
                  </div>
                </div>
              </ResultDisplay>
            </div>
          </Controls>
        </div>
      </div>

      <div className="mt-4 text-sm text-base-content/70">
        <p>
          <strong>Try this:</strong> Move the goal around and watch the gradient field reorient.
          Add obstacles and observe the repulsive field deflecting the path. Increase η to
          make obstacles more repulsive. Try creating a configuration where the path gets stuck
          in a <strong>local minimum</strong> — the fundamental limitation of potential fields.
        </p>
      </div>
    </div>
  );
}
