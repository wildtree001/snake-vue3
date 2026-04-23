<template>
  <div class="grid-cell" :class="classNames" />
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { isSnake, isSnack, areSameCoordinates } from "@/utils/index";
import { SnackType, SnakeOwner, GameMode } from "@/store/enums";
import { IAdvancedSnack, IAdvancedSnake } from "@/store/interfaces";

export default {
  name: "Cell",
  props: {
    coordinateY: {
      type: Number,
      required: true,
    },
    coordinateX: {
      type: Number,
      required: true,
    },
    gridSize: {
      type: Number,
      required: true,
    },
    isWallCell: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  setup(props) {
    const store = useStore();
    const snake = computed(() => store.state.snake);
    const snack = computed(() => store.state.snack);
    const isGameOver = computed(() => store.state.playground.isGameOver);
    const gameMode = computed(() => store.state.gameMode);
    const playerSnake = computed(() => store.state.playerSnake);
    const aiSnake = computed(() => store.state.aiSnake);
    const snacks = computed(() => store.state.snacks || []);
    const versusPlayground = computed(() => store.state.versusPlayground);

    const isVersusMode = computed(() => gameMode.value === GameMode.VERSUS);
    const isVersusGameOver = computed(() => versusPlayground.value?.isGameOver);
    const winner = computed(() => versusPlayground.value?.winner);

    function getSnackAtPosition(): IAdvancedSnack | undefined {
      return snacks.value.find((s) =>
        areSameCoordinates(s.coordinate, { x: props.coordinateX, y: props.coordinateY })
      );
    }

    function isPlayerSnakeAtPosition(): boolean {
      if (!playerSnake.value) return false;
      return isSnake(playerSnake.value.coordinates, props.coordinateX, props.coordinateY);
    }

    function isPlayerSnakeHead(): boolean {
      if (!playerSnake.value) return false;
      const head = playerSnake.value.coordinates[0];
      return areSameCoordinates(head, { x: props.coordinateX, y: props.coordinateY });
    }

    function isAiSnakeAtPosition(): boolean {
      if (!aiSnake.value) return false;
      return isSnake(aiSnake.value.coordinates, props.coordinateX, props.coordinateY);
    }

    function isAiSnakeHead(): boolean {
      if (!aiSnake.value) return false;
      const head = aiSnake.value.coordinates[0];
      return areSameCoordinates(head, { x: props.coordinateX, y: props.coordinateY });
    }

    const classNames = computed(() => {
      const classes: Record<string, boolean> = {
        "grid-cell-wall": props.isWallCell,
      };

      if (isVersusMode.value) {
        const playerIsDead = playerSnake.value?.isDead;
        const aiIsDead = aiSnake.value?.isDead;
        const playerWon = winner.value === SnakeOwner.PLAYER;
        const aiWon = winner.value === SnakeOwner.AI;

        if (isPlayerSnakeHead()) {
          classes["grid-cell-player-snake-head"] = true;
          classes["grid-cell-snake-dead"] = !!playerIsDead && !playerWon;
          classes["grid-cell-snake-winner"] = !!playerWon;
          if (playerSnake.value?.isShielded) {
            classes["grid-cell-shielded"] = true;
          }
          if (playerSnake.value?.isSpeedBoosted) {
            classes["grid-cell-speed-boosted"] = true;
          }
        } else if (isPlayerSnakeAtPosition()) {
          classes["grid-cell-player-snake"] = true;
          classes["grid-cell-snake-dead"] = !!playerIsDead && !playerWon;
          classes["grid-cell-snake-winner"] = !!playerWon;
          if (playerSnake.value?.isShielded) {
            classes["grid-cell-shielded"] = true;
          }
        }

        if (isAiSnakeHead()) {
          classes["grid-cell-ai-snake-head"] = true;
          classes["grid-cell-snake-dead"] = !!aiIsDead && !aiWon;
          classes["grid-cell-snake-winner"] = !!aiWon;
          if (aiSnake.value?.isShielded) {
            classes["grid-cell-shielded-ai"] = true;
          }
          if (aiSnake.value?.isSpeedBoosted) {
            classes["grid-cell-speed-boosted-ai"] = true;
          }
        } else if (isAiSnakeAtPosition()) {
          classes["grid-cell-ai-snake"] = true;
          classes["grid-cell-snake-dead"] = !!aiIsDead && !aiWon;
          classes["grid-cell-snake-winner"] = !!aiWon;
          if (aiSnake.value?.isShielded) {
            classes["grid-cell-shielded-ai"] = true;
          }
        }

        const snackAtPos = getSnackAtPosition();
        if (snackAtPos) {
          switch (snackAtPos.type) {
            case SnackType.NORMAL:
              classes["grid-cell-snack-normal"] = true;
              break;
            case SnackType.SPEED:
              classes["grid-cell-snack-speed"] = true;
              break;
            case SnackType.SHIELD:
              classes["grid-cell-snack-shield"] = true;
              break;
            case SnackType.POISON:
              classes["grid-cell-snack-poison"] = true;
              break;
          }
        }
      } else {
        if (snake.value?.coordinates) {
          const isHead = isSnake(
            [snake.value.coordinates[0]],
            props.coordinateX,
            props.coordinateY
          );
          const isBody = isSnake(
            snake.value.coordinates,
            props.coordinateX,
            props.coordinateY
          );

          if (isHead) {
            classes["grid-cell-snake-head"] = !isGameOver.value;
            classes["grid-cell-snake-head-dead"] = isGameOver.value;
          } else if (isBody) {
            classes["grid-cell-snake"] = !isGameOver.value;
            classes["grid-cell-snake-dead"] = isGameOver.value;
          }
        }

        if (snack.value?.coordinate) {
          classes["grid-cell-snack"] = isSnack(
            props.coordinateX,
            props.coordinateY,
            snack.value
          );
        }
      }

      return classes;
    });

    return {
      classNames,
    };
  },
};
</script>

<style>
.grid-cell {
  border-top: 1px solid #363636;
  width: 15px;
  height: 15px;
  position: relative;
}

.grid-cell:not(:first-child) {
  border-left: 1px solid #363636;
}

.grid-cell-wall:not(.grid-cell-snake.grid-cell-game-over.grid-cell-snake-head) {
  background-color: #00d9ff;
}

.grid-cell-snake-head {
  background-color: #15ff00 !important;
}

.grid-cell-snake {
  background-color: #086600;
}

.grid-cell-snake-head-dead {
  background-color: #e72e2e !important;
}

.grid-cell-snake-dead {
  background-color: #ff7171;
}

.grid-cell-snack {
  background-color: #d87bf0;
}

.grid-cell-player-snake-head {
  background-color: #15ff00 !important;
  box-shadow: 0 0 8px #15ff00;
}

.grid-cell-player-snake {
  background-color: #086600;
}

.grid-cell-ai-snake-head {
  background-color: #ff6b6b !important;
  box-shadow: 0 0 8px #ff6b6b;
}

.grid-cell-ai-snake {
  background-color: #8b0000;
}

.grid-cell-snake-winner {
  animation: pulse-winner 1s infinite;
}

@keyframes pulse-winner {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.grid-cell-snack-normal {
  background-color: #d87bf0;
  box-shadow: 0 0 5px #d87bf0;
}

.grid-cell-snack-speed {
  background-color: #f39c12;
  box-shadow: 0 0 5px #f39c12;
}

.grid-cell-snack-shield {
  background-color: #3498db;
  box-shadow: 0 0 5px #3498db;
}

.grid-cell-snack-poison {
  background-color: #e74c3c;
  box-shadow: 0 0 5px #e74c3c;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.grid-cell-shielded {
  outline: 2px solid #3498db;
  outline-offset: -2px;
  animation: shield-glow 1s infinite;
}

.grid-cell-shielded-ai {
  outline: 2px solid #3498db;
  outline-offset: -2px;
  animation: shield-glow-ai 1s infinite;
}

@keyframes shield-glow {
  0%, 100% {
    box-shadow: 0 0 8px #3498db, inset 0 0 4px rgba(52, 152, 219, 0.5);
  }
  50% {
    box-shadow: 0 0 15px #3498db, inset 0 0 8px rgba(52, 152, 219, 0.7);
  }
}

@keyframes shield-glow-ai {
  0%, 100% {
    box-shadow: 0 0 8px #3498db, inset 0 0 4px rgba(52, 152, 219, 0.5);
  }
  50% {
    box-shadow: 0 0 15px #3498db, inset 0 0 8px rgba(52, 152, 219, 0.7);
  }
}

.grid-cell-speed-boosted {
  animation: speed-glow 0.5s infinite;
}

.grid-cell-speed-boosted-ai {
  animation: speed-glow-ai 0.5s infinite;
}

@keyframes speed-glow {
  0%, 100% {
    box-shadow: 0 0 5px #f39c12;
  }
  50% {
    box-shadow: 0 0 12px #f39c12;
  }
}

@keyframes speed-glow-ai {
  0%, 100% {
    box-shadow: 0 0 5px #f39c12;
  }
  50% {
    box-shadow: 0 0 12px #f39c12;
  }
}
</style>
