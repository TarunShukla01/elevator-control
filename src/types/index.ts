export type Direction = "UP" | "DOWN" | "IDLE";

export interface FloorRequest {
  id: number;
  floor: number;
  direction: Exclude<Direction, "IDLE">;
  createdAt: number; // sim time in seconds
}

export interface ElevatorStop {
  floor: number;
}

export type ElevatorStatus = "IDLE" | "MOVING" | "LOADING";

export interface ElevatorState {
  id: number;
  currentFloor: number;
  direction: Direction;
  status: ElevatorStatus;
  timeToNextAction: number; // seconds left for current move/load
  queue: ElevatorStop[];
}
