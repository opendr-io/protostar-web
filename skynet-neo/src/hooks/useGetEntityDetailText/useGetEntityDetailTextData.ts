import axios from 'axios';
import { AlertNodeData, DataListResponse } from '../../common/types/backend-models';

export function useGetEntityDetailTextData() {
  const getEntityDetailText = async (entityName: string) => {
    const entityDetailResponse = await axios.post<DataListResponse<AlertNodeData>>(`${process.env.REACT_APP_DB_URL}/tx/commit`, JSON.stringify({
      statements: [
        {
          statement: `match (m:ALERT) where m.entity = '${entityName}' return m LIMIT 2500`,
        },
      ],
    }), {
      headers: {
        Authorization: `Basic ${btoa(`${process.env.REACT_APP_USERNAME}:${process.env.REACT_APP_PASSWORD}`)}`,
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