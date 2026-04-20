import { createStore } from "vuex";
import { Direction, Difficulty } from "@/store/enums";
import { areOppositeDirections, areSameCoordinates } from "@/utils/index";
import { IStore, IObstacle, ILeaderboardEntry } from "./interfaces";

const LEADERBOARD_KEY = "snake-leaderboard";
const MAX_LEADERBOARD_ENTRIES = 10;

function loadLeaderboard(): ILeaderboardEntry[] {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load leaderboard:", e);
  }
  return [];
}

function saveLeaderboard(leaderboard: ILeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch (e) {
    console.error("Failed to save leaderboard:", e);
  }
}

const store = createStore({
  state() {
    return {
      playground: {
        direction: Direction.RIGHT,
        isGameOver: false,
      },
      grid: [],
      snake: undefined,
      snack: undefined,
      obstacles: [],
      tickRate: 150,
      isPlaying: false,
      difficulty: Difficulty.EASY,
      leaderboard: loadLeaderboard(),

      packageVersion: __APP_VERSION__ || "0",
    } as IStore;
  },

  mutations: {
    SET_GRID(state, grid) {
      state.grid = grid;
    },
    SET_SNAKE(state, snake) {
      state.snake = snake;
    },
    SET_SNACK(state, snack) {
      state.snack = snack;
    },
    SET_OBSTACLES(state, obstacles: IObstacle[]) {
      state.obstacles = obstacles;
    },
    RESET_GAME(state) {
      state.grid = [];
      state.snack = undefined;
      state.snake = undefined;
      state.obstacles = [];
      state.playground.isGameOver = false;
    },
    IS_PLAYING(state, val) {
      state.isPlaying = val;
    },
    SET_DIFFICULTY(state, difficulty: Difficulty) {
      state.difficulty = difficulty;
      switch (difficulty) {
        case Difficulty.EASY:
          state.tickRate = 150;
          break;
        case Difficulty.MEDIUM:
          state.tickRate = 75;
          break;
        case Difficulty.HARD:
          state.tickRate = 75;
          break;
      }
    },
    SNAKE_CHANGE_DIRECTION(state, direction) {
      if (!areOppositeDirections(state.playground.direction, direction))
        state.playground.direction = direction;
    },
    SNAKE_MOVE(state, payload) {
      if (!state.snake) return;
      if (!state.snack) return;
      const isSnakeEating = payload.isSnakeEating;
      if (isSnakeEating && state.difficulty === Difficulty.EASY) state.tickRate += 1;

      const snakeHead_new = payload.directionTicks[state.playground.direction](
        payload.snakeHead.x,
        payload.snakeHead.y
      );
      const snakeNeck = state.snake.coordinates[1];

      const snakeHead =
        !snakeNeck || !areSameCoordinates(snakeHead_new, snakeNeck)
          ? snakeHead_new
          : payload.snakeHead.x > snakeNeck.x
          ? payload.directionTicks[Direction.RIGHT](
              payload.snakeHead.x,
              payload.snakeHead.y
            )
          : payload.snakeHead.x < snakeNeck.x
          ? payload.directionTicks[Direction.LEFT](
              payload.snakeHead.x,
              payload.snakeHead.y
            )
          : payload.snakeHead.y > snakeNeck.y
          ? payload.directionTicks[Direction.DOWN](
              payload.snakeHead.x,
              payload.snakeHead.y
            )
          : payload.directionTicks[Direction.UP](
              payload.snakeHead.x,
              payload.snakeHead.y
            );

      const snakeTail = isSnakeEating
        ? state.snake.coordinates
        : payload.snakeTail;
      const snackCoordinate = isSnakeEating
        ? payload.snackRandomCoordinate
        : state.snack.coordinate;

      state.snake.coordinates = [snakeHead, ...snakeTail];
      state.snack.coordinate = snackCoordinate;
    },
    GAME_OVER(state) {
      state.playground.isGameOver = true;
    },
    ADD_TO_LEADERBOARD(state, entry: ILeaderboardEntry) {
      const newLeaderboard = [...state.leaderboard, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      state.leaderboard = newLeaderboard;
      saveLeaderboard(newLeaderboard);
    },
    CLEAR_LEADERBOARD(state) {
      state.leaderboard = [];
      saveLeaderboard([]);
    },
  },

  getters: {
    appVersion: (state) => {
      return state.packageVersion;
    },
    scoreMultiplier: (state) => {
      switch (state.difficulty) {
        case Difficulty.EASY:
          return 1;
        case Difficulty.MEDIUM:
          return 2;
        case Difficulty.HARD:
          return 3;
        default:
          return 1;
      }
    },
  },
});

export default store;
