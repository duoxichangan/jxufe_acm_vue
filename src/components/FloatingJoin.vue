<script setup>
// 右下角"加入我们"悬浮按钮，hover 弹出招新群二维码。
</script>

<template>
  <div class="floating-join-button">
    <div class="btn-inner">
      <span>加入<br />我们</span>
    </div>
    <div class="qrcode-popup">
      <img src="/images/join_us.png" alt="招新群二维码" />
      <p>扫码加入招新群</p>
    </div>
  </div>
</template>

<style scoped>
.floating-join-button {
  position: fixed;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: var(--z-floating);
  cursor: pointer;
}
.btn-inner {
  width: 80px;
  height: 80px;
  background: var(--accent);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 15px;
  line-height: 1.3;
  text-align: center;
  box-shadow: 0 4px 16px rgba(255,152,0,0.3);
  transition: transform var(--transition), box-shadow var(--transition);
  position: relative;
  z-index: 2;
  animation: float 3s ease-in-out infinite;
}
.floating-join-button:hover .btn-inner {
  transform: scale(1.06);
  box-shadow: 0 6px 20px rgba(255,152,0,0.4);
}
.qrcode-popup {
  position: absolute;
  right: 0;
  bottom: 100px;
  width: 220px;
  padding: var(--space-lg);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: all var(--transition);
}
.qrcode-popup::after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 36px;
  width: 16px;
  height: 16px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: 2px 2px 4px rgba(0,0,0,0.08);
}
.floating-join-button:hover .qrcode-popup {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.qrcode-popup img {
  width: 100%;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid #f0f0f0;
}
.qrcode-popup p {
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
}

@media (max-width: 576px) {
  .floating-join-button {
    right: var(--space-md);
    bottom: var(--space-md);
  }
  .btn-inner {
    width: 64px;
    height: 64px;
    font-size: 13px;
  }
  .qrcode-popup {
    width: 200px;
    bottom: 80px;
  }
}
</style>
