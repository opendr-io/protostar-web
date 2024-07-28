import { useState, useEffect } from 'react';
import axios from 'axios';

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setLoading(true)
    setData(null);
    setError(null);
    const source = axios.CancelToken.source();
    axios.get(url, { cancelToken: source.token })
      .then(res => {
        setLoading(false);
        //checking for multiple responses for more flexibility 
        //with the url we send in.
        res.data && setData(res.data);
      })
      .catch(err => {
        setLoading(false)
        setError(err)
      })
    return () => {
      source.cancel();
    }
  }, [url])

  return { data, loading, error }
}

export default useFetch;