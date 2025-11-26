<template>
  <div class="sidebar">
    <div v-if="!project" class="empty">
      <p>Clique sur un tableau pour voir les détails du projet.</p>
    </div>

    <div v-else>
      <h2>{{ project.title }}</h2>
      <p class="role">{{ project.role }}</p>
      <p class="short">{{ project.shortDescription }}</p>

      <h3>Technologies</h3>
      <div class="tags">
        <span v-for="tech in project.technologies" :key="tech" class="tag">
          {{ tech }}
        </span>
      </div>

      <h3>Histoire du projet</h3>
      <p class="story">
        {{ project.story }}
      </p>

      <div class="links">
        <a v-if="project.githubUrl" :href="project.githubUrl" target="_blank">
          Voir sur GitHub
        </a>
        <a v-if="project.demoUrl" :href="project.demoUrl" target="_blank">
          Voir la démo
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '../../types/projects';

defineProps<{
  project: Project | null;
}>();
</script>

<style scoped>
.sidebar {
  height: 100%;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
  font-size: 0.9rem;
}

h2 {
  font-size: 1.2rem;
  margin: 0;
}

.role {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.1rem 0 0.4rem;
}

.short {
  font-size: 0.9rem;
  color: #4b5563;
}

h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tag {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #eff6ff;
  color: #1d4ed8;
}

.story {
  font-size: 0.9rem;
  color: #374151;
}

.links {
  margin-top: auto;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.links a {
  font-size: 0.85rem;
  color: #2563eb;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}
</style>
