import { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Таблица courses
export interface CoursesTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  createdAt: Generated<string>;
  updatedAt: Generated<string>;
}

// Типы для работы с курсами
export type Course = Selectable<CoursesTable>;
export type NewCourse = Insertable<CoursesTable>;
export type CourseUpdate = Updateable<CoursesTable>;

// Интерфейс всей базы данных
export interface Database {
  courses: CoursesTable;
}
