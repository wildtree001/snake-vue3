<template>
  <div class="leaderboard-container">
    <h3 class="leaderboard-title">🏆 得分排行榜</h3>
    <div v-if="leaderboard.length === 0" class="leaderboard-empty">
      暂无游戏记录
    </div>
    <div v-else class="leaderboard-list">
      <div
        v-for="(entry, index) in leaderboard"
        :key="index"
        class="leaderboard-item"
        :class="{
          'leaderboard-item-top': index < 3,
          'leaderboard-item-first': index === 0,
          'leaderboard-item-second': index === 1,
          'leaderboard-item-third': index === 2,
        }"
      >
        <div class="leaderboard-rank">
          <span v-if="index === 0">🥇</span>
          <span v-else-if="index === 1">🥈</span>
          <span v-else-if="index === 2">🥉</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="leaderboard-score">{{ entry.score }} 分</div>
        <div class="leaderboard-difficulty">{{ getDifficultyName(entry.difficulty) }}</div>
        <div class="leaderboard-time">{{ formatTimestamp(entry.timestamp) }}</div>
      </div>
    </div>
    <button v-if="leaderboard.length > 0" class="leaderboard-clear-btn" @click="onClear">
      清空记录
    </button>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { getDifficultyName, formatTimestamp } from "@/utils/index";
import type { ILeaderboardEntry } from "@/store/interfaces";

export default {
  name: "Leaderboard",

  setup() {
    const store = useStore();
    const leaderboard = computed<ILeaderboardEntry[]>(() => store.state.leaderboard);

    function onClear() {
      if (confirm("确定要清空所有游戏记录吗？")) {
        store.commit("CLEAR_LEADERBOARD");
      }
    }

    return {
      leaderboard,
      getDifficultyName,
      formatTimestamp,
      onClear,
    };
  },
};
</script>

<style lang="postcss" scoped>
.leaderboard-container {
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid #00d9ff;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.leaderboard-title {
  color: #00d9ff;
  text-align: center;
  margin: 0 0 15px 0;
  font-size: 20px;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
}

.leaderboard-empty {
  color: #888;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 40px 80px 80px 1fr;
  align-items: center;
  padding: 10px;
  border-radius: 5px;
  background-color: rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-size: 14px;
}

.leaderboard-item-top {
  background-color: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.3);
}

.leaderboard-item-first {
  background-color: rgba(255, 215, 0, 0.2);
  border: 2px solid #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.leaderboard-item-second {
  background-color: rgba(192, 192, 192, 0.2);
  border: 1px solid #c0c0c0;
}

.leaderboard-item-third {
  background-color: rgba(205, 127, 50, 0.2);
  border: 1px solid #cd7f32;
}

.leaderboard-rank {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.leaderboard-item-first .leaderboard-rank,
.leaderboard-item-second .leaderboard-rank,
.leaderboard-item-third .leaderboard-rank {
  font-size: 24px;
}

.leaderboard-score {
  font-weight: bold;
  color: #00c700;
}

.leaderboard-difficulty {
  text-align: center;
  color: #ff9800;
}

.leaderboard-time {
  text-align: right;
  color: #888;
  font-size: 12px;
}

.leaderboard-clear-btn {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: transparent;
  border: 1px solid #e72e2e;
  color: #e72e2e;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
}

.leaderboard-clear-btn:hover {
  background-color: #e72e2e;
  color: white;
}
</style>
