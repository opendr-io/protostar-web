import axios from 'axios';
import { NodeData, DataGraphResponse } from '../../common/types/backend-models.d';

export function useGetEntityDetailData() {
  const getEntityDetail = async (entityName: string) => {
    const entityDetailResponse = await axios.post<DataGraphResponse<NodeData>>(`${process.env.REACT_APP_DB_URL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `MATCH path = (n:ENTITY)-[r*]->(m) where n.view = 1 and m.view = 1 and n.entity = "${entityName}" return path`,
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