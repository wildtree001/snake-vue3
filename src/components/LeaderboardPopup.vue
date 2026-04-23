<template>
  <v-popup @closed="$emit('closed')">
    <template #description>
      <div class="leaderboard-popup">
        <h2 class="leaderboard-title">🏆 排行榜</h2>
        
        <div v-if="leaderboard.length === 0" class="empty-state">
          <p>暂无记录</p>
          <p class="hint">在人机对战模式中获胜后，您的记录将显示在这里</p>
        </div>

        <div v-else class="leaderboard-table">
          <div class="table-header">
            <div class="col rank">排名</div>
            <div class="col time">用时</div>
            <div class="col score">获胜分数</div>
            <div class="col difficulty">难度</div>
          </div>

          <div
            v-for="(entry, index) in leaderboard"
            :key="entry.id"
            class="table-row"
            :class="{
              'rank-gold': index === 0,
              'rank-silver': index === 1,
              'rank-bronze': index === 2,
            }"
          >
            <div class="col rank">
              <span v-if="index < 3" class="medal">{{ getMedal(index) }}</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="col time">{{ formatDuration(entry.duration) }}</div>
            <div class="col score">{{ entry.playerScore }}</div>
            <div class="col difficulty">
              <span :class="entry.difficulty === 'EASY' ? 'easy-tag' : 'hard-tag'">
                {{ entry.difficulty === 'EASY' ? '简单' : '困难' }}
              </span>
            </div>
          </div>
        </div>

        <div class="action-buttons" v-if="leaderboard.length > 0">
          <button class="clear-btn" @click="onClear">清空记录</button>
        </div>
      </div>
    </template>
  </v-popup>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import VPopup from "@/components/Popup.vue";
import { formatDuration } from "@/utils/index";

export default {
  name: "LeaderboardPopup",
  components: {
    VPopup,
  },
  setup() {
    const store = useStore();

    const leaderboard = computed(() => store.getters.sortedLeaderboard);

    function getMedal(index: number): string {
      switch (index) {
        case 0:
          return "🥇";
        case 1:
          return "🥈";
        case 2:
          return "🥉";
        default:
          return "";
      }
    }

    function onClear() {
      if (confirm("确定要清空所有排行榜记录吗？")) {
        localStorage.removeItem("snake_versus_leaderboard");
        store.commit("ADD_LEADERBOARD_ENTRY", null);
        window.location.reload();
      }
    }

    return {
      leaderboard,
      getMedal,
      formatDuration,
      onClear,
    };
  },
};
</script>

<style lang="postcss" scoped>
.leaderboard-popup {
  color: #333;
}

.leaderboard-title {
  text-align: center;
  color: #27ae60;
  font-size: 28px;
  margin-bottom: 25px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.empty-state p {
  margin: 10px 0;
}

.hint {
  font-size: 14px;
  opacity: 0.7;
}

.leaderboard-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  background: #27ae60;
  color: white;
  font-weight: bold;
  padding: 12px 0;
}

.table-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #ecf0f1;
  background: white;
  transition: background 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8f9fa;
}

.col {
  text-align: center;
  padding: 0 10px;
}

.rank {
  flex: 1;
  font-weight: bold;
}

.time {
  flex: 2;
  font-family: monospace;
}

.score {
  flex: 1;
}

.difficulty {
  flex: 1;
}

.medal {
  font-size: 20px;
}

.rank-gold {
  background: linear-gradient(90deg, #ffd700 0%, transparent 10%);
}

.rank-silver {
  background: linear-gradient(90deg, #c0c0c0 0%, transparent 10%);
}

.rank-bronze {
  background: linear-gradient(90deg, #cd7f32 0%, transparent 10%);
}

.easy-tag {
  padding: 4px 10px;
  background: #e8f5e9;
  color: #27ae60;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.hard-tag {
  padding: 4px 10px;
  background: #fee;
  color: #e74c3c;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.action-buttons {
  text-align: center;
  margin-top: 20px;
}

.clear-btn {
  padding: 10px 30px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #c0392b;
}
</style>
