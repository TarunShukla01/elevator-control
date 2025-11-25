export type Direction = 'up' | 'down' | 'idle'

export interface Elevator {
id: number
currentFloor: number
targetFloors: number[] // queue (sorted depending on direction)
direction: Direction
busyUntil: number // timestamp (ms) until which elevator is busy (moving or doors)
}

export interface Call {
id: string
floor: number
direction: 'up' | 'down'
createdAt: number
}