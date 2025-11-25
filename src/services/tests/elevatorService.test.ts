// src/services/elevatorService.test.ts
import { createElevatorController } from '../elevatorService';

/**
 * Deterministic Jest tests for the functional elevator controller.
 * We use fake timers so tests run instantly and deterministically.
 */

beforeEach(() => {
    jest.useFakeTimers();
})

afterEach(() => {
    jest.useRealTimers();
})

const TEST_CONFIG = {
    floors: 10,
    elevatorCount: 4,
    moveTimeMsPerFloor: 1000, // 1s per floor (test-friendly)
    stopTimeMs: 500,
    demoSpeedFactor: 1, // keep timings straightforward for tests
}

/** helper to advance timers and flush Promise microtasks */
async function advanceAndFlush(ms: number) {
    jest.advanceTimersByTime(ms)
    // run any pending timers scheduled immediately
    jest.runOnlyPendingTimers()
    // allow microtask queue to drain
    await Promise.resolve()
}

describe('ElevatorController (Jest)', () => {
    it('initializes with correct elevator count and idle state', () => {
        const stateCapture = jest.fn();
        const controller = createElevatorController(TEST_CONFIG, stateCapture);

        const s = controller.getState();

        expect(s.elevators).toHaveLength(TEST_CONFIG.elevatorCount);
        for (const e of s.elevators) {
            expect(e.currentFloor).toBe(1);
            expect(e.direction).toBe('idle');
            expect(e.targetFloors).toEqual([]);
        }
    });

    it('stores a newly added call in pending calls', () => {
        const stateCapture = jest.fn()
        const controller = createElevatorController(TEST_CONFIG, stateCapture)

        controller.addCall(5, 'up')
        const s = controller.getState()
        // if dispatch assigns immediately, the call may be removed; ensure either call or targets exist
        const hasPending = s.calls.some((c: any) => c.floor === 5)
        const assigned = s.elevators.some((e: any) => e.targetFloors.includes(5))
        expect(hasPending || assigned).toBe(true)
    })

    it('assigns call to a nearest idle elevator (no duplicates)', async () => {
        const stateCapture = jest.fn()
        const controller = createElevatorController(TEST_CONFIG, stateCapture)

        controller.addCall(3, 'up')
        // dispatch occurs on addCall; controller may schedule timers — advance a tiny bit
        await advanceAndFlush(10)

        const s = controller.getState()
        const assignedElevator = s.elevators.find((e: any) => e.targetFloors.includes(3))
        expect(assignedElevator).toBeDefined()
        // add same call again — should not create duplicate target on the same elevator
        controller.addCall(3, 'up')
        await advanceAndFlush(10)
        const s2 = controller.getState()
        const sameElev = s2.elevators.find((e: any) => e.targetFloors.filter((t: number) => t === 3).length > 1)
        expect(sameElev).toBeUndefined()
    })

    it('sets elevator direction to "up" when target is above', async () => {
        const stateCapture = jest.fn()
        const controller = createElevatorController(TEST_CONFIG, stateCapture)

        controller.addCall(8, 'up')
        await advanceAndFlush(10)
        const s = controller.getState()
        const e = s.elevators.find((ev: any) => ev.targetFloors.includes(8))
        expect(e).toBeDefined()
        expect(e?.direction).toBe('up')
    })

    it('moves elevator floor-by-floor toward target (advance timers)', async () => {
        const stateCapture = jest.fn()
        const controller = createElevatorController(TEST_CONFIG, stateCapture)

        // Call to floor 4 (from 1) requires 3 floor moves (1->2,2->3,3->4)
        controller.addCall(4, 'up')
        // Give small time for dispatch to start
        await advanceAndFlush(10)

        // After 1 floor move (1000ms) elevator should be at floor 2
        await advanceAndFlush(1000)
        let s = controller.getState()
        const moving = s.elevators.find((e: any) => e.currentFloor > 1)
        expect(moving).toBeDefined()
        expect(moving?.currentFloor).toBeGreaterThanOrEqual(2)

        // After total 3 * 1000ms, it should reach floor 4 (plus optional door stop)
        await advanceAndFlush(2 * 1000) // advance remaining movement time
        // allow for stop time as well
        await advanceAndFlush(TEST_CONFIG.stopTimeMs)
        s = controller.getState()
        const arrived = s.elevators.find((e: any) => e.currentFloor === 4)
        expect(arrived).toBeDefined()
        // target queue should no longer include 4
        expect(arrived?.targetFloors.includes(4)).toBe(false)
    }, 20000);
})
