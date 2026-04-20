import { Direction, Difficulty } from "@/store/enums";
import { ICoordinate, IObstacle } from "@/store/interfaces";

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

function isObstacle(
  obstacles: IObstacle[],
  x: number,
  y: number
): boolean {
  if (!obstacles || !obstacles.length) return false;

  for (const obstacle of obstacles) {
    if (
      obstacle.coordinates.filter((coord) => isPosition(coord.x, coord.y, x, y))
        .length > 0
    ) {
      return true;
    }
  }
  return false;
}

function isCoordinateInList(
  coordinate: ICoordinate,
  coordinatesList: ICoordinate[]
): boolean {
  return coordinatesList.some((coord) => areSameCoordinates(coord, coordinate));
}

function isCoordinateInAnyObstacle(
  coordinate: ICoordinate,
  obstacles: IObstacle[]
): boolean {
  for (const obstacle of obstacles) {
    if (isCoordinateInList(coordinate, obstacle.coordinates)) {
      return true;
    }
  }
  return false;
}

function areOppositeDirections(direction_a: Direction, direction_b: Direction) {
  return (
    (direction_a === Direction.UP && direction_b === Direction.DOWN) ||
    (direction_a === Direction.DOWN && direction_b === Direction.UP) ||
    (direction_a === Direction.LEFT && direction_b === Direction.RIGHT) ||
    (direction_a === Direction.RIGHT && direction_b === Direction.LEFT)
  );
}

function getDifficultyName(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.EASY:
      return "简单";
    case Difficulty.MEDIUM:
      return "中等";
    case Difficulty.HARD:
      return "困难";
    default:
      return "未知";
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export {
  areSameCoordinates,
  isSnake,
  isSnack,
  isObstacle,
  isCoordinateInList,
  isCoordinateInAnyObstacle,
  areOppositeDirections,
  getDifficultyName,
  formatTimestamp,
};
