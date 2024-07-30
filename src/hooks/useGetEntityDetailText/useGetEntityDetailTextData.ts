import axios from 'axios';
import { Entity, NodeMeta } from '../useGetEntityList/useGetEntityListData';

interface DataResponse<T> {
  errors: Error[];
  lastBookmarks: string[];
  results: {
    columns: string[];
    data: {
      meta: NodeMeta[][],
      row: T[][],
    }[];
  }[]
}

export function useGetEntityDetailTextData() {
  const getEntityDetail = async (entityName: string) => {
    const entityDetailResponse = await axios.post<DataResponse<Entity>>(`${process.env.REACT_APP_DB_URL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `match (m:ALERT) where m.entity = '${entityName}' return m.entity, m.severity, m.name LIMIT 100`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${process.env.REACT_APP_USERNAME}:${process.env.REACT_APP_PASSWORD}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      }
    });

    return entityDetailResponse.data;
  }

  return {
    getEntityDetail
  }
}