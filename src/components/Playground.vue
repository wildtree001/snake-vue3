<template>
  <div class="container">
    <div v-if="isVersusMode" class="versus-score-area">
      <div class="player-info">
        <div class="player-name">玩家 (绿色)</div>
        <div class="score">
          分数: <span class="score-value">{{ playerScore }}</span>
        </div>
        <div class="status-indicators">
          <span v-if="isPlayerShielded" class="status shield">🛡️ 护盾</span>
          <span v-if="isPlayerSpeedBoosted" class="status speed">⚡ 加速</span>
        </div>
      </div>
    </div>

    <div class="score-area score" v-if="!isVersusMode">
      {{ score >= 0 ? "分数:" : "" }}
      <code v-if="score >= 0" class="score-value">{{ score }}</code>
    </div>

    <div class="game-area">
      <v-grid />
    </div>

    <div v-if="isVersusMode" class="versus-score-area">
      <div class="ai-info">
        <div class="player-name">AI (红色)</div>
        <div class="score">
          分数: <span class="score-value-ai">{{ aiScore }}</span>
        </div>
        <div class="status-indicators">
          <span v-if="isAiShielded" class="status shield">🛡️ 护盾</span>
          <span v-if="isAiSpeedBoosted" class="status speed">⚡ 加速</span>
        </div>
      </div>
    </div>

    <div class="score-area scoreboard" v-else></div>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import VGrid from "@/components/Grid.vue";
import { GameMode } from "@/store/enums";

export default {
  name: "Playground",
  components: {
    VGrid,
  },
  props: {
    score: {
      type: Number,
      required: false,
    },
  },
  setup() {
    const store = useStore();

    const gameMode = computed(() => store.state.gameMode);
    const isVersusMode = computed(() => gameMode.value === GameMode.VERSUS);

    const playerScore = computed(() => store.getters.playerScore);
    const aiScore = computed(() => store.getters.aiScore);
    const isPlayerShielded = computed(() => store.getters.isPlayerShielded);
    const isPlayerSpeedBoosted = computed(() => store.getters.isPlayerSpeedBoosted);
    const isAiShielded = computed(() => store.getters.isAiShielded);
    const isAiSpeedBoosted = computed(() => store.getters.isAiSpeedBoosted);

    return {
      isVersusMode,
      playerScore,
      aiScore,
      isPlayerShielded,
      isPlayerSpeedBoosted,
      isAiShielded,
      isAiSpeedBoosted,
    };
  },
};
</script>

<style lang="postcss" scoped>
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  box-sizing: border-box;
  color: white;
  width: 100%;
}

.score {
  flex: 1;
  font-family: "Courier", monospace;
  float: left;
  text-align: left;
  color: rgb(0, 199, 0);
  text-shadow: 1px 1px 1px darkgreen, -1px 1px 1px darkgreen,
    1px -1px 1px darkgreen, -1px -1px 1px darkgreen, 0 0 30px lightgreen,
    0 0 30px lightgreen;
}

.scoreboard {
  flex: 1;
  float: right;
  text-align: right;
}

.score-area {
  font-weight: 900;
  font-size: 40px;
}

.score-value {
  vertical-align: middle;
  color: #15ff00;
}

.game-area {
  flex: 0;
  text-align: center;
  width: inherit;
}

.versus-score-area {
  flex: 1;
  padding: 10px 20px;
  min-width: 180px;
}

.player-info,
.ai-info {
  padding: 15px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
}

.player-info {
  border-left: 4px solid #15ff00;
}

.ai-info {
  border-right: 4px solid #ff6b6b;
  text-align: right;
}

.player-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.player-info .player-name {
  color: #15ff00;
}

.ai-info .player-name {
  color: #ff6b6b;
}

.score {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.score-value {
  color: #15ff00;
  font-family: "Courier", monospace;
}

.score-value-ai {
  color: #ff6b6b;
  font-family: "Courier", monospace;
}

.status-indicators {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ai-info .status-indicators {
  justify-content: flex-end;
}

.status {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.shield {
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
  border: 1px solid #3498db;
}

.speed {
  background: rgba(243, 156, 18, 0.3);
  color: #f39c12;
  border: 1px solid #f39c12;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
