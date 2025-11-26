// types/projects.ts
export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  role: string;
  technologies: string[];
  story: string;
  githubUrl: string | null;
  demoUrl: string | null;
  wall: 'left' | 'right';
  order: number; // position le long du couloir
}

export interface ProjectList {
  projects: Project[];
}
