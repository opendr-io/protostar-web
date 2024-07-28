import axios from 'axios';

export enum EntityType {
  HOST = 'host',
  USER = 'user',
  ENDPOINT = 'endpoint',
}

export interface NodeMeta {
  id: number;
  elementId: string;
  type: 'node' | 'relationship';
  delete: boolean;
}

export interface Entity {
  view: 1 | 2;
  entity_type: EntityType;
  ip: string;
  count: number;
  entity: string;
};

interface DataResponse<T> {
  errors: Error[];
  lastBookmarks: string[];
  results: {
    columns: string[];
    data: {
      meta: NodeMeta[],
      row: T[],
    }[];
  }[]
}

export function useGetEntityListData() {
  const getEntityList = async () => {
    const entityResponse = await axios.post<DataResponse<Entity>>(`${process.env.REACT_APP_DB_URL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `MATCH (n:ENTITY) where n.view = 1 return n`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${process.env.REACT_APP_USERNAME}:${process.env.REACT_APP_PASSWORD}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      }
    });

    const entityList = entityResponse.data.results.reduce<(NodeMeta & Entity)[]>((resultList, currentResult) => {
      resultList.push(...currentResult.data.map((result) => ({ ...result.row[0], ...result.meta[0] })));
      return resultList;
    }, []);

    return entityList;
  }

  return {
    getEntityList
  }
}