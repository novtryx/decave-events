
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string;
};




export async function handleAction<T>(
  action: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const data = await action();

    return {
      success: true,
      data,
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
      statusCode: error.statusCode,
      error: error.error,
    };
  }
}

