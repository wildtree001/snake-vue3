<template>
  <div class="page">
    <div class="header">
      <div class="version">版本 {{ version }}</div>
      <div class="disclaimer">© 版权所有 2023 Ekin Karadag</div>
    </div>
    <h1 class="title">贪吃蛇</h1>
    
    <template v-if="!isPlaying">
      <v-button
        @click="openHowToPlayPopup"
        title="游戏说明"
        class="button"
      />
      <v-button
        @click="onStartGame(gameRuleWithoutBorders)"
        title="无边界模式"
        class="button button-play"
      />
      <v-button
        @click="onStartGame(gameRuleWithBorders)"
        title="有边界模式"
        class="button button-play"
      />
      <v-button
        @click="openVersusPopup"
        title="人机对战"
        class="button button-play button-versus"
      />
      <v-button
        @click="openLeaderboardPopup"
        title="排行榜"
        class="button button-leaderboard"
      />
    </template>

    <v-button
      v-else
      @click="onStopGame"
      :style="{
        marginBottom: '20px',
      }"
      title="停止"
    />

    <v-how-to-play-popup v-if="isShowingHowToPlayPopup" @closed="closeHowToPlayPopup" />
    <v-versus-mode-popup v-if="isShowingVersusPopup" @closed="closeVersusPopup" />
    <v-leaderboard-popup v-if="isShowingLeaderboardPopup" @closed="closeLeaderboardPopup" />

    <div v-if="versusPlayground?.isGameOver" class="versus-result" @click="closeVersusResult">
      <div class="result-box" @click.stop>
        <h2 v-if="versusPlayground.winner === SnakeOwner.PLAYER" class="result-title win">
          🎉 恭喜获胜！
        </h2>
        <h2 v-else class="result-title lose">
          💀 游戏结束
        </h2>
        <div class="result-info">
          <p>
            获胜方: 
            <strong :class="versusPlayground.winner === SnakeOwner.PLAYER ? 'player-win' : 'ai-win'">
              {{ versusPlayground.winner === SnakeOwner.PLAYER ? '玩家' : 'AI' }}
            </strong>
          </p>
          <p>用时: {{ gameDuration }}</p>
          <p>玩家分数: {{ playerScore }}</p>
          <p>AI分数: {{ aiScore }}</p>
        </div>
        <div class="result-buttons">
          <button class="close-result-btn" @click="closeVersusResult">关闭</button>
        </div>
      </div>
    </div>

    <v-playground :score="score" />
    
    <div class="footer">
      <v-social-links class="social-links" />
      <br />
      <a
        class="source-code--link"
        target="_blank"
        href="https://github.com/ekinkaradag/snake-vue3"
        >查看源代码</a
      >
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  type ComputedRef,
  ref,
} from "vue";
import { useStore } from "vuex";
import { areSameCoordinates, isSnake, getNextPosition, isPositionBlocked, formatDuration } from "@/utils/index";
import { getAIDirection } from "@/utils/ai";
import { Direction, GameRule, GameMode, Difficulty, SnackType, SnakeOwner } from "@/store/enums";
import type { ICoordinate, ISnack, ISnake, IAdvancedSnake, IAdvancedSnack, ILeaderboardEntry } from "@/store/interfaces";

import VButton from "@/components/Button.vue";
import VHowToPlayPopup from "@/components/HowToPlayPopup.vue";
import VVersusModePopup from "@/components/VersusModePopup.vue";
import VLeaderboardPopup from "@/components/LeaderboardPopup.vue";
import VGrid from "@/components/Grid.vue";
import VPlayground from "@/components/Playground.vue";
import VSocialLinks from "@/components/SocialLinks.vue";

const GRID_SIZE = 35;
const BASE_TICK_RATE = 150;
const POISON_LIFETIME = 10000;
const SHIELD_DURATION = 5000;
const SPEED_BOOST_DURATION = 5000;
const WIN_SCORE = 20;

const DIRECTION_TICKS_WITHOUT_BORDERS = {
  UP: (x: number, y: number) => ({ x, y: y <= 0 ? GRID_SIZE - 1 : y - 1 }),
  DOWN: (x: number, y: number) => ({ x, y: y >= GRID_SIZE - 1 ? 0 : y + 1 }),
  RIGHT: (x: number, y: number) => ({ x: x >= GRID_SIZE - 1 ? 0 : x + 1, y }),
  LEFT: (x: number, y: number) => ({ x: x <= 0 ? GRID_SIZE - 1 : x - 1, y }),
};

const DIRECTION_TICKS_WITH_BORDERS = {
  UP: (x: number, y: number) => ({ x, y: y - 1 }),
  DOWN: (x: number, y: number) => ({ x, y: y + 1 }),
  RIGHT: (x: number, y: number) => ({ x: x + 1, y }),
  LEFT: (x: number, y: number) => ({ x: x - 1, y }),
};

const KEY_CODES_MAPPER = {
  38: Direction.UP,
  87: Direction.UP,
  39: Direction.RIGHT,
  68: Direction.RIGHT,
  37: Direction.LEFT,
  65: Direction.LEFT,
  40: Direction.DOWN,
  83: Direction.DOWN,
};

export default {
  name: "App",

  components: {
    VButton,
    VHowToPlayPopup,
    VVersusModePopup,
    VLeaderboardPopup,
    VGrid,
    VPlayground,
    VSocialLinks,
  },

  setup() {
    const store = useStore();
    const gameRuleWithoutBorders: ComputedRef<GameRule> = computed(
      () => GameRule.WITHOUT_BORDERS
    );
    const gameRuleWithBorders: ComputedRef<GameRule> = computed(
      () => GameRule.WITH_BORDERS
    );
    const version: ComputedRef<string> = computed(
      () => store.getters.appVersion
    );
    const isPlaying: ComputedRef<boolean> = computed(
      () => store.state.isPlaying
    );
    const currentDirection: ComputedRef<string> = computed(
      () => store.state.playground.direction
    );
    const snack: ComputedRef<ISnack> = computed(() => store.state.snack);
    const snake: ComputedRef<ISnake> = computed(() => store.state.snake);
    const snakeHead: ComputedRef<ICoordinate> = computed(
      () => store.state.snake.coordinates[0]
    );
    const snakeTail: ComputedRef<ICoordinate[]> = computed(() =>
      store.state.snake.coordinates.slice(1)
    );
    const score: ComputedRef<number> = computed(
      () => store.state.snake?.coordinates?.length - 1
    );
    const tickRate: ComputedRef<number> = computed(() => store.state.tickRate);

    const gameMode = computed(() => store.state.gameMode);
    const difficulty = computed(() => store.state.difficulty);
    const playerSnake = computed(() => store.state.playerSnake);
    const aiSnake = computed(() => store.state.aiSnake);
    const snacks = computed(() => store.state.snacks || []);
    const versusPlayground = computed(() => store.state.versusPlayground);
    const playerScore = computed(() => store.getters.playerScore);
    const aiScore = computed(() => store.getters.aiScore);

    const isShowingHowToPlayPopup = ref<boolean>(false);
    const isShowingVersusPopup = ref<boolean>(false);
    const isShowingLeaderboardPopup = ref<boolean>(false);

    const gameStartTime = ref<number>(0);
    const gameDuration = ref<string>("00:00");
    const aiTickCounter = ref<number>(0);

    let mainInterval = setInterval(() => {
      clearInterval(mainInterval);
    }, 1);
    let aiInterval = setInterval(() => {
      clearInterval(aiInterval);
    }, 1);

    generateGrid();

    function getRandomNumber(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomCoordinate() {
      return {
        y: getRandomNumber(1, GRID_SIZE - 1),
        x: getRandomNumber(1, GRID_SIZE - 1),
      };
    }

    function getRandomSnackCoordinate() {
      let newCoordinate = getRandomCoordinate();

      if (
        snake.value.coordinates.find((snakeCellCoordinate) =>
          areSameCoordinates(snakeCellCoordinate, newCoordinate)
        )
      )
        newCoordinate = getRandomSnackCoordinate();

      return newCoordinate;
    }

    function getRandomVersusSnackCoordinate(
      playerSnake: IAdvancedSnake,
      aiSnake: IAdvancedSnake,
      existingSnacks: IAdvancedSnack[]
    ): ICoordinate {
      let newCoordinate = getRandomCoordinate();
      const allBodies = [...playerSnake.coordinates, ...aiSnake.coordinates];
      const allSnackCoords = existingSnacks.map(s => s.coordinate);
      
      const isOccupied = (coord: ICoordinate) => {
        return allBodies.some(c => areSameCoordinates(c, coord)) ||
               allSnackCoords.some(c => areSameCoordinates(c, coord));
      };

      let attempts = 0;
      while (isOccupied(newCoordinate) && attempts < 100) {
        newCoordinate = getRandomCoordinate();
        attempts++;
      }

      return newCoordinate;
    }

    function getSnakeTail() {
      return snake.value.coordinates.slice(
        0,
        snake.value.coordinates.length - 1
      );
    }

    function generateGrid() {
      const grid: number[] = [];

      for (let i: number = 0; i < GRID_SIZE; i++) {
        grid.push(i);
      }

      store.commit("SET_GRID", grid);
    }

    function generateSnake() {
      const snake = {
        coordinates: [
          { x: Math.ceil(GRID_SIZE / 2), y: Math.ceil(GRID_SIZE / 2) },
        ],
      };

      store.commit("SET_SNAKE", snake);
    }

    function generateSnack() {
      const snack = {
        coordinate: getRandomSnackCoordinate(),
      };

      store.commit("SET_SNACK", snack);
    }

    function generateInitials() {
      resetGame();
      generateGrid();
      generateSnake();
      generateSnack();
    }

    function resetGame() {
      store.commit("RESET_GAME");
    }

    function snakeHeadTouchesTail() {
      return isSnake(snakeTail.value, snakeHead.value.x, snakeHead.value.y);
    }

    function isSnakeEating() {
      return areSameCoordinates(snakeHead.value, snack.value.coordinate);
    }

    function isSnakeOutside() {
      return (
        snakeHead.value.x >= GRID_SIZE ||
        snakeHead.value.y >= GRID_SIZE ||
        snakeHead.value.x < 0 ||
        snakeHead.value.y < 0
      );
    }

    function onChangeDirection(e: any) {
      const newDirection = KEY_CODES_MAPPER[e.keyCode];

      if (newDirection) e.preventDefault();
      if (!newDirection) {
        return;
      }

      if (gameMode.value === GameMode.VERSUS) {
        if (playerSnake.value) {
          store.commit("PLAYER_SNAKE_CHANGE_DIRECTION", newDirection);
        }
      } else {
        if (newDirection === currentDirection.value) {
          return;
        }
        store.commit("SNAKE_CHANGE_DIRECTION", newDirection);
      }
    }

    function onTick(gameRule: GameRule) {
      if (
        snakeHeadTouchesTail() ||
        (gameRule === GameRule.WITH_BORDERS && isSnakeOutside())
      ) {
        store.commit("GAME_OVER");
        onStopGame();
      } else {
        store.commit("SNAKE_MOVE", {
          isSnakeEating: isSnakeEating(),
          directionTicks:
            gameRule === GameRule.WITHOUT_BORDERS
              ? DIRECTION_TICKS_WITHOUT_BORDERS
              : DIRECTION_TICKS_WITH_BORDERS,
          snakeHead: snakeHead.value,
          snakeTail: getSnakeTail(),
          snackRandomCoordinate: getRandomSnackCoordinate(),
        });
      }
    }

    function openHowToPlayPopup() {
      if (!isShowingHowToPlayPopup.value) isShowingHowToPlayPopup.value = true;
    }

    function closeHowToPlayPopup() {
      if (isShowingHowToPlayPopup.value) isShowingHowToPlayPopup.value = false;
    }

    function openVersusPopup() {
      if (!isShowingVersusPopup.value) isShowingVersusPopup.value = true;
    }

    function closeVersusPopup() {
      if (isShowingVersusPopup.value) isShowingVersusPopup.value = false;
    }

    function openLeaderboardPopup() {
      if (!isShowingLeaderboardPopup.value) isShowingLeaderboardPopup.value = true;
    }

    function closeLeaderboardPopup() {
      if (isShowingLeaderboardPopup.value) isShowingLeaderboardPopup.value = false;
    }

    function closeVersusResult() {
      store.commit("RESET_VERSUS_GAME");
    }

    function getRandomSnackType(): SnackType {
      const rand = Math.random();
      if (rand < 0.5) return SnackType.NORMAL;
      if (rand < 0.7) return SnackType.SPEED;
      if (rand < 0.85) return SnackType.SHIELD;
      return SnackType.POISON;
    }

    function getNonPoisonSnackType(): SnackType {
      const rand = Math.random();
      if (rand < 0.6) return SnackType.NORMAL;
      if (rand < 0.8) return SnackType.SPEED;
      return SnackType.SHIELD;
    }

    function generateInitialVersusSnacks() {
      const snacks: IAdvancedSnack[] = [];
      const now = Date.now();

      for (let i = 0; i < 2; i++) {
        const coord = getRandomVersusSnackCoordinate(
          playerSnake.value!,
          aiSnake.value!,
          snacks
        );
        snacks.push({
          coordinate: coord,
          type: SnackType.NORMAL,
          createdAt: now,
        });
      }

      if (Math.random() < 0.3) {
        const coord = getRandomVersusSnackCoordinate(
          playerSnake.value!,
          aiSnake.value!,
          snacks
        );
        snacks.push({
          coordinate: coord,
          type: SnackType.POISON,
          createdAt: now,
        });
      }

      store.commit("SET_SNACKS", snacks);
    }

    function generateVersusSnake(startX: number, startY: number, owner: SnakeOwner, direction: Direction): IAdvancedSnake {
      return {
        coordinates: [{ x: startX, y: startY }],
        owner: owner,
        direction: direction,
        isShielded: false,
        shieldEndTime: 0,
        isSpeedBoosted: false,
        speedBoostEndTime: 0,
        isDead: false,
      };
    }

    function generateVersusInitials(difficulty: Difficulty) {
      store.commit("RESET_VERSUS_GAME");
      generateGrid();

      store.commit("SET_GAME_MODE", GameMode.VERSUS);
      store.commit("SET_DIFFICULTY", difficulty);

      const playerSnake = generateVersusSnake(
        Math.ceil(GRID_SIZE / 4),
        Math.ceil(GRID_SIZE / 2),
        SnakeOwner.PLAYER,
        Direction.RIGHT
      );

      const aiSnake = generateVersusSnake(
        Math.ceil(GRID_SIZE * 3 / 4),
        Math.ceil(GRID_SIZE / 2),
        SnakeOwner.AI,
        Direction.LEFT
      );

      store.commit("SET_PLAYER_SNAKE", playerSnake);
      store.commit("SET_AI_SNAKE", aiSnake);

      store.commit("SET_VERSUS_PLAYGROUND", {
        isGameOver: false,
        winner: null,
        gameStartTime: Date.now(),
      });

      gameStartTime.value = Date.now();

      generateInitialVersusSnacks();
    }

    function getEffectiveTickRate(baseRate: number, snake: IAdvancedSnake, difficulty: Difficulty, owner: SnakeOwner): number {
      let rate = baseRate;

      if (snake.isSpeedBoosted && Date.now() < snake.speedBoostEndTime) {
        rate = Math.floor(rate / 1.5);
      }

      if (owner === SnakeOwner.AI && difficulty === Difficulty.EASY) {
        rate = Math.floor(rate * 2);
      }

      return rate;
    }

    function updateSnakeEffects(snake: IAdvancedSnake): IAdvancedSnake {
      const now = Date.now();
      return {
        ...snake,
        isShielded: snake.isShielded && now < snake.shieldEndTime,
        isSpeedBoosted: snake.isSpeedBoosted && now < snake.speedBoostEndTime,
      };
    }

    function applySnackEffect(snake: IAdvancedSnake, snackType: SnackType): IAdvancedSnake {
      const now = Date.now();
      let newSnake = { ...snake };

      switch (snackType) {
        case SnackType.SPEED:
          newSnake.isSpeedBoosted = true;
          newSnake.speedBoostEndTime = now + SPEED_BOOST_DURATION;
          break;
        case SnackType.SHIELD:
          newSnake.isShielded = true;
          newSnake.shieldEndTime = now + SHIELD_DURATION;
          break;
        case SnackType.POISON:
          if (newSnake.coordinates.length > 3) {
            newSnake.coordinates = newSnake.coordinates.slice(0, -2);
          } else if (newSnake.coordinates.length > 1) {
            newSnake.coordinates = newSnake.coordinates.slice(0, -1);
          }
          break;
      }

      return newSnake;
    }

    function checkSnakeCollision(
      snake: IAdvancedSnake,
      otherSnake: IAdvancedSnake,
      gridSize: number
    ): boolean {
      if (snake.isShielded) return false;

      const head = snake.coordinates[0];
      const ownBody = snake.coordinates.slice(1);

      for (const coord of ownBody) {
        if (areSameCoordinates(head, coord)) {
          return true;
        }
      }

      const otherBody = otherSnake.isShielded ? otherSnake.coordinates.slice(1) : otherSnake.coordinates;
      for (const coord of otherBody) {
        if (areSameCoordinates(head, coord)) {
          return true;
        }
      }

      return false;
    }

    function checkHeadCollision(
      playerSnake: IAdvancedSnake,
      aiSnake: IAdvancedSnake
    ): SnakeOwner | null {
      const playerHead = playerSnake.coordinates[0];
      const aiHead = aiSnake.coordinates[0];

      if (!areSameCoordinates(playerHead, aiHead)) {
        return null;
      }

      if (playerSnake.isShielded && !aiSnake.isShielded) {
        return SnakeOwner.AI;
      }
      if (aiSnake.isShielded && !playerSnake.isShielded) {
        return SnakeOwner.PLAYER;
      }

      const playerLength = playerSnake.coordinates.length;
      const aiLength = aiSnake.coordinates.length;

      if (playerLength < aiLength) {
        return SnakeOwner.PLAYER;
      } else if (aiLength < playerLength) {
        return SnakeOwner.AI;
      }

      return null;
    }

    function checkScoreWin(): SnakeOwner | null {
      const playerScore = playerSnake.value!.coordinates.length - 1;
      const aiScore = aiSnake.value!.coordinates.length - 1;

      if (playerScore >= WIN_SCORE && aiScore >= WIN_SCORE) {
        return playerScore > aiScore ? SnakeOwner.PLAYER : SnakeOwner.AI;
      }
      if (playerScore >= WIN_SCORE) {
        return SnakeOwner.PLAYER;
      }
      if (aiScore >= WIN_SCORE) {
        return SnakeOwner.AI;
      }
      return null;
    }

    function moveSnake(
      snake: IAdvancedSnake,
      direction: Direction,
      isEating: boolean
    ): IAdvancedSnake {
      const head = snake.coordinates[0];
      const newHead = getNextPosition(head, direction, GRID_SIZE, false);

      let newCoordinates: ICoordinate[];
      if (isEating) {
        newCoordinates = [newHead, ...snake.coordinates];
      } else {
        newCoordinates = [newHead, ...snake.coordinates.slice(0, -1)];
      }

      return {
        ...snake,
        direction: direction,
        coordinates: newCoordinates,
      };
    }

    function updateSnacks(currentSnacks: IAdvancedSnack[]): IAdvancedSnack[] {
      const now = Date.now();
      let updatedSnacks = currentSnacks.filter(s => {
        if (s.type === SnackType.POISON) {
          return now - s.createdAt < POISON_LIFETIME;
        }
        return true;
      });

      let nonPoisonSnacks = updatedSnacks.filter(s => s.type !== SnackType.POISON);
      let poisonSnacks = updatedSnacks.filter(s => s.type === SnackType.POISON);

      while (nonPoisonSnacks.length < 2) {
        const coord = getRandomVersusSnackCoordinate(
          playerSnake.value!,
          aiSnake.value!,
          updatedSnacks
        );
        const newSnack: IAdvancedSnack = {
          coordinate: coord,
          type: getNonPoisonSnackType(),
          createdAt: now,
        };
        updatedSnacks.push(newSnack);
        nonPoisonSnacks.push(newSnack);
      }

      if (poisonSnacks.length === 0 && Math.random() < 0.1) {
        const coord = getRandomVersusSnackCoordinate(
          playerSnake.value!,
          aiSnake.value!,
          updatedSnacks
        );
        const newSnack: IAdvancedSnack = {
          coordinate: coord,
          type: SnackType.POISON,
          createdAt: now,
        };
        updatedSnacks.push(newSnack);
      }

      return updatedSnacks;
    }

    function checkEating(
      snake: IAdvancedSnake,
      snacks: IAdvancedSnack[]
    ): { isEating: boolean; eatenSnack: IAdvancedSnack | null } {
      const head = snake.coordinates[0];
      for (const snack of snacks) {
        if (areSameCoordinates(head, snack.coordinate)) {
          return { isEating: true, eatenSnack: snack };
        }
      }
      return { isEating: false, eatenSnack: null };
    }

    function onVersusTick() {
      if (!playerSnake.value || !aiSnake.value || !versusPlayground.value) return;
      if (versusPlayground.value.isGameOver) {
        onStopGame();
        return;
      }

      const now = Date.now();
      gameDuration.value = formatDuration(now - gameStartTime.value);
      aiTickCounter.value++;

      if (playerSnake.value && aiSnake.value && snacks.value) {
        const aiDirection = getAIDirection(
          aiSnake.value,
          playerSnake.value,
          snacks.value,
          (difficulty.value as Difficulty) || Difficulty.EASY
        );
        store.commit("AI_SNAKE_CHANGE_DIRECTION", aiDirection);
      }

      const isEasyMode = difficulty.value === Difficulty.EASY;
      const shouldAIMove = !isEasyMode || (aiTickCounter.value % 2 === 0);

      let player = updateSnakeEffects(playerSnake.value);
      let ai = updateSnakeEffects(aiSnake.value);
      let currentSnacks = [...snacks.value];

      const playerEating = checkEating(player, currentSnacks);
      const aiEating = shouldAIMove ? checkEating(ai, currentSnacks) : { isEating: false, eatenSnack: null };

      player = moveSnake(player, player.direction, playerEating.isEating);
      if (shouldAIMove) {
        ai = moveSnake(ai, ai.direction, aiEating.isEating);
      }

      if (playerEating.eatenSnack) {
        player = applySnackEffect(player, playerEating.eatenSnack.type);
        currentSnacks = currentSnacks.filter(s => s !== playerEating.eatenSnack);
      }

      if (aiEating.eatenSnack) {
        ai = applySnackEffect(ai, aiEating.eatenSnack.type);
        currentSnacks = currentSnacks.filter(s => s !== aiEating.eatenSnack);
      }

      currentSnacks = updateSnacks(currentSnacks);

      let winner: SnakeOwner | null = null;

      const playerCollision = checkSnakeCollision(player, ai, GRID_SIZE);
      const aiCollision = checkSnakeCollision(ai, player, GRID_SIZE);

      if (playerCollision && aiCollision) {
        winner = checkHeadCollision(player, ai);
        if (!winner) {
          winner = player.coordinates.length < ai.coordinates.length ? SnakeOwner.AI : SnakeOwner.PLAYER;
        }
      } else if (playerCollision) {
        winner = SnakeOwner.AI;
      } else if (aiCollision) {
        winner = SnakeOwner.PLAYER;
      }

      if (!winner) {
        winner = checkScoreWin();
      }

      if (winner) {
        player.isDead = winner === SnakeOwner.PLAYER;
        ai.isDead = winner === SnakeOwner.AI;

        store.commit("SET_PLAYER_SNAKE", player);
        store.commit("SET_AI_SNAKE", ai);
        store.commit("SET_SNACKS", currentSnacks);
        store.commit("VERSUS_GAME_OVER", winner);

        if (winner === SnakeOwner.PLAYER) {
          const entry: ILeaderboardEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            duration: now - gameStartTime.value,
            playerScore: player.coordinates.length - 1,
            aiScore: ai.coordinates.length - 1,
            difficulty: difficulty.value || Difficulty.EASY,
          };
          store.commit("ADD_LEADERBOARD_ENTRY", entry);
        }

        onStopGame();
        return;
      }

      store.commit("SET_PLAYER_SNAKE", player);
      store.commit("SET_AI_SNAKE", ai);
      store.commit("SET_SNACKS", currentSnacks);
    }

    function onAIMove() {
      if (!playerSnake.value || !aiSnake.value || !snacks.value) return;
      if (versusPlayground.value?.isGameOver) return;

      const aiDirection = getAIDirection(
        aiSnake.value,
        playerSnake.value,
        snacks.value,
        (difficulty.value as Difficulty) || Difficulty.EASY
      );

      store.commit("AI_SNAKE_CHANGE_DIRECTION", aiDirection);
    }

    function onStartGame(gameRule: GameRule) {
      onStopGame();
      store.commit("SET_GAME_MODE", GameMode.SINGLE_PLAYER);
      generateInitials();
      store.commit("IS_PLAYING", true);

      mainInterval = setInterval(() => {
        onTick(gameRule);
      }, tickRate.value);
    }

    function onStartVersusGame(difficulty: Difficulty) {
      closeVersusPopup();
      onStopGame();
      
      aiTickCounter.value = 0;
      generateVersusInitials(difficulty);
      store.commit("IS_PLAYING", true);

      mainInterval = setInterval(() => {
        onVersusTick();
      }, BASE_TICK_RATE);
    }

    function onStopGame() {
      clearInterval(mainInterval);
      clearInterval(aiInterval);
      store.commit("IS_PLAYING", false);
    }

    function handleStartVersusGame(e: Event) {
      const customEvent = e as CustomEvent;
      const diff = customEvent.detail.difficulty === "EASY" ? Difficulty.EASY : Difficulty.HARD;
      onStartVersusGame(diff);
    }

    onMounted(() => {
      window.addEventListener("keydown", onChangeDirection);
      window.addEventListener("start-versus-game", handleStartVersusGame);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("keydown", onChangeDirection);
      window.removeEventListener("start-versus-game", handleStartVersusGame);
      clearInterval(mainInterval);
      clearInterval(aiInterval);
    });

    return {
      version,
      gameRuleWithoutBorders,
      gameRuleWithBorders,
      isPlaying,
      score,
      isShowingHowToPlayPopup,
      isShowingVersusPopup,
      isShowingLeaderboardPopup,
      openHowToPlayPopup,
      closeHowToPlayPopup,
      openVersusPopup,
      closeVersusPopup,
      openLeaderboardPopup,
      closeLeaderboardPopup,
      onStartGame,
      onStopGame,
      versusPlayground,
      SnakeOwner,
      gameDuration,
      playerScore,
      aiScore,
    };
  },
};
</script>

<style lang="postcss" scoped>
.page {
  width: 100%;
  text-align: center;
}

.button {
  margin: 0 10px;
  margin-bottom: 20px;
}

.button-play {
  width: 190px;
}

.button-versus {
  background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
  box-shadow: #e74c3c33 0 4px 9px !important;
}

.button-versus:hover {
  background: linear-gradient(135deg, #c0392b, #a93226) !important;
  box-shadow: #ff6b6b33 0 6px 12px !important;
}

.button-leaderboard {
  background: linear-gradient(135deg, #f39c12, #e67e22) !important;
  box-shadow: #f39c1233 0 4px 9px !important;
}

.button-leaderboard:hover {
  background: linear-gradient(135deg, #e67e22, #d35400) !important;
  box-shadow: #f39c1244 0 6px 12px !important;
}

.title {
  color: rgb(0, 199, 0);
  margin-left: 30px;
  letter-spacing: 30px;
  text-shadow: 1px 1px 1px darkgreen, -1px 1px 1px darkgreen,
    1px -1px 1px darkgreen, -1px -1px 1px darkgreen, 0 0 64px lightgreen,
    0 0 64px lightgreen;
  font-size: 64px;
  font-family: "Courier", monospace;
  font-weight: bold;
}

.header {
  width: 100%;
  display: flex;
  flex-direction: row;
  color: gray;
  font-family: sans-serif;
}

.disclaimer {
  flex: 1;
  text-align: end;
}

.social-links {
  margin-bottom: 10px;
}

.source-code--link {
  background-color: gray;
  color: black !important;
  font-size: 14px;
  font-weight: 800;
  border: solid gray;
  border-top-width: 2.6px;
  border-bottom-width: 2.6px;
  border-left-width: 16.6px;
  border-right-width: 16.6px;
  border-radius: 5px;
  text-decoration: none;
  font-family: Inter, -apple-system, system-ui, "Segoe UI", Helvetica, Arial,
    sans-serif;
}

.footer {
  margin-top: 20px;
}

.versus-result {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-box {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  padding: 40px 60px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid #3498db;
}

.result-title {
  font-size: 32px;
  margin-bottom: 20px;
}

.result-title.win {
  color: #2ecc71;
  animation: bounce 0.5s ease infinite alternate;
}

.result-title.lose {
  color: #e74c3c;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-10px);
  }
}

.result-info {
  color: #ecf0f1;
  font-size: 18px;
  line-height: 2;
}

.result-info p {
  margin: 10px 0;
}

.player-win {
  color: #2ecc71;
  font-size: 24px;
}

.ai-win {
  color: #e74c3c;
  font-size: 24px;
}

.result-buttons {
  margin-top: 25px;
}

.close-result-btn {
  padding: 12px 40px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.close-result-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.5);
}
</style>
