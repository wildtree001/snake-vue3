<template>
  <v-popup @closed="$emit('closed')">
    <template #description>
      <div class="versus-popup">
        <h2 class="versus-title">选择难度</h2>
        
        <div class="difficulty-cards">
          <div
            class="difficulty-card easy-card"
            :class="{ selected: selectedDifficulty === 'EASY' }"
            @click="selectDifficulty('EASY')"
          >
            <div class="card-icon">😊</div>
            <div class="card-title">简单模式</div>
            <div class="card-desc">
              <p>AI速度较慢</p>
              <p>智能度较低</p>
              <p>会误食毒药</p>
            </div>
            <div class="check-mark" v-if="selectedDifficulty === 'EASY'">✓</div>
          </div>

          <div
            class="difficulty-card hard-card"
            :class="{ selected: selectedDifficulty === 'HARD' }"
            @click="selectDifficulty('HARD')"
          >
            <div class="card-icon">😈</div>
            <div class="card-title">困难模式</div>
            <div class="card-desc">
              <p>AI速度与玩家一致</p>
              <p>智能避障寻路</p>
              <p>不吃毒药</p>
            </div>
            <div class="check-mark" v-if="selectedDifficulty === 'HARD'">✓</div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="help-btn" @click="showHelp = true">游戏说明</button>
          <button class="start-btn" @click="onStart">开始游戏</button>
        </div>

        <div v-if="showHelp" class="help-overlay" @click="showHelp = false">
          <div class="help-content" @click.stop>
            <div class="help-header">
              <h3>游戏说明</h3>
              <button class="close-help" @click="showHelp = false">×</button>
            </div>
            
            <div class="help-section">
              <h4>基本规则</h4>
              <ul>
                <li>边界无效，蛇可以从一边穿越到另一边</li>
                <li>撞到自己或对方蛇身判定失败</li>
                <li>蛇头相撞时，长度短的一方失败</li>
                <li>没有碰撞情况下，最先达到20分获胜</li>
              </ul>
            </div>

            <div class="help-section">
              <h4>食物类型</h4>
              <div class="food-list">
                <div class="food-item">
                  <span class="food-color normal"></span>
                  <span><strong>普通食物</strong> - 长度+1，分数+1</span>
                </div>
                <div class="food-item">
                  <span class="food-color speed"></span>
                  <span><strong>加速食物</strong> - 5秒内速度+50%</span>
                </div>
                <div class="food-item">
                  <span class="food-color shield"></span>
                  <span><strong>护盾食物</strong> - 5秒内无敌</span>
                </div>
                <div class="food-item">
                  <span class="food-color poison"></span>
                  <span><strong>毒药食物</strong> - 长度-2，分数-2，10秒后消失</span>
                </div>
              </div>
            </div>

            <div class="help-tip">
              💡 提示：护盾状态下可以穿过蛇身而不失败！
            </div>
          </div>
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
    const showHelp = ref<boolean>(false);

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
      showHelp,
      selectDifficulty,
      onStart,
    };
  },
};
</script>

<style lang="postcss" scoped>
.versus-popup {
  color: #ecf0f1;
}

.versus-title {
  text-align: center;
  color: #2ecc71;
  font-size: 24px;
  margin-bottom: 25px;
  font-weight: bold;
}

.difficulty-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.difficulty-card {
  flex: 1;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
}

.easy-card {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border-color: #27ae60;
}

.hard-card {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  border-color: #c0392b;
}

.difficulty-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.difficulty-card.selected {
  transform: translateY(-5px);
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
}

.easy-card.selected {
  box-shadow: 0 0 20px rgba(39, 174, 96, 0.6);
}

.hard-card.selected {
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.6);
}

.card-icon {
  font-size: 40px;
  text-align: center;
  margin-bottom: 10px;
}

.card-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: white;
}

.card-desc {
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.card-desc p {
  margin: 3px 0;
}

.check-mark {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  color: #27ae60;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.help-btn {
  padding: 12px 30px;
  font-size: 15px;
  font-weight: bold;
  color: #2ecc71;
  background: transparent;
  border: 2px solid #2ecc71;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: rgba(46, 204, 113, 0.1);
}

.start-btn {
  padding: 12px 40px;
  font-size: 16px;
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

.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.help-content {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  padding: 25px;
  border-radius: 12px;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #3498db;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3498db;
}

.help-header h3 {
  margin: 0;
  color: #3498db;
  font-size: 20px;
}

.close-help {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e74c3c;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-help:hover {
  background: #c0392b;
}

.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  color: #2ecc71;
  margin-bottom: 10px;
  font-size: 16px;
}

.help-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-section li {
  padding: 5px 0;
  padding-left: 20px;
  position: relative;
  color: #ecf0f1;
  font-size: 14px;
}

.help-section li:before {
  content: "•";
  position: absolute;
  left: 5px;
  color: #3498db;
}

.food-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.food-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ecf0f1;
  font-size: 14px;
}

.food-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.food-color.normal {
  background: #d87bf0;
}

.food-color.speed {
  background: #f39c12;
}

.food-color.shield {
  background: #3498db;
}

.food-color.poison {
  background: #e74c3c;
}

.help-tip {
  margin-top: 20px;
  padding: 15px;
  background: rgba(52, 152, 219, 0.2);
  border-radius: 8px;
  color: #3498db;
  font-size: 14px;
  text-align: center;
}
</style>
