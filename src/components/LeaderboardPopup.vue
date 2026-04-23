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
            <div class="col score">分数</div>
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
  color: #ecf0f1;
}

.leaderboard-title {
  text-align: center;
  color: #2ecc71;
  font-size: 26px;
  margin-bottom: 20px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #95a5a6;
}

.empty-state p {
  margin: 10px 0;
  font-size: 16px;
}

.hint {
  font-size: 14px !important;
  opacity: 0.7;
}

.leaderboard-table {
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.table-header {
  display: flex;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  font-weight: bold;
  padding: 14px 0;
  font-size: 15px;
}

.table-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
  font-size: 14px;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.col {
  text-align: center;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank {
  flex: 1;
  font-weight: bold;
  color: #ecf0f1;
}

.time {
  flex: 2;
  font-family: monospace;
  color: #3498db;
}

.score {
  flex: 1;
  color: #f39c12;
}

.difficulty {
  flex: 1;
}

.medal {
  font-size: 22px;
}

.rank-gold {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 20%);
}

.rank-silver {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.2) 0%, transparent 20%);
}

.rank-bronze {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.2) 0%, transparent 20%);
}

.easy-tag {
  padding: 5px 12px;
  background: rgba(39, 174, 96, 0.3);
  color: #2ecc71;
  border-radius: 15px;
  font-size: 13px;
  font-weight: bold;
  border: 1px solid #27ae60;
}

.hard-tag {
  padding: 5px 12px;
  background: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  border-radius: 15px;
  font-size: 13px;
  font-weight: bold;
  border: 1px solid #c0392b;
}

.action-buttons {
  text-align: center;
  margin-top: 20px;
}

.clear-btn {
  padding: 10px 25px;
  background: transparent;
  color: #e74c3c;
  border: 2px solid #c0392b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: rgba(231, 76, 60, 0.2);
}
</style>
