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
    // One batched request for all keys instead of a round trip per key
    contentApi.getMany(keyList)
      .then(({ data: map }) => {
        if (!map || typeof map !== 'object') return;
        if (isArray) {
          const found = {};
          keyList.forEach(k => { if (map[k] != null) found[k] = map[k]; });
          if (Object.keys(found).length > 0) setData(prev => ({ ...prev, ...found }));
        } else {
          if (map[keyList[0]] != null) setData(map[keyList[0]]);
        }
      })
      .catch(() => {/* stay with defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data };
}
