import type { ApiResponse, HealthResponse } from "@project/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export async function getApiHealth(): Promise<
  ApiResponse<HealthResponse>
> {
  const response = await fetch(`${apiUrl}/api/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.json() as Promise<ApiResponse<HealthResponse>>;
}