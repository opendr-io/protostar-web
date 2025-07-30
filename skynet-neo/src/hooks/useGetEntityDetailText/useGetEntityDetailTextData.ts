import axios from 'axios';
import { AlertNodeData, DataListResponse } from '../../common/types/backend-models';

export function useGetEntityDetailTextData() 
{
  const dbURL = import.meta.env.VITE_NEO_APP_DB_URL;
  const user = import.meta.env.VITE_NEO_APP_USERNAME;
  const pass = import.meta.env.VITE_NEO_APP_PASSWORD;
  const getEntityDetailText = async (entityName: string) => {
    const entityDetailResponse = await axios.post<DataListResponse<AlertNodeData>>(`${dbURL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `match (m:ALERT) where m.entity = '${entityName}' return m LIMIT 2500`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${pass}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/json',
      }
    });

    const alertList: AlertNodeData[] = [];
    entityDetailResponse.data.results.forEach(alertSet => {
      alertSet.data.forEach(alertRows => {
        alertList.push(...alertRows.row)
      })
    });

    return alertList;
  }

  return {
    getEntityDetailText
  }
}