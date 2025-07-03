import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Custom hook for API calls with loading, error handling, and caching
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    immediate = true,
    showErrorToast = true,
    showSuccessToast = false,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      setData(result);
      
      if (showSuccessToast && result.message) {
        toast.success(result.message);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showErrorToast, showSuccessToast, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
};

// Hook for paginated API calls
export const usePaginatedApi = (apiFunction, initialParams = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    showErrorToast = true,
    onSuccess,
    onError,
  } = options;

  const fetchData = useCallback(async (params = {}, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const requestParams = {
        ...initialParams,
        ...params,
        limit: pagination.limit,
        offset: append ? data.length : 0,
      };

      const result = await apiFunction(requestParams);

      if (append) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data || []);
      }

      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          hasMore: result.pagination.has_more,
        }));
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, initialParams, pagination.limit, data.length, showErrorToast, onSuccess, onError]);

  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      fetchData({}, true);
    }
  }, [fetchData, loading, pagination.hasMore]);

  const refresh = useCallback(() => {
    setData([]);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    loadMore,
    refresh,
    fetchData,
  };
};

// Hook for real-time data polling
export const usePolling = (apiFunction, interval = 30000, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true); // Start polling by default

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFunction();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, dependencies);

  // Polling effect
  useEffect(() => {
    let intervalId;

    if (isPolling) {
      intervalId = setInterval(fetchData, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, fetchData, interval]);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch: fetchData,
  };
};

export default useApi;