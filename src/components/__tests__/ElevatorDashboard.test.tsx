/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ---- MOCK MUST COME BEFORE the component import ----
let mockCreateRequest = jest.fn();
let mockTick = jest.fn();
const elevatorSpy = jest.fn();

jest.mock("../../services/elevatorService", () => ({
  ElevatorController: jest.fn().mockImplementation((logCallback: any) => ({
    elevators: [
      { id: 1, currentFloor: 1, direction: "IDLE", status: "IDLE", queue: [] },
      { id: 2, currentFloor: 1, direction: "IDLE", status: "IDLE", queue: [] },
      { id: 3, currentFloor: 1, direction: "IDLE", status: "IDLE", queue: [] },
      { id: 4, currentFloor: 1, direction: "IDLE", status: "IDLE", queue: [] },
    ],
    pendingRequests: [],
    createFloorRequest: (...args: any[]) => mockCreateRequest(...args),
    tick: () => mockTick(),
  })),
}));

// ---- Now import component AFTER mock ----
import { ElevatorDashboard } from "../ElevatorDashboard";

jest.useFakeTimers();

describe("ElevatorDashboard UI", () => {
  beforeEach(() => {
    mockCreateRequest = jest.fn();
    mockTick = jest.fn();
  });

  test("renders dashboard panels correctly", () => {
    render(<ElevatorDashboard />);
    act(() => {
      jest.runOnlyPendingTimers(); // invokes setInterval setup
      jest.advanceTimersByTime(0); // flush react effects
    });
    expect(screen.getByText("Floors")).toBeInTheDocument();
    expect(screen.getByText("Activity Log")).toBeInTheDocument();
    expect(screen.getByText("Car 1")).toBeInTheDocument();
  });

  test("ticks controller every interval", () => {
    render(<ElevatorDashboard />);

    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(mockTick).toHaveBeenCalledTimes(3);
  });

  test("pressing UP triggers request", () => {
    render(<ElevatorDashboard />);
    act(() => {
      jest.runOnlyPendingTimers(); // invokes setInterval setup
      jest.advanceTimersByTime(0); // flush react effects
    });
    const upBtn = screen.getAllByText("↑")[0];
    fireEvent.click(upBtn);
    expect(mockCreateRequest).toHaveBeenCalledWith(9, "UP");
  });

  test("pressing DOWN triggers request", () => {
    render(<ElevatorDashboard />);
    act(() => {
      jest.runOnlyPendingTimers(); // invokes setInterval setup
      jest.advanceTimersByTime(0); // flush react effects
    });
    const downBtn = screen.getAllByText("↓")[0];
    fireEvent.click(downBtn);
    expect(mockCreateRequest).toHaveBeenCalledWith(10, "DOWN");
  });
});
