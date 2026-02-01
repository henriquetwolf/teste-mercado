
export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  description: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructor_id?: string; // ID do usuário Supabase que criou o curso
  price: number;
  thumbnail: string;
  modules: Module[];
  rating: number;
  students: number;
}

export interface UserProgress {
  courseId: string;
  completedLessons: string[];
}
