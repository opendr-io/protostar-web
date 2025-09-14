![Alt text](img/protostar-logo.jpg)

Recent serious work on the problem of false positives and their effects has measured the rate of false positive alerts, in security operations centers, as ranging between 75% to an astounding 99%. Rates in the nineties have been reported by researchers and data scientists doing work on the problem. At the time of this writing, so-called “agentic” or AI-based products promising a solution to alert fatigue are numerous and increasing by the day. Extensive debate is taking place as to the veracity of these claims. Is AI the magical solution to the problem? Is AI the answer? We think it has a place, but not exactly the way it is being sold today. To understand that, you need to know a little about how we got here. PROTOSTAR is our approach to cybersecurity detection signal processing, using ML and AI, in a different direction. It differs from the current crop of solutions to alert fatigue in several ways; 
1) It generates data structures that enable intelligent processing of all detections, by an LLM or by a human, at reasonable cost.
2) is asymptotically efficient, decisioning more than ten thousand alerts per minute, and signal strength increases with volume instead of degenerating  into noise. 
3) It applies ML differently, and thoughtfully, in order to boost signal rather than increase noise.
4) It identifies signal patterns that cannot be produced by processing of discrete alerts one at a time, or in small disconnected sets.

## Getting Started with the PROTOSTAR Project

1. If you have not yet set up the data layer, see this doc which covers setup of the data layer with sample data: [PROTOSTAR-data](https://github.com/opendr-io/protostar-data)
2. See this doc for setup and configuration of the web layer: [Setup](https://github.com/opendr-io/protostar-web/blob/main/BaseSetup.md)
4. Or this doc which covers Ubuntu setup: [Setup](https://github.com/opendr-io/protostar-web/blob/main/Ubuntu%20Server%20Configuration.md)
3. Run ```python startup.py```

## TLS
TLS: This guide covers setting up TLS across the plaform: [TLS Setup](https://github.com/opendr-io/protostar-web/blob/main/TLSSetup.md)


