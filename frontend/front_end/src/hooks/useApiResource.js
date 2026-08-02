import { useCallback, useEffect, useState } from "react";
import instance from "../api/axiosInstance";

export function useApiResource(url, options = {}) {
  const { immediate = true, params = {}, fetchAllPages = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const refetch = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const baseParams = JSON.parse(paramsKey || "{}");
      const response = await instance.get(url, {
        params: { ...baseParams, ...overrideParams },
      });
      let nextData = response.data;

      if (fetchAllPages && nextData?.next && Array.isArray(nextData.results)) {
        const results = [...nextData.results];
        let nextUrl = nextData.next;

        while (nextUrl) {
          const nextResponse = await instance.get(nextUrl);
          const pageData = nextResponse.data;
          if (!Array.isArray(pageData.results)) break;
          results.push(...pageData.results);
          nextUrl = pageData.next;
        }

        nextData = {
          ...nextData,
          next: null,
          previous: null,
          results,
        };
      }

      setData(nextData);
      return nextData;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, paramsKey, fetchAllPages]);

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
