import axios from 'axios';
import { NodeData, DataGraphResponse } from '../../common/types/backend-models';

export function useGetEntityDetailData() 
{
  const dbURL = import.meta.env.VITE_NEO_APP_DB_URL;
  const user = import.meta.env.VITE_NEO_APP_USERNAME;
  const pass = import.meta.env.VITE_NEO_APP_PASSWORD;
  const getEntityDetail = async (entityName: string) => {
    const entityDetailResponse = await axios.post<DataGraphResponse<NodeData>>(`${dbURL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `MATCH path = (n:ENTITY)-[r*]->(m) where n.view = 1 and m.view = 1 and n.entity = "${entityName}" return path`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${pass}`)}`,
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