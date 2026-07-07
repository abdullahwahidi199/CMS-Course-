import { useCallback, useEffect, useState } from "react";
import instance from "../api/axiosInstance";

export function useApiResource(url, options = {}) {
  const { immediate = true, params = {} } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const refetch = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(url, {
        params: { ...params, ...overrideParams },
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, [immediate, refetch]);

  return {
    data,
    results: Array.isArray(data) ? data : data?.results || [],
    count: data?.count || 0,
    loading,
    error,
    refetch,
    setData,
  };
}

export async function apiCreate(url, payload) {
  const response = await instance.post(url, payload);
  return response.data;
}

export async function apiGet(url, params = {}) {
  const response = await instance.get(url, { params });
  return response.data;
}

export async function apiUpdate(url, payload) {
  const response = await instance.patch(url, payload);
  return response.data;
}

export async function apiDelete(url) {
  const response = await instance.delete(url);
  return response.data;
}

export async function apiPost(url, payload = {}) {
  const response = await instance.post(url, payload);
  return response.data;
}
