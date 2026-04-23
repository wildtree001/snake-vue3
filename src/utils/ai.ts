import { Direction, Difficulty, SnackType, SnakeOwner } from "@/store/enums";
import { ICoordinate, IAdvancedSnake, IAdvancedSnack } from "@/store/interfaces";
import {
  getDistance,
  getNextPosition,
  isPositionBlocked,
  getAvailableDirections,
  areSameCoordinates,
} from "@/utils/index";

const GRID_SIZE = 35;
const POISON_LIFETIME = 10000;

function getDirections(): Direction[] {
  return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
}

function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.UP: return Direction.DOWN;
    case Direction.DOWN: return Direction.UP;
    case Direction.LEFT: return Direction.RIGHT;
    case Direction.RIGHT: return Direction.LEFT;
  }
}

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
    return baseScore - 15;
  }
  if (snack.type === SnackType.SPEED) {
    return baseScore - 10;
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

  const validSnacks = snacks.filter(s => {
    if (difficulty === Difficulty.HARD && s.type === SnackType.POISON) {
      return false;
    }
    return true;
  });

  if (validSnacks.length === 0) return null;

  validSnacks.sort((a, b) => {
    const scoreA = evaluateSnack(a, aiSnake, difficulty, currentTime);
    const scoreB = evaluateSnack(b, aiSnake, difficulty, currentTime);
    return scoreA - scoreB;
  });

  return validSnacks[0];
}

function countSafeFutureMoves(
  direction: Direction,
  aiSnake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  gridSize: number,
  depth: number = 2
): number {
  const head = aiSnake.coordinates[0];
  const nextPos = getNextPosition(head, direction, gridSize, false);

  if (isPositionBlocked(nextPos, playerSnake, aiSnake, gridSize, false)) {
    return 0;
  }

  if (depth === 0) {
    return 1;
  }

  const futureSnake: IAdvancedSnake = {
    ...aiSnake,
    direction: direction,
    coordinates: [nextPos, ...aiSnake.coordinates.slice(0, -1)],
  };

  const futureDirs = getAvailableDirections(futureSnake, playerSnake, aiSnake, gridSize, false);
  let totalMoves = 1;

  for (const dir of futureDirs) {
    totalMoves += countSafeFutureMoves(dir, futureSnake, playerSnake, gridSize, depth - 1);
  }

  return totalMoves;
}

function getDirectPathDirection(
  from: ICoordinate,
  to: ICoordinate,
  currentDirection: Direction,
  aiSnake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  gridSize: number
): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const horizontalDir: Direction | null = dx > 0 ? Direction.RIGHT : (dx < 0 ? Direction.LEFT : null);
  const verticalDir: Direction | null = dy > 0 ? Direction.DOWN : (dy < 0 ? Direction.UP : null);

  const candidates: Direction[] = [];

  if (horizontalDir && horizontalDir !== getOppositeDirection(currentDirection)) {
    candidates.push(horizontalDir);
  }
  if (verticalDir && verticalDir !== getOppositeDirection(currentDirection)) {
    candidates.push(verticalDir);
  }

  for (const dir of candidates) {
    const nextPos = getNextPosition(from, dir, gridSize, false);
    if (!isPositionBlocked(nextPos, playerSnake, aiSnake, gridSize, false)) {
      return dir;
    }
  }

  return null;
}

function escapeDeadEnd(
  availableDirs: Direction[],
  aiSnake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  gridSize: number
): Direction {
  if (availableDirs.length === 0) {
    return aiSnake.direction;
  }

  let bestDir = availableDirs[0];
  let bestMoves = -1;

  for (const dir of availableDirs) {
    const moves = countSafeFutureMoves(dir, aiSnake, playerSnake, gridSize, 2);
    if (moves > bestMoves) {
      bestMoves = moves;
      bestDir = dir;
    } else if (moves === bestMoves && Math.random() < 0.3) {
      bestDir = dir;
    }
  }

  return bestDir;
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

  if (difficulty === Difficulty.EASY) {
    if (Math.random() < 0.25 && availableDirs.length > 0) {
      return availableDirs[Math.floor(Math.random() * availableDirs.length)];
    }

    const target = findBestTarget(snacks, aiSnake, difficulty, currentTime);
    if (target) {
      const dir = getDirectPathDirection(
        aiSnake.coordinates[0],
        target.coordinate,
        aiSnake.direction,
        aiSnake,
        playerSnake,
        GRID_SIZE
      );
      if (dir && availableDirs.includes(dir)) {
        return dir;
      }
    }

    return escapeDeadEnd(availableDirs, aiSnake, playerSnake, GRID_SIZE);
  }

  const target = findBestTarget(snacks, aiSnake, difficulty, currentTime);
  if (target) {
    const dir = getDirectPathDirection(
      aiSnake.coordinates[0],
      target.coordinate,
      aiSnake.direction,
      aiSnake,
      playerSnake,
      GRID_SIZE
    );
    if (dir && availableDirs.includes(dir)) {
      const nextPos = getNextPosition(aiSnake.coordinates[0], dir, GRID_SIZE, false);
      if (!isPositionBlocked(nextPos, playerSnake, aiSnake, GRID_SIZE, false)) {
        const futureMoves = countSafeFutureMoves(dir, aiSnake, playerSnake, GRID_SIZE, 2);
        if (futureMoves > 0) {
          return dir;
        }
      }
    }
  }

  return escapeDeadEnd(availableDirs, aiSnake, playerSnake, GRID_SIZE);
}
