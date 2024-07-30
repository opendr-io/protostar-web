import { useEffect, useState } from "react";
import { IGraphData, processNodesAndEdges } from './graphUtils';
import ForceGraph from "../../components/NetworkGraph/NetworkGraph";
import DetailList from "../../components/DetailList/DetailList";
import { useGetEntityListData } from "../../hooks/useGetEntityList/useGetEntityListData"
import { useGetEntityDetailData } from "../../hooks/useGetEntityDetail/useGetEntityDetailData"
import { useGetEntityDetailTextData } from "../../hooks/useGetEntityDetailText/useGetEntityDetailTextData"
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { AlertNodeData, EntityNodeData, NodeMeta } from "../../common/types/backend-models";

export function View3() {
  const [graphData, setGraphData] = useState<IGraphData>();
  const [graphMode, setGraphMode] = useState(true);
  const [network, setNetwork] = useState<any>({});
  const [searchParams] = useSearchParams();
  const entityName = searchParams.get('entity');
  const [entityList, setEntityList] = useState<(NodeMeta & EntityNodeData)[]>([]);
  const [alertList, setAlertList] = useState<AlertNodeData[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { getEntityList } = useGetEntityListData();
  const { getEntityDetail } = useGetEntityDetailData();
  const { getEntityDetailText } = useGetEntityDetailTextData();

  useEffect(() => {
    getEntityList()
      .then((entityList) => {
        setEntityList(entityList);
      })
    if (entityName) {
      getEntityDetail(entityName)
        .then((result) => {
          const graphData: any = result?.results.pop()?.data ?? [];
          setGraphData({ results: graphData });
        });
      getEntityDetailText(entityName)
        .then((alertList) => {
          setAlertList(alertList)
        })
    }
  }, [entityName]);

  useEffect(() => {
    setNetwork(processNodesAndEdges(graphData));
  }, [graphData]);

  return (
    <>
      <h3 style={{ marginLeft: 16 }}>{'Select Entity'}&nbsp;&nbsp;
        <select style={{ padding: '8px 16px' }} defaultValue={entityName ?? ''} onChange={(event) => {
          searchParams.set('entity', event.target.value);
          navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
        }}>
          <option disabled value={''}> -- select an entity -- </option>
          {entityList.map((entity, index) => (<option key={`select-${index}-${entity.entity}`} value={entity.entity}>{entity.entity_type}/{entity.entity}</option>))}
        </select>
      </h3>
      <div style={{ padding: '0 16px', display: 'flex', gap: 16 }}>
        <button onClick={() => setGraphMode(true)}>{'Graph'}</button>
        <button onClick={() => setGraphMode(false)}>{'List'}</button>
      </div>
      <div style={{ backgroundColor: '#1f1f1f', height: '90vh', width: '97%', margin: '16px' }}>
        {graphMode && <ForceGraph
          nodes={network.nodes ?? []}
          links={network.links ?? []}
          width={"100%"}
          height={"90vh"}
          strength={-1000}
          labelNodeTypes={['ENTITY', 'NAME_CLUSTER', 'ALERT']}
        />}
        {!graphMode && <DetailList data={alertList} />}
      </div>
    </>
  );
}
