export type ProjectCategory = "SAAS" | "REAL ESTATE" | "CINEMATIC" | "MOTION";

export interface Project {
  slug: string;
  title: string;
  category: ProjectCategory;
  year: string;
  client: string;
  role: string;
  software: string[];
  description: string;
  caseStudy?: string;
  video: string;
  poster: string;
  featured?: boolean;
}
