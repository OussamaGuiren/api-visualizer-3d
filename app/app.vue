<template>
  <div class="app-shell">
    <!-- Favicon OG orange -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <!-- Top bar -->
    <header class="app-header">
      <div class="app-header-left">
        <div class="app-logo">OG</div>
        <div>
          <div class="app-title">Oussama Guiren Insights</div>
          <div class="app-subtitle">Carte interactive des performances commerciales par département</div>
        </div>
      </div>

      <div class="app-header-right">
        <span class="app-badge app-badge-primary">Démo portfolio</span>
        <span class="app-badge">Nuxt · Three.js . Gsap </span>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
html,
body,
#__nuxt {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #e5e7eb; /* gris clair */
  color: #020617;
}

/* Shell global */
.app-shell {
  min-height: 100vh - 64px;
  display: flex;
  flex-direction: column;
}

/* Top bar */
.app-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.app-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.app-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.app-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 5px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #4b5563;
}

.app-badge-primary {
  border-color: rgba(248, 171, 60, 0.6);
  background: rgba(248, 171, 60, 0.1);
  color: #b45309;
}

/* Zone contenu */
.app-main {
  flex: 1;
  /* padding: 16px; */
}

/* Responsive header */
@media (max-width: 640px) {
  .app-header {
    padding: 0 12px;
  }
  .app-subtitle {
    display: none;
  }
  .app-main {
    padding: 8px;
  }
}
</style>