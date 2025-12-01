import React, { useEffect, useReducer, useRef, useState } from "react";
import { ElevatorController } from "../services/elevatorService";

const TICK_MS = 300; // 300ms = 1 simulated second

export const ElevatorDashboard = () => {
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const [logs, setLogs] = useState<string[]>([]);

  const controllerRef = useRef<ElevatorController | null>(null);
  useEffect(() => {
    controllerRef.current = new ElevatorController((msg) =>
      setLogs((prev) => [msg, ...prev.slice(0, 200)])
    );

    const interval = setInterval(() => {
      controllerRef.current!.tick();
      forceRender();
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const controller = controllerRef.current;
  if (!controller) return null;

  return (
    <div className="w-full h-screen bg-slate-900 text-slate-100 p-6 flex gap-6 overflow-hidden">
      {/* LEFT PANEL — FLOORS */}
      <div className="w-64 flex flex-col bg-slate-800 rounded-xl shadow-lg p-4 overflow-y-auto border border-slate-700">
        <h2 className="text-lg font-bold mb-4 tracking-wide">Floors</h2>

        {Array.from({ length: 10 }, (_, i) => 10 - i).map((floor) => {
          const hasUp = controller.pendingRequests.some(
            (r) => r.floor === floor && r.direction === "UP"
          );
          const hasDown = controller.pendingRequests.some(
            (r) => r.floor === floor && r.direction === "DOWN"
          );

          return (
            <div
              key={floor}
              className="flex items-center justify-between px-3 py-2 mb-2 bg-slate-700 rounded-lg border border-slate-600"
            >
              <div className="text-md font-semibold">Floor {floor}</div>

              <div className="flex items-center gap-2">
                {floor < 10 && (
                  <button
                    onClick={() => controller.createFloorRequest(floor, "UP")}
                    className={`px-2 py-1 rounded-md text-sm font-semibold transition-all
                      ${
                        hasUp
                          ? "bg-emerald-500 text-black shadow"
                          : "bg-slate-600 hover:bg-slate-500"
                      }`}
                  >
                    ↑
                  </button>
                )}

                {floor > 1 && (
                  <button
                    onClick={() => controller.createFloorRequest(floor, "DOWN")}
                    className={`px-2 py-1 rounded-md text-sm font-semibold transition-all
                      ${
                        hasDown
                          ? "bg-rose-500 text-black shadow"
                          : "bg-slate-600 hover:bg-slate-500"
                      }`}
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MIDDLE PANEL — ELEVATORS */}
      <div className="flex-1 grid grid-cols-4 gap-4">
        {controller.elevators.map((elevator) => (
          <div
            key={elevator.id}
            className="bg-slate-800 rounded-xl shadow-lg p-4 flex flex-col border border-slate-700"
          >
            <h3 className="text-lg font-bold mb-4">Car {elevator.id}</h3>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Floor:</span>{" "}
                <span className="text-xl font-bold">
                  {elevator.currentFloor}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Direction:</span>{" "}
                <span
                  className={`font-semibold ${
                    elevator.direction === "UP"
                      ? "text-emerald-400"
                      : elevator.direction === "DOWN"
                      ? "text-rose-400"
                      : "text-sky-400"
                  }`}
                >
                  {elevator.direction}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="font-semibold">{elevator.status}</span>
              </div>

              <div>
                <span className="text-slate-400">Queue:</span>{" "}
                {elevator.queue.length > 0 ? (
                  <span className="font-semibold">
                    {elevator.queue.map((q) => q.floor).join(", ")}
                  </span>
                ) : (
                  <span className="italic text-slate-500">None</span>
                )}
              </div>
            </div>

            <div className="flex-1" />

            <div className="h-2 w-full rounded-full bg-slate-600 mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  elevator.direction === "UP"
                    ? "bg-emerald-500"
                    : elevator.direction === "DOWN"
                    ? "bg-rose-500"
                    : "bg-slate-500"
                }`}
                style={{
                  width: elevator.status === "MOVING" ? "100%" : "20%",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL — LOGS */}
      <div className="w-80 bg-slate-800 rounded-xl shadow-lg p-4 flex flex-col border border-slate-700">
        <h2 className="text-lg font-bold mb-4 tracking-wide">Activity Log</h2>

        <div className="flex-1 overflow-y-auto space-y-2 text-sm pr-2">
          {logs.slice(0, 150).map((entry, idx) => (
            <div
              key={idx}
              className="bg-slate-700 border border-slate-600 px-3 py-2 rounded-md"
            >
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
