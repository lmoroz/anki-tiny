/**
 * Утилиты для работы с датами и часовыми поясами
 */

/**
 * Получить текущую дату в формате ISO 8601 UTC
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Форматировать дату в YYYY-MM-DD для конкретного часового пояса
 * @param date - Date объект
 * @param timezone - IANA timezone (например, 'Asia/Shanghai', 'UTC')
 * @returns строка в формате YYYY-MM-DD
 */
export function formatDateInTimezone(date: Date, timezone = 'UTC'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;

  return `${year}-${month}-${day}`;
}

/**
 * Получить "сегодняшнюю" дату в формате YYYY-MM-DD для часового пояса пользователя
 * @param timezone - IANA timezone (например, 'Asia/Shanghai')
 * @returns строка в формате YYYY-MM-DD
 */
export function getLocalToday(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone);
}

/**
 * Конвертировать SQLite CURRENT_TIMESTAMP (без часового пояса) в ISO 8601 UTC
 * Предполагается, что входная дата в формате "YYYY-MM-DD HH:MM:SS" и записана в указанном timezone
 * @param sqliteDate - дата в формате "YYYY-MM-DD HH:MM:SS"
 * @param sourceTimezone - исходный часовой пояс (по умолчанию 'Asia/Shanghai' = UTC+8)
 * @returns дата в формате ISO 8601 UTC
 */
export function convertSQLiteDateToISO(sqliteDate: string, sourceTimezone = 'Asia/Shanghai'): string {
  // Парсим дату как строку в указанном часовом поясе
  // SQLite формат: "2026-01-08 05:39:57"
  const [datePart, timePart] = sqliteDate.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute, second] = timePart.split(':');

  // Создаём дату в указанном часовом поясе
  // Используем UTC как базу и вычисляем смещение
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: sourceTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Создаём дату в UTC, затем интерпретируем её как локальную для целевого timezone
  // Для этого нам нужно найти смещение
  const testDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  const utcTime = testDate.getTime();

  // Получаем локальное время в целевом timezone
  const parts = formatter.formatToParts(testDate);
  const localYear = parseInt(parts.find((p) => p.type === 'year')!.value);
  const localMonth = parseInt(parts.find((p) => p.type === 'month')!.value);
  const localDay = parseInt(parts.find((p) => p.type === 'day')!.value);
  const localHour = parseInt(parts.find((p) => p.type === 'hour')!.value);
  const localMinute = parseInt(parts.find((p) => p.type === 'minute')!.value);
  const localSecond = parseInt(parts.find((p) => p.type === 'second')!.value);

  // Вычисляем смещение
  const localTime = new Date(localYear, localMonth - 1, localDay, localHour, localMinute, localSecond).getTime();
  const offset = utcTime - localTime;

  // Применяем обратное смещение к нашей входной дате
  const inputDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
  const correctedDate = new Date(inputDate.getTime() - offset);

  return correctedDate.toISOString();
}
