export interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string;
  images: string[];
  location: string;
  category: string;
}

export interface Comment {
  id: number;
  user_id: number;
  username: string;
  project_id: number;
  content: string;
  rating: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}
