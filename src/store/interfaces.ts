import { Direction, Difficulty } from "@/store/enums";

export interface ICoordinate {
  x: number;
  y: number;
}

export interface ISnake {
  coordinates: ICoordinate[];
}

export interface ISnack {
  coordinate: ICoordinate;
}

export interface IObstacle {
  coordinates: ICoordinate[];
}

export interface IPlayground {
  direction: Direction;
  isGameOver: boolean;
}

export interface ILeaderboardEntry {
  score: number;
  difficulty: Difficulty;
  timestamp: number;
  gameRule: string;
}

export interface IStore {
  playground: IPlayground;
  grid?: number[];
  snake?: ISnake;
  snack?: ISnack;
  obstacles?: IObstacle[];
  tickRate: number;
  isPlaying: boolean;
  difficulty: Difficulty;
  leaderboard: ILeaderboardEntry[];
  readonly packageVersion: string;
}
