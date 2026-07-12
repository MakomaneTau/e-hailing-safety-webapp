export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}