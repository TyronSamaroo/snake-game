export interface Point {
    x: number;
    y: number;
}

export interface GameState {
    snake: Point[];
    food: Point;
    score: number;
    gameOver: boolean;
    direction: string;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
