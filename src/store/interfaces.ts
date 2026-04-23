import { Direction, SnackType, SnakeOwner } from "@/store/enums";

export interface ICoordinate {
  x: number;
  y: number;
}

export interface ISnake {
  coordinates: ICoordinate[];
}

export interface IAdvancedSnake extends ISnake {
  owner: SnakeOwner;
  direction: Direction;
  isShielded: boolean;
  shieldEndTime: number;
  isSpeedBoosted: boolean;
  speedBoostEndTime: number;
  isDead: boolean;
}

export interface ISnack {
  coordinate: ICoordinate;
}

export interface IAdvancedSnack extends ISnack {
  type: SnackType;
  createdAt: number;
}

export interface IPlayground {
  direction: Direction;
  isGameOver: boolean;
}

export interface IVersusPlayground {
  isGameOver: boolean;
  winner: SnakeOwner | null;
  gameStartTime: number;
}

export interface ILeaderboardEntry {
  id: string;
  timestamp: number;
  duration: number;
  playerScore: number;
  aiScore: number;
  difficulty: string;
}

export interface IStore {
  playground: IPlayground;
  grid?: number[];
  snake?: ISnake;
  snack?: ISnack;
  tickRate: number;
  isPlaying: boolean;
  readonly packageVersion: string;
  gameMode?: string;
  difficulty?: string;
  playerSnake?: IAdvancedSnake;
  aiSnake?: IAdvancedSnake;
  snacks?: IAdvancedSnack[];
  versusPlayground?: IVersusPlayground;
  leaderboard?: ILeaderboardEntry[];
}
