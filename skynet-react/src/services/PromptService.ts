import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default class PromptService
{
  constructor() {}

  public DetailsPrompt(question: string, details: any)
  {
    let finalPrompt = `
      [System Role/Instruction]

      Give an analysis of the threat detections using the knowledge provided herein.

      [Background Knowledge]

      The data contains the following elements:

      detection_type: the type of alert or detection that has been processed involving an entity. The following detection types exist:

      cloud alert: an alert that was created by a query evaluating true on a Cloudtrail event log.
      cloud anomaly: a machine learning anomaly detection alert that identified an anomalous outlier event in Cloudtrail logs.  
      endpoint alert: an alert that was created by a query evaluating true on events from an EDR agent.
      endpoint ml: a machine learning anomaly detection alert that identified an anomalous outlier event EDR log events.  
      flow anomaly: a machine learning anomaly detection alert that identified an anomalous outlier event in network flow logs.  
      host alert: an alert that was created by a query evaluating true on network layer data such as Suricata or Zeek logs.
      host anomaly: a machine learning anomaly detection alert that identified an anomalous outlier network layer data such as Suricata or Zeek logs.
      host anomaly - process: a machine learning anomaly detection alert that identified an anomalous outlier process event in EDR logs.
      host anomaly - network: a machine learning anomaly detection alert that identified an anomalous outlier network socket event in EDR logs.
      Hot isotope: a single alert that has special importance involves a CVE which has been rated hot because it is especially dangerous. A hot isotope will experience a decrease in importance over time as it ages but when one is presented here it is important. Isotopes are high confidence threat detections and do not need corroboration.
      ML correlation: A match was found between conventional alerts and machine learning anomaly detections. This combination indicates high confidence that a true positive set of threat detections has been found.
      network - anomaly: a machine learning anomaly detection alert that identified an anomalous outlier network layer data such as Suricata or Zeek logs.
      stable isotope: a single alert that has special importance because it has high true positive confidence and its importance does not decrease with time. Isotopes are high confidence threat detections and do not need corroboration.

      Evaluating relationships in making confidence decisions:

      - a combination of alerts and anomalies indicates high confidence that both detection pipelines agree threat activity has been detected.
      - an ML correlation indicates very high confidence because both the conventional and machine learning detections evaluated the same events as threat activity  . This means the machine learning detections match known patterns of threat activity, and the conventional alerts involve events and activity that is unusual, which means they are less likely to be false positives.
      - A  combination of sources indicates high confidence because multiple threat detection products, engines, or platforms, all identified threat activity involving the same entity. 

      source: the following source values exist:

      cloudtrail: the detection was formed using a cloudtrail event.
      Flows: the detection involved VPC or network flow logs.
      Linux: the detection involved a Linux server.
      suricata: the alert came from a Suricata sensor.
      windows: the detection involved a Windows computer.

        [User Instructions/Task]

      Using the following data:" "${details}", answer the following question: "${question}. Answer it as detailed as you can.`;
    return finalPrompt; 
  }

  public DetailsSummaryPrompt(details: any)
  {
    let finalPrompt = `
      [System Role/Instruction]

      Give an analysis of the threat detections using the knowledge provided herein.

      [Background Knowledge]

      The data contains the following elements:

      detection_type: the type of alert or detection that has been processed involving an entity. The following detection types exist:

      cloud alert: an alert that was created by a query evaluating true on a Cloudtrail event log.
      cloud anomaly: a machine learning anomaly detection alert that identified an anomalous outlier event in Cloudtrail logs.  
      endpoint alert: an alert that was created by a query evaluating true on events from an EDR agent.
      endpoint ml: a machine learning anomaly detection alert that identified an anomalous outlier event EDR log events.  
      flow anomaly: a machine learning anomaly detection alert that identified an anomalous outlier event in network flow logs.  
      host alert: an alert that was created by a query evaluating true on network layer data such as Suricata or Zeek logs.
      host anomaly: a machine learning anomaly detection alert that identified an anomalous outlier network layer data such as Suricata or Zeek logs.
      host anomaly - process: a machine learning anomaly detection alert that identified an anomalous outlier process event in EDR logs.
      host anomaly - network: a machine learning anomaly detection alert that identified an anomalous outlier network socket event in EDR logs.
      Hot isotope: a single alert that has special importance involves a CVE which has been rated hot because it is especially dangerous. A hot isotope will experience a decrease in importance over time as it ages but when one is presented here it is important. Isotopes are high confidence threat detections and do not need corroboration.
      ML correlation: A match was found between conventional alerts and machine learning anomaly detections. This combination indicates high confidence that a true positive set of threat detections has been found.
      network - anomaly: a machine learning anomaly detection alert that identified an anomalous outlier network layer data such as Suricata or Zeek logs.
      stable isotope: a single alert that has special importance because it has high true positive confidence and its importance does not decrease with time. Isotopes are high confidence threat detections and do not need corroboration.

      Evaluating relationships in making confidence decisions:

      - a combination of alerts and anomalies indicates high confidence that both detection pipelines agree threat activity has been detected.
      - an ML correlation indicates very high confidence because both the conventional and machine learning detections evaluated the same events as threat activity  . This means the machine learning detections match known patterns of threat activity, and the conventional alerts involve events and activity that is unusual, which means they are less likely to be false positives.
      - A  combination of sources indicates high confidence because multiple threat detection products, engines, or platforms, all identified threat activity involving the same entity. 

      source: the following source values exist:

      cloudtrail: the detection was formed using a cloudtrail event.
      Flows: the detection involved VPC or network flow logs.
      Linux: the detection involved a Linux server.
      suricata: the alert came from a Suricata sensor.
      windows: the detection involved a Windows computer.

        [User Instructions/Task]

      Using the following data:" "${details}", can you give me a summary of what I need to priortize for this particular entity"`;
    return finalPrompt; 
  }

  public ThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = `
      [System Role/Instruction]

      You are an expert threat hunter and detection analyst using an advanced threat detection platform. You are reading summary threat detection posture information.

      [Background Knowledge]

      this is not a set of log entries, this is a summary table of all available threat detections for various entities. Each row contains a scored set of detection relationships for an entity.   

      The following entity types exist in the table:
  
      an entity type of endpoint is a computer with an EDR agent. We may have any combination of host and network detections for an endpoint.
      an entity type of host is a network device without an EDR agent for which we have only network data and detections.
      an entity type of user is a username not associated with an endpoint or user. a user entity that starts with arn: is an aws username and we would only have cloudtrail data for aws users. An AWS user entity with a core of 4 or above means that a combination of conventional alerts and machine learning anomaly detections has created a high confidence set of detections of suspicious activity. Threat activity involving a root aws user tends to be more critical.
      an ip is the IP address of the endpoint or host and is not inherently important to the question of which set is most important.
    
      The following metrics exist:

      atomic mass is a count of the total number of alerts in the set.
      atomic weight is a score of importance andis based on the number of detection relationships in the set; more relationships gives higher confidence and corroboration. This tends to make atomic weight more important than atomic mass.
      Detections may be any combinations of conventional alerts and machine learning
      anomalies.
      The entities named connorj and sarah have been displayed in red because they contain high confidence relationships in their detection sets. this makes them important.

      [User Instructions/Task]

      Give a summary explanation of the data and what the scores mean.  Give a summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each field that you recognize and what kind of data it contains. Suggest possible investigative directions.
      ${details}`;
    return finalPrompt;
  }

  public ThreatStatusPrompt(question: string, details: any)
  {
    let finalPrompt = `
      [Background Knowledge]

      this is not a set of log entries, this is a summary table of all available threat detections for various entities. Each row contains a scored set of detection relationships for an entity.               	 
      The following entity types exist in the table:

      an entity type of endpoint is a computer with an EDR agent. We may have any combination of host and network detections for an endpoint.
      an entity type of host is a network device without an EDR agent for which we have only network data and detections.
      an entity type of user is a username not associated with an endpoint or user. a user entity that starts with arn: is an aws username and we would only have cloudtrail data for aws users. An AWS user entity with a core of 4 or above means that a combination of conventional alerts and machine learning anomaly detections has created a high confidence set of detections of suspicious activity. Threat activity involving a root aws user tends to be more critical.
      an ip is the IP address of the endpoint or host and is not inherently important to the question of which set is most important.
    
      atomic mass is a count of the total number of alerts in the set.
      atomic weight is a score of importance andis based on the number of detection relationships in the set; more relationships gives higher confidence and corroboration. This tends to make atomic weight more important than atomic mass.
      Detections may be any combinations of conventional alerts and machine learning
      anomalies.
      The entities named connorj and sarah have been displayed in red because they contain high confidence relationships in their detection sets. this makes them important. 

      [User Instructions/Task]
      
      Use this information and based on this data: "${details}"
      Next, answer the following specific question: "${question}"  and repeat my question to me. When answering explain each field that you recognize and what kind of data it contains and suggest possible investigative directions.`;
    return finalPrompt;
  }

  public AlertSummaryPrompt(details: any, specificDetails: any)
  {
    let finalPrompt = `
      This is high level summary of events occuring occuring in this organization. Use this data to determine the criticality of what the user needs to focus on:
      You are a security threat hunter and detection engineer examining some data that the user has provided.
      First, if the table data contains these fields, they are Cloudtrail events:
      eventTime: the timestamp
      eventSource: the AWS service which was used    
      eventName: the name of the API call that was used
      awsRegion: the name of the AWS region
      sourceIPAddress: the source IP address of the caller
      userAgent: the calling user agent    
      readOnly: TRUE means the API call was only reading data or objects. FALSE means the API call made changes.
      sessionCredentialFromConsole: TRUE means the API call took place interactively in the AWS console in a browser. FALSE means it was programmatic.
      userIdentity.type: AssumeRole is a temporary role using an STS token. Root is the superuser for the account. AWSService means it came from an internal AWS service.
      userIdentity.principalId: when this contains the word ‘instance” this identifies the EC2 instance that the API call came from.
      userIdentity.arn: the user context which made the call.
      userIdentity.sessionContext.attributes.mfaAuthenticated: FALSE means the user used multi factor authentication.
      errorCode: if this field is not null, it contains the type of error which was returned. If it is null, there was no error.    
      errorMessage:  if this field is not null, it contains the details of the error which was returned. If it is null, there was no error.    
      response: details of the response to the API call.
      request: details of the parameters in the API call that was made.

        If the table data contains these fields, they are VPC flow logs:

      account-id: the AWS account number where the flow took place.
      interface-id: the ENI (elastic network interface) that sent or received the flow.
      srcaddr: the source IP address.
      dstaddr: the destination IP address.
      srcport: the source port.
      dstport: the destination port.
      protocol: the protocol number.
      packets: the number of packets in the flow.    
      bytes: the number of bytes in the flow.
      start: the start time of the flow.
      end: the end time of the flow.
      action: the action taken by a security group. ACCEPT means the flow was permitted. REJECT means the flow was blocked by a security group.

        if the table data contains these fields, they are Kubernetes logs:
      Kind: Specifies the type of the log entry (Event in this case).
      apiVersion: Indicates the Kubernetes API version of the audit log.
      Level: Indicates the verbosity or metadata level of the log entry.
      auditID: Unique identifier for the audit event.
      Stage: Represents the stage of the request lifecycle - a value of Panic would be a critical error.
      requestURI: The URI for the Kubernetes API request.
      verb: Specifies the action performed. watch, get and list verbs can be related to discovery and enumeration activity. delete and deletecollection can be relevant to defense evasion. create, update, connect, and create-token verbs make changes and can be relevant to persistence or lateral movement. bind assigns a pod to a specific node. approve configures a certificate signing request (CSR) which happens rarely. the authenticate verb authenticates a Kubernetes aPI request and can be relevant to credentialed access or privilege escalation.
      user: The user or system that performed the action.
      sourceIPs: The source IPs associated with the request.
      userAgent: The user agent making the request.
      objectRef: Metadata about the object being accessed or manipulated.
      requestReceivedTimestamp: Timestamp for when the request was received.
      stageTimestamp: Timestamp for when the stage completed.
      responseStatus: Status of the request; success indicates a normal transaction and failure indicates an error. lots of failures here indicate either misconfiguration or possibly indication sof discovery, lateral movement, or privilege escalation activity.
      annotations: contains authorization status. allow means the API call was permitted and forbid means it was unauthorized. lots of forbidden messages here are not nominal and mean either misconfiguration or possibly indications of discovery, lateral movement, or privilege escalation activity.

      For flow logs, ignore rows with a logstatus of NODATA because those are just errors and not threats. If there are interface-id and action fields, they are vpc flow log events. If there are fields whose names begin with k8s, they are Kubernetes events.

      Give a summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each field that you recognize and what kind of data it contains. Suggest possible investigative directions listed in steps.
      To give further background here's the data specific to this alert: ${JSON.stringify(specificDetails)} and here's the data for the overall entity: ${JSON.stringify(details)}. As previously mentioned give a summary but coorelate the importance between
      the alert and the overall entity`;
    return finalPrompt;
  }

  public AlertPrompt(question: string, details: any, specificDetails: any)
  {
    let finalPrompt = `
      This is high level summary of events occuring occuring in this organization. Use this data to determine the criticality of what the user needs to focus on:
      You are a security threat hunter and detection engineer examining some data that the user has provided.
      First, if the table data contains these fields, they are Cloudtrail events:
      eventTime: the timestamp
      eventSource: the AWS service which was used
      eventName: the name of the API call that was used
      awsRegion: the name of the AWS region
      sourceIPAddress: the source IP address of the caller
      userAgent: the calling user agent    
      readOnly: TRUE means the API call was only reading data or objects. FALSE means the API call made changes.
      sessionCredentialFromConsole: TRUE means the API call took place interactively in the AWS console in a browser. FALSE means it was programmatic.
      userIdentity.type: AssumeRole is a temporary role using an STS token. Root is the superuser for the account. AWSService means it came from an internal AWS service.
      userIdentity.principalId: when this contains the word ‘instance” this identifies the EC2 instance that the API call came from.
      userIdentity.arn: the user context which made the call.
      userIdentity.sessionContext.attributes.mfaAuthenticated: FALSE means the user used multi factor authentication.
      errorCode: if this field is not null, it contains the type of error which was returned. If it is null, there was no error.    
      errorMessage:  if this field is not null, it contains the details of the error which was returned. If it is null, there was no error.    
      response: details of the response to the API call.
      request: details of the parameters in the API call that was made.

        If the table data contains these fields, they are VPC flow logs:

      account-id: the AWS account number where the flow took place.
      interface-id: the ENI (elastic network interface) that sent or received the flow.
      srcaddr: the source IP address.
      dstaddr: the destination IP address.
      srcport: the source port.
      dstport: the destination port.
      protocol: the protocol number.
      packets: the number of packets in the flow.    
      bytes: the number of bytes in the flow.
      start: the start time of the flow.
      end: the end time of the flow.
      action: the action taken by a security group. ACCEPT means the flow was permitted. REJECT means the flow was blocked by a security group.

        if the table data contains these fields, they are Kubernetes logs:
      Kind: Specifies the type of the log entry (Event in this case).
      apiVersion: Indicates the Kubernetes API version of the audit log.
      Level: Indicates the verbosity or metadata level of the log entry.
      auditID: Unique identifier for the audit event.
      Stage: Represents the stage of the request lifecycle - a value of Panic would be a critical error.
      requestURI: The URI for the Kubernetes API request.
      verb: Specifies the action performed. watch, get and list verbs can be related to discovery and enumeration activity. delete and deletecollection can be relevant to defense evasion. create, update, connect, and create-token verbs make changes and can be relevant to persistence or lateral movement. bind assigns a pod to a specific node. approve configures a certificate signing request (CSR) which happens rarely. the authenticate verb authenticates a Kubernetes aPI request and can be relevant to credentialed access or privilege escalation.
      user: The user or system that performed the action.
      sourceIPs: The source IPs associated with the request.
      userAgent: The user agent making the request.
      objectRef: Metadata about the object being accessed or manipulated.
      requestReceivedTimestamp: Timestamp for when the request was received.
      stageTimestamp: Timestamp for when the stage completed.
      responseStatus: Status of the request; success indicates a normal transaction and failure indicates an error. lots of failures here indicate either misconfiguration or possibly indication sof discovery, lateral movement, or privilege escalation activity.
      annotations: contains authorization status. allow means the API call was permitted and forbid means it was unauthorized. lots of forbidden messages here are not nominal and mean either misconfiguration or possibly indications of discovery, lateral movement, or privilege escalation activity.

      For flow logs, ignore rows with a logstatus of NODATA because those are just errors and not threats. If there are interface-id and action fields, they are vpc flow log events. If there are fields whose names begin with k8s, they are Kubernetes events.

      Answer the following question in quotes "${question}" on the data and based on what the nature of the activity is. Be verbose and identify fields you recognize. Answer every part of the question that you recognize and which data relates best to it. Suggest possible investigative directions listed in steps.
      Here are the details for the specific alert: "${JSON.stringify(details)}" and here's the information for the overall entity: "${specificDetails}. Make correlations between the two when answering the question.`;
    return finalPrompt;
  }

  public SummaryOfThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = `Can you give me a further summary and set of steps based on this output: ${details}`;
    return finalPrompt;
  }
}