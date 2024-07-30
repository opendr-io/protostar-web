import { AlertNodeData } from '../../common/types/backend-models';
import './DetailList.css';

function AlertRow({ alertData, index }: { alertData: AlertNodeData, index: number }) {
  // comment the fields names that need to be hidden in the Alert details
  // any new field name can be added here if needed 
  const detailKeysToShow: (keyof AlertNodeData)[] = [
    // "guid",
    "name",
    "detection_type",
    "category",
    "mitre_tactic",
    "source_ip",
    "dest_ip",
    "dest_port",
    "username",
    "syscall_name",
    "executable",
    "process",
    "proctitle",
    "severity",
  ];

  return (
    <div className='alertrow' data-index={`#${index}`}>
      <div className='alertHeader'><h3>{new Date(alertData.timestamp).toUTCString()}</h3><h3>{alertData?.entity_type}</h3><h3>{alertData?.host_ip}</h3><h3>{alertData?.entity}</h3></div>
      <div className='alertDetails'>{detailKeysToShow.map((key, index) => {
        if (alertData[key] && alertData[key] !== '-') {
          return <div>{key}: "{alertData[key]}",</div>
        }
      })}</div>
    </div>
  )
}

export default function DetailList({
  data
}: {
  data?: AlertNodeData[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto' }}>
      {data?.map((row, index) => <AlertRow key={`alert-${index}`} alertData={row} index={index} />)}
    </div>
  )
}