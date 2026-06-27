<script setup>
import { footerLinks } from "../data/navigation";
</script>

<template>
  <footer class="container-fluid">
    <div class="container footer-main">
      <!-- 品牌 -->
      <div class="footer-col footer-brand">
        <div class="footer-brand-top">
          <img
            src="/images/favicon.png"
            alt="程序设计竞赛协会"
            class="footer-logo"
          />
          <div>
            <p class="footer-name">程序设计竞赛协会</p>
            <p class="footer-tagline">以代码为桥梁，连接技术与未来</p>
          </div>
        </div>
      </div>

      <!-- 快速链接 -->
      <div class="footer-col footer-nav">
        <h4>快速链接</h4>
        <ul>
          <li v-for="link in footerLinks" :key="link.label">
            <RouterLink v-if="link.to" :to="link.to">{{
              link.label
            }}</RouterLink>
            <a v-else :href="link.href" target="_blank" rel="noreferrer">{{
              link.label
            }}</a>
          </li>
        </ul>
      </div>

      <!-- 联系方式 + 关注 -->
      <div class="footer-col footer-contact">
        <h4>联系我们</h4>
        <p><i class="fas fa-envelope"></i>3200513041@qq.com</p>
        <p><i class="fas fa-phone"></i>19970929018</p>
        <p><i class="fas fa-map-marker-alt"></i>江西财经大学麦庐园校区</p>
        <!-- <a
          href="https://www.jxufe.edu.cn/"
          target="_blank"
          rel="noreferrer"
          class="footer-jxufe"
          title="江西财经大学官网"
        >
          <img src="/jxufe.png" alt="江西财经大学" />
        </a> -->
      </div>
    </div>

    <div class="footer-bar">
      <div class="container footer-bar-inner">
        <span>&copy; 2025 程序设计竞赛协会 版权所有</span>
        <span class="footer-bar-sep">|</span>
        <span class="footer-beian">
          <img src="/images/police.png" alt="公安备案" class="police-icon" />
          <a
            href="https://beian.mps.gov.cn/#/query/webSearch?code=36070202001188"
            rel="noreferrer"
            target="_blank"
            >赣公网安备36070202001188号</a
          >
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer"
            >赣ICP备2025069669号-1</a
          >
        </span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ==========================================================================
   Footer
   ========================================================================== */
footer {
  background: #f9fafb;
  color: var(--text);
  border-top: 1px solid #eef0f4;
}

/* ── 主体：三栏 ── */
.footer-main {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: var(--space-xl);
  align-items: start;
  padding: 56px var(--space-md) 48px;
}

/* ── 品牌栏 ── */
.footer-brand {
  align-self: center;
}
.footer-brand-top {
  display: flex;
  align-items: center;
  gap: 14px;
}
.footer-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-top: 2px;
}
.footer-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.footer-tagline {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  white-space: nowrap;
  line-height: 1.5;
}

/* ── 栏目标题 ── */
.footer-col h4 {
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text);
  margin-bottom: 16px;
}

/* ── 快速链接 ── */
.footer-nav ul {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.footer-nav a {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  transition: color var(--transition-fast);
}
.footer-nav a:hover {
  color: var(--primary);
}

/* ── 联系方式 ── */
.footer-contact p {
  font-size: var(--font-size-sm);
  color: var(--text-light);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-contact i {
  color: var(--primary);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  font-size: 0.85rem;
}
.footer-jxufe {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid #e8ecf1;
  background: #fff;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.footer-jxufe:hover {
  border-color: rgba(26, 115, 232, 0.25);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.06);
}
.footer-jxufe img {
  height: 32px;
  width: auto;
}

/* ── 底部备案栏 ── */
.footer-bar {
  border-top: 1px solid #eef0f4;
}
.footer-bar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 18px var(--space-md);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
.footer-bar-sep {
  color: #ddd;
}
.footer-beian {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-beian a {
  color: var(--text-muted);
  transition: color var(--transition-fast);
}
.footer-beian a:hover {
  color: var(--primary);
}
.police-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .footer-main {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
    padding: 40px var(--space-md) 32px;
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
  .footer-brand-top {
    align-items: center;
  }
  .footer-nav ul {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    text-align: center;
  }
  .footer-brand {
    grid-column: auto;
  }
  .footer-brand-top {
    flex-direction: column;
    align-items: center;
  }
  .footer-tagline {
    max-width: none;
  }
  .footer-contact p {
    justify-content: center;
  }
  .footer-nav ul {
    grid-template-columns: 1fr 1fr;
    text-align: left;
    max-width: 280px;
    margin: 0 auto;
  }
  .footer-bar-inner {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
  .footer-bar-sep {
    display: none;
  }
}
</style>
