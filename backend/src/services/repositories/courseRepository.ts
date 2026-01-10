import { getDatabase } from '../database/index.ts';
import type { Course, NewCourse, CourseUpdate } from '../database/schema.ts';
import { sql } from 'kysely';

export const courseRepository = {
  async findAll(): Promise<Course[]> {
    const db = getDatabase();
    return await db.selectFrom('courses').selectAll().orderBy('createdAt', 'desc').execute();
  },

  async findById(id: number): Promise<Course | undefined> {
    const db = getDatabase();
    return await db.selectFrom('courses').selectAll().where('id', '=', id).executeTakeFirst();
  },

  async create(data: Omit<NewCourse, 'createdAt' | 'updatedAt'>): Promise<Course> {
    const db = getDatabase();
    const result = await db.insertInto('courses').values(data).returningAll().executeTakeFirstOrThrow();
    return result;
  },

  async update(id: number, data: Omit<CourseUpdate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course | undefined> {
    const db = getDatabase();

    const result = await db
      .updateTable('courses')
      .set({
        ...data,
        updatedAt: sql.raw<string>('CURRENT_TIMESTAMP'),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return result;
  },

  async delete(id: number): Promise<boolean> {
    const db = getDatabase();
    const result = await db.deleteFrom('courses').where('id', '=', id).executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  },
};
