import { Direction, Difficulty, SnackType, SnakeOwner } from "@/store/enums";
import { ICoordinate, IAdvancedSnake, IAdvancedSnack } from "@/store/interfaces";
import {
  getDistance,
  getNextPosition,
  isPositionBlocked,
  getAvailableDirections,
  getDirectionToTarget,
  areSameCoordinates,
} from "@/utils/index";

const GRID_SIZE = 35;
const POISON_LIFETIME = 10000;

function evaluateSnack(
  snack: IAdvancedSnack,
  aiSnake: IAdvancedSnake,
  difficulty: Difficulty,
  currentTime: number
): number {
  const baseScore = getDistance(aiSnake.coordinates[0], snack.coordinate);

  if (snack.type === SnackType.POISON) {
    const age = currentTime - snack.createdAt;
    if (difficulty === Difficulty.EASY) {
      if (age > POISON_LIFETIME * 0.7) {
        return baseScore + 20;
      }
      return baseScore + 5;
    } else {
      return Infinity;
    }
  }

  if (snack.type === SnackType.SHIELD) {
    return baseScore - 10;
  }
  if (snack.type === SnackType.SPEED) {
    return baseScore - 5;
  }

  return baseScore;
}

function findBestTarget(
  snacks: IAdvancedSnack[],
  aiSnake: IAdvancedSnake,
  difficulty: Difficulty,
  currentTime: number
): IAdvancedSnack | null {
  if (snacks.length === 0) return null;

  const sortedSnacks = [...snacks].sort((a, b) => {
    const scoreA = evaluateSnack(a, aiSnake, difficulty, currentTime);
    const scoreB = evaluateSnack(b, aiSnake, difficulty, currentTime);
    return scoreA - scoreB;
  });

  if (difficulty === Difficulty.HARD) {
    const validSnacks = sortedSnacks.filter((s) => {
      const targetDir = getDirectionToTarget(
        aiSnake.coordinates[0],
        s.coordinate,
        aiSnake.direction,
        GRID_SIZE,
        false
      );
      if (!targetDir) return false;

      const nextPos = getNextPosition(
        aiSnake.coordinates[0],
        targetDir,
        GRID_SIZE,
        false
      );

      return !isPositionBlocked(nextPos, aiSnake, aiSnake, GRID_SIZE, false);
    });

    if (validSnacks.length > 0) {
      return validSnacks[0];
    }
  }

  return sortedSnacks[0];
}

function predictDanger(
  snake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  aiSnake: IAdvancedSnake,
  gridSize: number,
  steps: number = 3
): Direction | null {
  const head = snake.coordinates[0];
  const availableDirs = getAvailableDirections(snake, playerSnake, aiSnake, gridSize, false);

  if (availableDirs.length === 0) return null;

  const safeDirs: Direction[] = [];

  for (const dir of availableDirs) {
    let isSafe = true;
    let currentPos = head;
    let tempDirection = snake.direction;

    for (let step = 0; step < steps; step++) {
      const nextPos = getNextPosition(currentPos, tempDirection, gridSize, false);
      const tempSnake: IAdvancedSnake = {
        ...snake,
        direction: tempDirection,
        coordinates: [nextPos, ...snake.coordinates.slice(0, -1)],
      };

      if (isPositionBlocked(nextPos, playerSnake, aiSnake, gridSize, false)) {
        isSafe = false;
        break;
      }

      currentPos = nextPos;
    }

    if (isSafe) {
      safeDirs.push(dir);
    }
  }

  if (safeDirs.length > 0) {
    return safeDirs[Math.floor(Math.random() * safeDirs.length)];
  }

  return availableDirs[0];
}

export function getAIDirection(
  aiSnake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  snacks: IAdvancedSnack[],
  difficulty: Difficulty
): Direction {
  const currentTime = Date.now();
  const availableDirs = getAvailableDirections(aiSnake, playerSnake, aiSnake, GRID_SIZE, false);

  if (availableDirs.length === 0) {
    return aiSnake.direction;
  }

  if (difficulty === Difficulty.HARD) {
    const dangerDir = predictDanger(aiSnake, playerSnake, aiSnake, GRID_SIZE, 2);
    if (dangerDir) {
      return dangerDir;
    }
  }

  const targetSnack = findBestTarget(snacks, aiSnake, difficulty, currentTime);

  if (targetSnack) {
    const targetDir = getDirectionToTarget(
      aiSnake.coordinates[0],
      targetSnack.coordinate,
      aiSnake.direction,
      GRID_SIZE,
      false
    );

    if (targetDir && availableDirs.includes(targetDir)) {
      if (difficulty === Difficulty.HARD) {
        const nextPos = getNextPosition(
          aiSnake.coordinates[0],
          targetDir,
          GRID_SIZE,
          false
        );
        if (!isPositionBlocked(nextPos, playerSnake, aiSnake, GRID_SIZE, false)) {
          return targetDir;
        }
      } else {
        return targetDir;
      }
    }
  }

  if (difficulty === Difficulty.EASY) {
    const goodDirs = availableDirs.filter((dir) => {
      const nextPos = getNextPosition(
        aiSnake.coordinates[0],
        dir,
        GRID_SIZE,
        false
      );
      return !isPositionBlocked(nextPos, playerSnake, aiSnake, GRID_SIZE, false);
    });

    if (goodDirs.length > 0) {
      if (Math.random() < 0.3) {
        return goodDirs[Math.floor(Math.random() * goodDirs.length)];
      }
    }
  }

  if (difficulty === Difficulty.HARD) {
    let bestDir = availableDirs[0];
    let bestScore = -Infinity;

    for (const dir of availableDirs) {
      const nextPos = getNextPosition(
        aiSnake.coordinates[0],
        dir,
        GRID_SIZE,
        false
      );

      if (isPositionBlocked(nextPos, playerSnake, aiSnake, GRID_SIZE, false)) {
        continue;
      }

      const futureSnake: IAdvancedSnake = {
        ...aiSnake,
        direction: dir,
        coordinates: [nextPos, ...aiSnake.coordinates.slice(0, -1)],
      };

      const futureAvailable = getAvailableDirections(futureSnake, playerSnake, aiSnake, GRID_SIZE, false);
      const score = futureAvailable.length * 10;

      if (score > bestScore) {
        bestScore = score;
        bestDir = dir;
      }
    }

    return bestDir;
  }

  return availableDirs[Math.floor(Math.random() * availableDirs.length)];
}
