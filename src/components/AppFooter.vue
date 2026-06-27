<script setup>
import { footerLinks } from "../data/navigation";
</script>

<template>
  <footer class="container-fluid">
    <div class="container footer-content">
      <section class="footer-section">
        <h3>联系我们</h3>
        <p><i class="fas fa-envelope"></i> 3200513041@qq.com</p>
        <p><i class="fas fa-phone"></i> 19970929018</p>
        <p><i class="fas fa-map-marker-alt"></i> 江西财经大学麦庐园校区</p>
      </section>

      <section class="footer-section">
        <h3>关注我们</h3>
        <div class="social-links">
          <a href="https://www.jxufe.edu.cn/" target="_blank" rel="noreferrer">
            <img src="/jxufe.png" alt="江西财经大学" width="40" />
          </a>
        </div>
      </section>

      <section class="footer-section">
        <h3>快速链接</h3>
        <ul>
          <li v-for="link in footerLinks" :key="link.label">
            <RouterLink v-if="link.to" :to="link.to">{{
              link.label
            }}</RouterLink>
            <a v-else :href="link.href">{{ link.label }}</a>
          </li>
        </ul>
      </section>
    </div>

    <div class="container footer-bottom">
      <p>&copy; 2025 程序设计竞赛协会 版权所有</p>
      <p>
        <img
          src="/images/police.png"
          alt="公安备案标识"
          width="29"
          class="logo-image"
        />
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=36070202001188"
          rel="noreferrer"
          target="_blank"
          >赣公网安备36070202001188号</a
        >
        <a href="https://beian.miit.gov.cn">赣ICP备2025069669号-1</a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
footer {
  background: linear-gradient(to bottom, var(--primary-dark), #0a2942);
  color: #fff;
  padding: 30px 0 20px;
}
.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  padding-top: 50px;
  margin-bottom: 40px;
}
.footer-section h3 {
  position: relative;
  margin-bottom: 20px;
  padding-bottom: 10px;
}
.footer-section h3::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 3px;
  background-color: var(--accent);
}
.footer-section p {
  margin-bottom: 10px;
}
.footer-section i {
  margin-right: 10px;
  color: var(--primary-light);
}
.social-links {
  display: flex;
  gap: 15px;
}
.social-links a {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--transition),
    transform var(--transition);
}
.social-links a:hover {
  background-color: var(--accent);
  transform: translateY(-3px);
}
.footer-section ul li {
  margin-bottom: 10px;
}
.footer-section ul a {
  color: rgba(255, 255, 255, 0.8);
}
.footer-section ul a:hover {
  color: #fff;
  padding-left: 5px;
}
.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 576px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    padding-top: 30px;
    text-align: center;
  }
  .footer-section h3::after {
    left: 50%;
    transform: translateX(-50%);
  }
  .social-links {
    justify-content: center;
  }
}
</style>
