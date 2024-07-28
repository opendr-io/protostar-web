import { IGraphData } from '../../pages/Dashboard/graphUtils';

// { "view": 1, "entity_type": "host", "ip": "172.16.200.110", "count": 1, "name": "ET_HUNTING_SUSPICIOUS_CHMOD_USAGE_IN_URI_INBOUND_", "detection_type": "SURICATA_ALERT", "entity": "172.16.200.110" }


export default function DetailList({
  data
}: {
  data?: IGraphData
}) {
  const results = data?.results.map(result => ({ ...result.row[0][4] })).filter(data => Object.keys(data).length > 0).sort((a, b) => b.count - a.count)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflowY: 'auto', gap: 16 }}>
      <table>
        <thead style={{ fontSize: '1.2rem' }}>
          <tr>
            <td style={{ padding: '4px 16px' }}>{'Category'}</td>
            <td style={{ padding: '4px 16px' }}>{'Count'}</td>
            <td style={{ padding: '4px 16px', width: '100%' }}>{'Alert Name'}</td>
          </tr>
        </thead>
        <tbody>
          {results?.map(row => <tr>
            <td style={{ padding: '4px 16px' }}>{row.detection_type}</td>
            <td style={{ padding: '4px 16px' }}>{row.count}</td>
            <td style={{ padding: '4px 16px', width: '100%' }}>{row.name}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}