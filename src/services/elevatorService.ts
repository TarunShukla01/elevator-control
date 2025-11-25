import { Elevator, Call } from "../types";
import { now } from "../utils/helper";

export interface SimulationConfig {
  floors: number;
  elevatorCount: number;
  moveTimeMsPerFloor: number;
  stopTimeMs: number;
  demoSpeedFactor?: number;
}

export function createElevatorController(
  config: SimulationConfig,
  onStateChange: (
    elevators: Elevator[],
    calls: Call[],
    logs: string[]
  ) => void
) {
  let elevators: Elevator[] = Array.from({ length: config.elevatorCount }, (_, i) => ({
    id: i + 1,
    currentFloor: 1,
    targetFloors: [],
    direction: "idle",
    busyUntil: 0,
  }));

  let calls: Call[] = [];
  let logs: string[] = [];

  const log = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    logs.unshift(`[${t}] ${msg}`);
    logs = logs.slice(0, 200);
    notify();
  };

  const notify = () =>
    onStateChange(
      elevators.map((e) => ({ ...e })),
      [...calls],
      [...logs]
    );

  const delay = (ms: number) =>
    new Promise((res) =>
      setTimeout(
        res,
        Math.max(1, Math.round(ms / (config.demoSpeedFactor ?? 1)))
      )
    );

  // ---------------- Core functional logic ------------------

  const addCall = (floor: number, direction: "up" | "down") => {
    calls = [
      ...calls,
      {
        id: `${floor}-${direction}-${now()}`,
        floor,
        direction,
        createdAt: now(),
      },
    ];
    log(`Call added @${floor} (${direction})`);
    dispatch();
  };

  const dispatch = () => {
    const remainingCalls: Call[] = [];

    for (const call of calls) {
      const best = findBestElevator(call);
      if (best) {
        enqueueTarget(best.id, call.floor);
        log(`Assigned call @${call.floor} to elevator ${best.id}`);
      } else {
        remainingCalls.push(call);
      }
    }

    calls = remainingCalls;
    notify();
  };

  const findBestElevator = (call: Call) => {
    return [...elevators]
      .sort(
        (a, b) =>
          Math.abs(a.currentFloor - call.floor) -
          Math.abs(b.currentFloor - call.floor)
      )
      .find((e) => {
        if (e.busyUntil > now() + 5000) return false;
        if (e.direction === "idle") return true;
        if (e.direction === "up" && call.floor >= e.currentFloor) return true;
        if (e.direction === "down" && call.floor <= e.currentFloor) return true;
        return false;
      });
  };

  const enqueueTarget = (elevatorId: number, floor: number) => {
    elevators = elevators.map((e) => {
      if (e.id !== elevatorId) return e;

      if (!e.targetFloors.includes(floor)) {
        const updated = {
          ...e,
          targetFloors: [...e.targetFloors, floor],
        };

        updated.targetFloors.sort((a, b) =>
          updated.direction === "down" ? b - a : a - b
        );

        if (updated.direction === "idle") {
          updated.direction = floor > updated.currentFloor ? "up" : "down";
        }

        processElevator(updated);
        return updated;
      }

      return e;
    });

    notify();
  };

  const processElevator = async (elevator: Elevator) => {
    // prevent multiple simultaneous loops
    if ((elevator as any).__running) return;
    (elevator as any).__running = true;

    while (elevator.targetFloors.length) {
      const target = elevator.targetFloors[0];

      if (elevator.currentFloor === target) {
        log(`Elevator ${elevator.id} stopping at ${target}`);
        elevator.busyUntil = now() + config.stopTimeMs;
        elevator.targetFloors = elevator.targetFloors.slice(1);
        if (elevator.targetFloors.length === 0) elevator.direction = "idle";
        notify();
        await delay(config.stopTimeMs);
        continue;
      }

      const step = target > elevator.currentFloor ? 1 : -1;
      elevator.direction = step === 1 ? "up" : "down";

      const nextFloor = elevator.currentFloor + step;
      log(`Elevator ${elevator.id} moving from ${elevator.currentFloor} to ${nextFloor}`);

      elevator.busyUntil = now() + config.moveTimeMsPerFloor;
      notify();
      await delay(config.moveTimeMsPerFloor);

      elevator.currentFloor = nextFloor;
    }

    (elevator as any).__running = false;
    notify();
  };

  // external API (all functions!)
  return {
    addCall,
    tick: () => dispatch(),
    randomCall: () => {
      const floor = Math.floor(Math.random() * config.floors) + 1;
      const dir =
        floor === config.floors ? "down" : floor === 1 ? "up" : Math.random() < 0.5 ? "up" : "down";
      addCall(floor, dir);
    },
    getState: () => ({
      elevators,
      calls,
      logs,
    }),
  };
}
