import { ElevatorController } from "../elevatorService";

describe("ElevatorController", () => {
  let logs: string[];
  let logFn: (m: string) => void;

  beforeEach(() => {
    logs = [];
    logFn = (m: string) => logs.push(m);

    // deterministic random destination
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  test("initializes with 4 idle elevators at floor 1", () => {
    const controller = new ElevatorController(logFn);

    expect(controller.elevators).toHaveLength(4);
    controller.elevators.forEach((e) =>
      expect(e).toMatchObject({
        currentFloor: 1,
        direction: "IDLE",
        status: "IDLE",
        queue: [],
      })
    );
  });

  test("creates a floor request and logs it", () => {
    const controller = new ElevatorController(logFn);

    controller.createFloorRequest(5, "UP");

    // request is auto-assigned immediately → pendingRequests becomes 0
    expect(controller.pendingRequests.length).toBe(0);

    const elev = controller.elevators[0];
    expect(elev.queue.length).toBeGreaterThan(0);

    expect(logs[0]).toContain("Floor request: floor 5 going UP");
  });

  test("assigns nearest elevator and starts moving", () => {
    const controller = new ElevatorController(logFn);

    controller.createFloorRequest(5, "UP");

    const elev = controller.elevators[0]; // first idle elevator gets it

    expect(elev.queue.length).toBe(2); // pickup + drop-off
    expect(elev.status).toBe("MOVING");
    expect(elev.direction).toBe("UP");
    expect(elev.timeToNextAction).toBe((5 - 1) * 10); // MOVE_TIME * floors
  });

  test("elevator advances floors when ticking", () => {
    const logs: string[] = [];
    const controller = new ElevatorController((msg) => logs.push(msg));

    controller.createFloorRequest(3, "UP");

    const elev = controller.elevators[0];

    // At this point, elevator 1 should have been assigned and be MOVING
    expect(elev.status).toBe("MOVING");
    expect(elev.direction).toBe("UP");

    // 30 ticks: 20s to go from floor 1 → 2, 10s to go from 2 → 3
    for (let i = 0; i < 30; i++) controller.tick();

    expect(elev.currentFloor).toBe(3);
    expect(logs.some((l) => l.includes("arrived at floor 3"))).toBe(true);
  });

  test("loading/unloading happens after arrival", () => {
    const controller = new ElevatorController(logFn);

    controller.createFloorRequest(2, "UP");
    const elev = controller.elevators[0];

    // initial move time = 10s
    for (let i = 0; i < 10; i++) controller.tick(); // arrive at floor 2

    expect(elev.status).toBe("LOADING");
    expect(elev.timeToNextAction).toBe(10); // LOAD_TIME
    expect(logs.some((l) => l.includes("loading/unloading"))).toBe(true);
  });

  test("elevator becomes IDLE when queue finishes", () => {
    const controller = new ElevatorController(logFn);

    controller.createFloorRequest(2, "UP");
    const elev = controller.elevators[0];

    // Move → Load → Move → Load → then empty → Idle
    // We're simulating time passing:

    for (let i = 0; i < 10; i++) controller.tick(); // move to floor 2
    for (let i = 0; i < 10; i++) controller.tick(); // load at floor 2

    // second move depends on the mocked destination
    // from floor 2, random UP → floor 3 (since random=0)
    for (let i = 0; i < 10; i++) controller.tick(); // move to 3
    for (let i = 0; i < 10; i++) controller.tick(); // load/unload

    expect(elev.status).toBe("IDLE");
    expect(elev.direction).toBe("IDLE");
    expect(elev.queue.length).toBe(0);
    expect(logs.some((l) => l.includes("is now IDLE"))).toBe(true);
  });
});
