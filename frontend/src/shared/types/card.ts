export enum CardState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export interface Card {
  id: number;
  courseId: number;
  front: string;
  back: string;
  // FSRS fields
  due: string; // ISO timestamp
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  lastReview: string | null; // ISO timestamp
  stepIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardDto {
  front: string;
  back: string;
}

export interface UpdateCardDto {
  front?: string;
  back?: string;
}

export interface CourseStats {
  total: number;
  new: number;
  learning: number;
  review: number;
  dueToday: number;
}
