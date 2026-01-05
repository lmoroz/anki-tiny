/**
 * Интерфейс курса (соответствует backend схеме)
 */
export interface Course {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO для создания курса
 */
export interface CreateCourseDto {
  name: string;
  description?: string;
}

/**
 * DTO для обновления курса
 */
export interface UpdateCourseDto {
  name?: string;
  description?: string;
}
