<script setup>
// 右下角“加入我们”悬浮按钮，hover 弹出招新群二维码。
</script>

<template>
  <div class="floating-join-button">
    <span>加入<br />我们</span>
    <div class="qrcode-popup">
      <img src="/images/join_us.png" alt="招新群二维码" />
      <p>扫码加入招新群</p>
    </div>
  </div>
</template>

<style scoped>
.floating-join-button {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4da6ff, #1a8cff);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  line-height: 1.3;
  text-align: center;
  padding: 0 10px;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition:
    transform var(--transition),
    box-shadow var(--transition),
    background var(--transition);
}
.floating-join-button:hover {
  background: linear-gradient(135deg, #3399ff, #0077e6);
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}
.qrcode-popup {
  position: absolute;
  right: 0;
  bottom: 90px;
  width: 200px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition:
    opacity var(--transition),
    transform var(--transition),
    visibility var(--transition);
}
.floating-join-button:hover .qrcode-popup {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.qrcode-popup img {
  width: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.qrcode-popup p {
  color: #555;
  font-size: 15px;
  font-weight: 500;
}

@media (max-width: 576px) {
  .floating-join-button {
    width: 64px;
    height: 64px;
    font-size: 13px;
    right: 16px;
    bottom: 16px;
  }
}
</style>
