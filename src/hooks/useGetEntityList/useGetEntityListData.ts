import axios from 'axios';
import { DataListResponse, NodeMeta, EntityNodeData } from '../../common/types/backend-models.d';

export function useGetEntityListData() {
  const getEntityList = async () => {
    const entityResponse = await axios.post<DataListResponse<EntityNodeData>>(`${process.env.REACT_APP_DB_URL}/tx/commit`, JSON.stringify({
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