import React, { useEffect, useRef, useState } from "react";
import ElevatorView from "../components/ElevatorView";
import { createElevatorController } from "../services/elevatorService";

const FLOORS = 10;
const ELEVATORS = 4;
const MOVE_TIME_MS = 10000;
const STOP_TIME_MS = 10000;

export const ElevatorDashboard = () => {
  const [elevators, setElevators] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [demoSpeed, setDemoSpeed] = useState(20);

  const controllerRef = useRef<ReturnType<typeof createElevatorController> | null>(
    null
  );

  useEffect(() => {
    const controller = createElevatorController(
      {
        floors: FLOORS,
        elevatorCount: ELEVATORS,
        moveTimeMsPerFloor: MOVE_TIME_MS,
        stopTimeMs: STOP_TIME_MS,
        demoSpeedFactor: demoSpeed,
      },
      (ev, cs, lg) => {
        setElevators(ev);
        setCalls(cs);
        setLogs(lg);
      }
    );

    controllerRef.current = controller;

    // periodic dispatcher tick
    const tick = setInterval(() => controller.tick(), 1000 / demoSpeed);

    // random calls generator
    const auto = setInterval(() => controller.randomCall(), 3000 / demoSpeed);

    return () => {
      clearInterval(tick);
      clearInterval(auto);
    };
  }, [demoSpeed]);

  const addManualCall = (floor: number, dir: "up" | "down") => {
    controllerRef.current?.addCall(floor, dir);
  };

  return (
    <div className="app">
      <h1>Elevator Control System</h1>

      <div className="controls">
        <label>
          Demo Speed:
          <input
            type="range"
            min={1}
            max={50}
            value={demoSpeed}
            onChange={(e) => setDemoSpeed(Number(e.target.value))}
          />
        </label>

        <button onClick={() => addManualCall(1, "up")}>Call Up @1</button>
        <button onClick={() => addManualCall(10, "down")}>Call Down @10</button>
        <button
          onClick={() => {
            for (let f = 1; f <= FLOORS; f++) {
              controllerRef.current?.addCall(
                f,
                f === FLOORS ? "down" : "up"
              );
            }
          }}
        >
          Call All Up
        </button>
      </div>

      <ElevatorView elevators={elevators} floors={FLOORS} />
    </div>
  );
}
