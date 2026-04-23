import { createStore } from "vuex";
import { Direction, GameMode, Difficulty, SnackType, SnakeOwner } from "@/store/enums";
import { areOppositeDirections, areSameCoordinates } from "@/utils/index";
import { IStore, IAdvancedSnake, IAdvancedSnack, ILeaderboardEntry } from "./interfaces";

const LEADERBOARD_STORAGE_KEY = "snake_versus_leaderboard";

function loadLeaderboard(): ILeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(leaderboard: ILeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    console.error("Failed to save leaderboard");
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
      tickRate: 150,
      isPlaying: false,
      packageVersion: __APP_VERSION__ || "0",
      gameMode: undefined,
      difficulty: undefined,
      playerSnake: undefined,
      aiSnake: undefined,
      snacks: [],
      versusPlayground: undefined,
      leaderboard: loadLeaderboard(),
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
    RESET_GAME(state) {
      state.grid = [];
      state.snack = undefined;
      state.snake = undefined;
      state.playground.isGameOver = false;
    },
    IS_PLAYING(state, val) {
      state.isPlaying = val;
    },
    SNAKE_CHANGE_DIRECTION(state, direction) {
      if (!areOppositeDirections(state.playground.direction, direction))
        state.playground.direction = direction;
    },
    SNAKE_MOVE(state, payload) {
      if (!state.snake) return;
      if (!state.snack) return;
      const isSnakeEating = payload.isSnakeEating;
      if (isSnakeEating) state.tickRate += 1;

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
    SET_GAME_MODE(state, gameMode: GameMode) {
      state.gameMode = gameMode;
    },
    SET_DIFFICULTY(state, difficulty: Difficulty) {
      state.difficulty = difficulty;
    },
    SET_PLAYER_SNAKE(state, snake: IAdvancedSnake) {
      state.playerSnake = snake;
    },
    SET_AI_SNAKE(state, snake: IAdvancedSnake) {
      state.aiSnake = snake;
    },
    SET_SNACKS(state, snacks: IAdvancedSnack[]) {
      state.snacks = snacks;
    },
    SET_VERSUS_PLAYGROUND(state, playground) {
      state.versusPlayground = playground;
    },
    PLAYER_SNAKE_CHANGE_DIRECTION(state, direction: Direction) {
      if (!state.playerSnake) return;
      if (!areOppositeDirections(state.playerSnake.direction, direction))
        state.playerSnake.direction = direction;
    },
    AI_SNAKE_CHANGE_DIRECTION(state, direction: Direction) {
      if (!state.aiSnake) return;
      if (!areOppositeDirections(state.aiSnake.direction, direction))
        state.aiSnake.direction = direction;
    },
    VERSUS_GAME_OVER(state, winner: SnakeOwner) {
      if (!state.versusPlayground) return;
      state.versusPlayground.isGameOver = true;
      state.versusPlayground.winner = winner;
    },
    ADD_LEADERBOARD_ENTRY(state, entry: ILeaderboardEntry) {
      if (!state.leaderboard) {
        state.leaderboard = [];
      }
      state.leaderboard.push(entry);
      state.leaderboard.sort((a, b) => a.duration - b.duration);
      if (state.leaderboard.length > 10) {
        state.leaderboard = state.leaderboard.slice(0, 10);
      }
      saveLeaderboard(state.leaderboard);
    },
    RESET_VERSUS_GAME(state) {
      state.playerSnake = undefined;
      state.aiSnake = undefined;
      state.snacks = [];
      state.versusPlayground = undefined;
      state.gameMode = undefined;
      state.difficulty = undefined;
    },
  },

  getters: {
    appVersion: (state) => {
      return state.packageVersion;
    },
    playerScore: (state) => {
      return state.playerSnake?.coordinates?.length - 1 || 0;
    },
    aiScore: (state) => {
      return state.aiSnake?.coordinates?.length - 1 || 0;
    },
    isPlayerShielded: (state) => {
      return state.playerSnake?.isShielded || false;
    },
    isPlayerSpeedBoosted: (state) => {
      return state.playerSnake?.isSpeedBoosted || false;
    },
    isAiShielded: (state) => {
      return state.aiSnake?.isShielded || false;
    },
    isAiSpeedBoosted: (state) => {
      return state.aiSnake?.isSpeedBoosted || false;
    },
    sortedLeaderboard: (state) => {
      return [...(state.leaderboard || [])].sort((a, b) => a.duration - b.duration);
    },
  },
});

export default store;
