import React from 'react'
import { Elevator } from '../types'

export default function ElevatorView({ elevators, floors }: { elevators: Elevator[]; floors: number }) {
    return (
        <div className="shafts">
            {elevators.map(e => (
                <div key={e.id} className="shaft">
                    <div className="elevator-id">Car {e.id}</div>
                    <div className="floors">
                        {Array.from({ length: floors }, (_, i) => floors - i).map(f => (
                            <div key={f} className={`floor ${e.currentFloor === f ? 'active' : ''}`}>
                                <div className="floor-label">{f}</div>
                                {e.currentFloor === f && (
                                    <div className="car">{e.direction === 'idle' ? '●' : e.direction === 'up' ? '▲' : '▼'}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="targets">Targets: {e.targetFloors.join(', ') || '—'}</div>
                    <div className="status">Status: {e.direction} {e.busyUntil > Date.now() ? '(busy)' : ''}</div>
                </div>
            ))}
        </div>
    )
}