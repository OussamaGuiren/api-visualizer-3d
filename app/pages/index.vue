<template>
  <div class="page">
    <header class="header">
      <h1>Mon Musée de Projets 3D : Projet perso</h1>
      <p>Avance dans la galerie et clique sur un tableau pour découvrir un projet.</p>
    </header>

    <main class="layout">
      <section class="left">
        <ClientOnly>
          <MuseumScene
            :projectList="projectList"
            @projectSelected="selectedProject = $event"
          />
          <template #fallback>
            <div class="center">Initialisation de la scène…</div>
          </template>
        </ClientOnly>
      </section>

      <section class="right">
        <ProjectSidebar :project="selectedProject" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MuseumScene from '~/components/MuseumScene.vue';
import ProjectSidebar from '../components/ProjectSidebare.vue';
import { useProjects } from '../../composables/useProjects';
import type { Project } from '../../types/projects';

const { projectList, loadProjects } = useProjects();
const selectedProject = ref<Project | null>(null);

onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 1rem 1.5rem;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.header h1 {
  font-size: 1.6rem;
  margin: 0;
}

.header p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(320px, 380px);
  gap: 1rem;
}

.left {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.right {
  min-height: 0;
}

.center {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
