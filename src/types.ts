export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Point;
}

export interface Rocket extends Entity {
  target: Point;
  speed: number;
  angle: number;
  destroyed: boolean;
}

export interface Interceptor extends Entity {
  target: Point;
  speed: number;
  angle: number;
  startPos: Point;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growing: boolean;
  alpha: number;
}

export interface City extends Entity {
  destroyed: boolean;
}

export interface Battery extends Entity {
  id: 'left' | 'middle' | 'right';
  ammo: number;
  maxAmmo: number;
  destroyed: boolean;
}

export interface GameState {
  score: number;
  status: GameStatus;
  level: number;
  rockets: Rocket[];
  interceptors: Interceptor[];
  explosions: Explosion[];
  cities: City[];
  batteries: Battery[];
  language: 'en' | 'zh';
}
