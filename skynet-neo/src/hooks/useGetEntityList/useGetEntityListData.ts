import axios from 'axios';
import { DataListResponse, NodeMeta, EntityNodeData } from '../../common/types/backend-models';

export function useGetEntityListData() 
{
  const dbURL = import.meta.env.VITE_NEO_APP_DB_URL;
  const user = import.meta.env.VITE_NEO_APP_USERNAME;
  const pass = import.meta.env.VITE_NEO_APP_PASSWORD;
  const getEntityList = async () => {
    const entityResponse = await axios.post<DataListResponse<EntityNodeData>>(`${dbURL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `MATCH (n:ENTITY) where n.view = 1 return n`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${pass}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      }
    });

    const entityList = entityResponse.data.results.reduce<(NodeMeta & EntityNodeData)[]>((resultList, currentResult) => {
      resultList.push(...currentResult.data.map((result) => ({ ...result.row[0], ...result.meta[0] })));
      return resultList;
    }, []);

    return entityList;
  }

  return {
    getEntityList
  }
}