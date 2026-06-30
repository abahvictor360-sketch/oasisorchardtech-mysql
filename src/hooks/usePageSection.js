/**
 * usePageSection — fetch one or many page_content rows from MySQL API.
 * Falls back to the provided defaults if the API is unavailable.
 */
import { useState, useEffect } from 'react';
import { content as contentApi } from '../lib/api';

export function usePageSection(keys, defaults) {
  const isArray = Array.isArray(keys);
  const keyList = isArray ? keys : [keys];
  const [data, setData] = useState(defaults);

  useEffect(() => {
    Promise.all(keyList.map(k => contentApi.get(k)))
      .then(results => {
        if (isArray) {
          const map = {};
          keyList.forEach((k, i) => { if (results[i].data != null) map[k] = results[i].data; });
          if (Object.keys(map).length > 0) setData(prev => ({ ...prev, ...map }));
        } else {
          if (results[0]?.data != null) setData(results[0].data);
        }
      })
      .catch(() => {/* stay with defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data };
}
