<template>
  <v-popup @closed="$emit('closed')">
    <template #description>
      <div class="versus-popup">
        <h2 class="versus-title">人机对战模式</h2>
        
        <div class="section">
          <h3 class="section-title">游戏规则</h3>
          <ul class="rules-list">
            <li>边界无效，蛇可以从一边穿到另一边</li>
            <li>撞到自己或对方蛇身判定失败</li>
            <li>蛇头相撞时，长度短的一方失败</li>
            <li>没有碰撞情况下，最先达到20分获胜</li>
          </ul>
        </div>

        <div class="section">
          <h3 class="section-title">食物类型</h3>
          <div class="food-types">
            <div class="food-item">
              <div class="food-icon normal-food"></div>
              <div class="food-info">
                <div class="food-name">普通食物</div>
                <div class="food-effect">长度+1，分数+1</div>
              </div>
            </div>
            <div class="food-item">
              <div class="food-icon speed-food"></div>
              <div class="food-info">
                <div class="food-name">加速食物</div>
                <div class="food-effect">长度+1，分数+1，5秒内速度+50%</div>
              </div>
            </div>
            <div class="food-item">
              <div class="food-icon shield-food"></div>
              <div class="food-info">
                <div class="food-name">护盾食物</div>
                <div class="food-effect">长度+1，分数+1，5秒内无敌</div>
              </div>
            </div>
            <div class="food-item">
              <div class="food-icon poison-food"></div>
              <div class="food-info">
                <div class="food-name">毒药食物</div>
                <div class="food-effect">长度-2，分数-2，10秒后消失（闪烁）</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">难度选择</h3>
          <div class="difficulty-buttons">
            <button
              class="difficulty-btn easy"
              :class="{ selected: selectedDifficulty === 'EASY' }"
              @click="selectDifficulty('EASY')"
            >
              <div class="btn-title">简单模式</div>
              <div class="btn-desc">AI速度50%，智能度低，会吃毒药</div>
            </button>
            <button
              class="difficulty-btn hard"
              :class="{ selected: selectedDifficulty === 'HARD' }"
              @click="selectDifficulty('HARD')"
            >
              <div class="btn-title">困难模式</div>
              <div class="btn-desc">AI速度与玩家一致，智能优化，优先躲避危险</div>
            </button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="start-btn" @click="onStart">开始对战</button>
        </div>
      </div>
    </template>
  </v-popup>
</template>

<script lang="ts">
import { ref } from "vue";
import VPopup from "@/components/Popup.vue";

export default {
  name: "VersusModePopup",
  components: {
    VPopup,
  },
  setup() {
    const selectedDifficulty = ref<string>("EASY");

    function selectDifficulty(difficulty: string) {
      selectedDifficulty.value = difficulty;
    }

    function onStart() {
      window.dispatchEvent(
        new CustomEvent("start-versus-game", {
          detail: { difficulty: selectedDifficulty.value },
        })
      );
    }

    return {
      selectedDifficulty,
      selectDifficulty,
      onStart,
    };
  },
};
</script>

<style lang="postcss" scoped>
.versus-popup {
  max-height: 80vh;
  overflow-y: auto;
  color: #333;
}

.versus-title {
  text-align: center;
  color: #27ae60;
  font-size: 28px;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.section {
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-title {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 12px;
  border-bottom: 2px solid #27ae60;
  padding-bottom: 5px;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
  color: #555;
}

.rules-list li:last-child {
  border-bottom: none;
}

.food-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.food-icon {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  flex-shrink: 0;
}

.normal-food {
  background-color: #d87bf0;
}

.speed-food {
  background-color: #f39c12;
}

.shield-food {
  background-color: #3498db;
}

.poison-food {
  background-color: #e74c3c;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.food-info {
  flex: 1;
}

.food-name {
  font-weight: bold;
  color: #2c3e50;
}

.food-effect {
  font-size: 13px;
  color: #7f8c8d;
}

.difficulty-buttons {
  display: flex;
  gap: 15px;
}

.difficulty-btn {
  flex: 1;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.difficulty-btn:hover {
  border-color: #27ae60;
  transform: translateY(-2px);
}

.difficulty-btn.selected {
  border-color: #27ae60;
  background: #e8f5e9;
  box-shadow: 0 0 10px rgba(39, 174, 96, 0.3);
}

.btn-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.easy .btn-title {
  color: #27ae60;
}

.hard .btn-title {
  color: #e74c3c;
}

.btn-desc {
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
}

.action-buttons {
  text-align: center;
  margin-top: 20px;
}

.start-btn {
  padding: 15px 50px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.5);
}

.start-btn:active {
  transform: translateY(0);
}
</style>
