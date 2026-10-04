import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api/client";

type ApiState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

export function useApi<T>(path: string, params?: Record<string, string | undefined>) {
  const [state, setState] = useState<ApiState<T>>({ status: "loading", data: null, error: null });
  const paramsKey = params ? JSON.stringify(params) : "";

  const fetchData = useCallback(() => {
    setState({ status: "loading", data: null, error: null });
    apiGet<T>(path, params)
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((err: Error) => setState({ status: "error", data: null, error: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
