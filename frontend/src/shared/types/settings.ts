export interface GlobalSettings {
  trainingStartHour: number; // 0-23, по умолчанию 8
  trainingEndHour: number; // 0-23, по умолчанию 22
  minTimeBeforeEnd: number; // часы, по умолчанию 4
  notificationsEnabled: boolean; // по умолчанию true
}

export interface CourseSettings extends GlobalSettings {
  courseId: string;
}

// DTO для обновления (все поля optional)
export interface UpdateSettingsDTO {
  trainingStartHour?: number;
  trainingEndHour?: number;
  minTimeBeforeEnd?: number;
  notificationsEnabled?: boolean;
}

// Validation result
export interface SettingsValidation {
  isValid: boolean;
  errors: {
    trainingStartHour?: string;
    trainingEndHour?: string;
    minTimeBeforeEnd?: string;
    timeRange?: string;
    minTime?: string;
    minTimeValue?: string;
  };
}
