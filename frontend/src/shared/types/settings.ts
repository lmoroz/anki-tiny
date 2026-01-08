export interface GlobalSettings {
  trainingStartHour: number; // 0-23, по умолчанию 8
  trainingEndHour: number; // 0-23, по умолчанию 22
  minTimeBeforeEnd: number; // часы, по умолчанию 4
  notificationsEnabled: boolean; // по умолчанию true
  requestRetention?: number; // 0.70-1.00, по умолчанию 0.9
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
  requestRetention?: number;
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
    requestRetention?: string;
  };
}
