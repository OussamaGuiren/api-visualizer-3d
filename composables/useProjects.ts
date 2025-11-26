// composables/useProjects.ts
import { ref } from 'vue';
import type { ProjectList } from '../types/projects';

export function useProjects() {
  const projectList = ref<ProjectList | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadProjects() {
    try {
      loading.value = true;
      error.value = null;

      const res = await fetch('/data/projects.json');
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data = (await res.json()) as ProjectList;
      projectList.value = data;
    } catch (e: any) {
      error.value = e?.message ?? 'Erreur de chargement';
      projectList.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    projectList,
    loading,
    error,
    loadProjects,
  };
}
