import { Direction } from "@/store/enums";
import { ICoordinate, IAdvancedSnake } from "@/store/interfaces";

function isPosition(
  x: number,
  y: number,
  diffX: number,
  diffY: number
): boolean {
  return x === diffX && y === diffY;
}

function areSameCoordinates(
  coordinates_a: ICoordinate,
  coordinates_b: ICoordinate
): boolean {
  return isPosition(
    coordinates_a.x,
    coordinates_a.y,
    coordinates_b.x,
    coordinates_b.y
  );
}

function isSnake(snakeCoordinates: ICoordinate[], x: number, y: number): boolean {
  if (!snakeCoordinates.length) return false;

  return (
    snakeCoordinates.filter((coord) => isPosition(coord.x, coord.y, x, y))
      .length > 0
  );
}

function isSnack(x: number, y: number, snack: { coordinate: ICoordinate }): boolean {
  return isPosition(x, y, snack.coordinate.x, snack.coordinate.y);
}

function areOppositeDirections(direction_a: Direction, direction_b: Direction) {
  return (
    (direction_a === Direction.UP && direction_b === Direction.DOWN) ||
    (direction_a === Direction.DOWN && direction_b === Direction.UP) ||
    (direction_a === Direction.LEFT && direction_b === Direction.RIGHT) ||
    (direction_a === Direction.RIGHT && direction_b === Direction.LEFT)
  );
}

function getDistance(a: ICoordinate, b: ICoordinate): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNextPosition(
  current: ICoordinate,
  direction: Direction,
  gridSize: number,
  hasBorders: boolean = false
): ICoordinate {
  let x = current.x;
  let y = current.y;

  switch (direction) {
    case Direction.UP:
      y -= 1;
      break;
    case Direction.DOWN:
      y += 1;
      break;
    case Direction.LEFT:
      x -= 1;
      break;
    case Direction.RIGHT:
      x += 1;
      break;
  }

  if (!hasBorders) {
    if (x < 0) x = gridSize - 1;
    if (x >= gridSize) x = 0;
    if (y < 0) y = gridSize - 1;
    if (y >= gridSize) y = 0;
  }

  return { x, y };
}

function isPositionBlocked(
  position: ICoordinate,
  playerSnake: IAdvancedSnake,
  aiSnake: IAdvancedSnake,
  gridSize: number,
  hasBorders: boolean = false
): boolean {
  if (hasBorders) {
    if (position.x < 0 || position.x >= gridSize || position.y < 0 || position.y >= gridSize) {
      return true;
    }
  }

  const playerBody = playerSnake.coordinates.slice(0, playerSnake.isShielded ? 0 : -1);
  const aiBody = aiSnake.coordinates.slice(0, aiSnake.isShielded ? 0 : -1);

  const allBodies = [...playerBody, ...aiBody];

  return allBodies.some((coord) => areSameCoordinates(coord, position));
}

function getAvailableDirections(
  snake: IAdvancedSnake,
  playerSnake: IAdvancedSnake,
  aiSnake: IAdvancedSnake,
  gridSize: number,
  hasBorders: boolean = false
): Direction[] {
  const allDirections = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  const head = snake.coordinates[0];

  return allDirections.filter((dir) => {
    if (areOppositeDirections(snake.direction, dir)) return false;

    const nextPos = getNextPosition(head, dir, gridSize, hasBorders);
    return !isPositionBlocked(nextPos, playerSnake, aiSnake, gridSize, hasBorders);
  });
}

function getDirectionToTarget(
  from: ICoordinate,
  to: ICoordinate,
  currentDirection: Direction,
  gridSize: number,
  hasBorders: boolean = false
): Direction | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const directions: { dir: Direction; priority: number }[] = [];

  if (dx > 0) directions.push({ dir: Direction.RIGHT, priority: Math.abs(dx) });
  if (dx < 0) directions.push({ dir: Direction.LEFT, priority: Math.abs(dx) });
  if (dy > 0) directions.push({ dir: Direction.DOWN, priority: Math.abs(dy) });
  if (dy < 0) directions.push({ dir: Direction.UP, priority: Math.abs(dy) });

  directions.sort((a, b) => b.priority - a.priority);

  for (const { dir } of directions) {
    if (!areOppositeDirections(currentDirection, dir)) {
      return dir;
    }
  }

  return null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export {
  areSameCoordinates,
  isSnake,
  isSnack,
  areOppositeDirections,
  getDistance,
  getNextPosition,
  isPositionBlocked,
  getAvailableDirections,
  getDirectionToTarget,
  formatDuration,
};
