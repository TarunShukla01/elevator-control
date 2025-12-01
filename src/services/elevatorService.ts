import {
  ElevatorState,
  FloorRequest,
  Direction,
  ElevatorStatus,
} from "../types";

const MOVE_TIME = 10; // seconds per floor
const LOAD_TIME = 10; // seconds per stop
const FLOORS = 10;
const ELEVATORS = 4;

export class ElevatorController {
  elevators: ElevatorState[];
  pendingRequests: FloorRequest[] = [];
  time: number = 0;
  private reqId = 1;
  private onLog: (msg: string) => void;

  constructor(onLog: (msg: string) => void) {
    this.onLog = onLog;
    this.elevators = Array.from({ length: ELEVATORS }, (_, i) => ({
      id: i + 1,
      currentFloor: 1,
      direction: "IDLE" as Direction,
      status: "IDLE" as ElevatorStatus,
      timeToNextAction: 0,
      queue: [],
    }));
  }

  log(msg: string) {
    this.onLog(`[${this.time.toString().padStart(4, "0")}s] ${msg}`);
  }

  /** Called every 1 simulated second */
  tick() {
    this.time += 1;

    // 1. Decrement timers and advance elevators
    for (const elev of this.elevators) {
      if (elev.timeToNextAction > 0) {
        elev.timeToNextAction -= 1;
        if (elev.timeToNextAction <= 0) {
          this.handleElevatorActionDone(elev);
        }
      } else if (elev.status === "IDLE") {
        // try to assign new work if idle
        this.assignWorkToElevator(elev);
      }
    }

    // 2. Try to assign remaining requests to idle elevators
    this.assignPendingRequestsToIdleElevators();
  }

  createFloorRequest(floor: number, direction: Exclude<Direction, "IDLE">) {
    const req: FloorRequest = {
      id: this.reqId++,
      floor,
      direction,
      createdAt: this.time,
    };
    this.pendingRequests.push(req);
    this.log(`Floor request: floor ${floor} going ${direction}`);
    this.assignPendingRequestsToIdleElevators();
  }

  private handleElevatorActionDone(elev: ElevatorState) {
    if (elev.status === "MOVING") {
      // arrived at next floor
      if (elev.direction === "UP") elev.currentFloor += 1;
      else if (elev.direction === "DOWN") elev.currentFloor -= 1;

      this.log(`Car ${elev.id} arrived at floor ${elev.currentFloor}`);

      // If this floor is in queue, load/unload
      const idx = elev.queue.findIndex((s) => s.floor === elev.currentFloor);
      if (idx >= 0) {
        elev.queue.splice(idx, 1);
        elev.status = "LOADING";
        elev.timeToNextAction = LOAD_TIME;
        this.log(
          `Car ${elev.id} loading/unloading at floor ${elev.currentFloor}`
        );
      } else {
        // continue moving if queue not empty
        this.continueOrIdle(elev);
      }
    } else if (elev.status === "LOADING") {
      // Done loading, continue or become idle
      this.continueOrIdle(elev);
    }
  }

  private continueOrIdle(elev: ElevatorState) {
    if (elev.queue.length === 0) {
      elev.status = "IDLE";
      elev.direction = "IDLE";
      elev.timeToNextAction = 0;
      this.log(`Car ${elev.id} is now IDLE at floor ${elev.currentFloor}`);
      this.assignWorkToElevator(elev);
      return;
    }
    const nextFloor = elev.queue[0].floor;
    elev.direction = nextFloor > elev.currentFloor ? "UP" : "DOWN";
    elev.status = "MOVING";
    elev.timeToNextAction = Math.abs(nextFloor - elev.currentFloor) * MOVE_TIME;
    this.log(`Car ${elev.id} moving ${elev.direction} to floor ${nextFloor}`);
  }

  private assignPendingRequestsToIdleElevators() {
    for (const elev of this.elevators) {
      if (elev.status === "IDLE" && this.pendingRequests.length > 0) {
        this.assignWorkToElevator(elev);
      }
    }
  }

  private assignWorkToElevator(elev: ElevatorState) {
    if (this.pendingRequests.length === 0) return;

    // Naive: choose nearest request
    let bestReq: FloorRequest | undefined;
    let bestDist = Infinity;
    for (const req of this.pendingRequests) {
      const dist = Math.abs(req.floor - elev.currentFloor);
      if (dist < bestDist) {
        bestDist = dist;
        bestReq = req;
      }
    }
    if (!bestReq) return;

    // assign request to this elevator
    this.pendingRequests = this.pendingRequests.filter(
      (r) => r.id !== bestReq!.id
    );

    // add pickup floor
    elev.queue.push({ floor: bestReq.floor });

    // add a drop-off floor beyond pickup in same direction (simple realism)
    const targetFloor = this.getRandomDestination(
      bestReq.floor,
      bestReq.direction
    );
    if (targetFloor) {
      elev.queue.push({ floor: targetFloor });
      this.log(
        `Car ${elev.id} assigned: pickup at floor ${bestReq.floor}, drop at floor ${targetFloor}`
      );
    } else {
      this.log(`Car ${elev.id} assigned: pickup at floor ${bestReq.floor}`);
    }

    // sort queue according to direction to avoid yo-yo
    const dir = bestReq.direction;
    if (dir === "UP") {
      elev.queue.sort((a, b) => a.floor - b.floor);
    } else {
      elev.queue.sort((a, b) => b.floor - a.floor);
    }

    // start moving if currently idle
    if (elev.status === "IDLE") {
      this.continueOrIdle(elev);
    }
  }

  private getRandomDestination(
    fromFloor: number,
    direction: Exclude<Direction, "IDLE">
  ): number | null {
    const candidates: number[] = [];
    for (let f = 1; f <= FLOORS; f++) {
      if (f === fromFloor) continue;
      if (direction === "UP" && f > fromFloor) candidates.push(f);
      if (direction === "DOWN" && f < fromFloor) candidates.push(f);
    }
    if (!candidates.length) return null;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }
}
