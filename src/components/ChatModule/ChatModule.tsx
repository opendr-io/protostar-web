import React, { RefObject, useEffect, useRef, useState } from 'react';
import * as d3 from "d3";
import OpenAI from 'openai';

interface ChatModuleProps {
  graphContainerRef?: RefObject<HTMLDivElement>
}

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const ChatModule = ({ graphContainerRef }: ChatModuleProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [graphSummary, setGraphSummary] = useState('');
  const imageContainerRef = useRef<HTMLDivElement>(null);


  const getSummary = async (imageData: string, mock: boolean = true) => {
    console.log('getting summary')
    try {
      if (mock) {
        const explanation = await Promise.resolve("The image presents a network graph illustrating detected security issues within a system. Here’s a detailed explanation of its components:\n\n1. **Structure**:\n   - **Devices**: Represented by red squares, these can be endpoints (like computers or servers) in the network. In this case, one endpoint is labeled \"CONOR.\"\n   - **Incidents**: Represented by circles, these depict different security incidents or alerts detected within the network, such as anomalies or alerts categorized by type (e.g., \"HOST_ANOMALY,\" \"CLOUD_ANOMALY,\" \"SURICATA_ALERT\").\n\n2. **Connections**:\n   - The lines connecting the devices and incidents illustrate relationships or occurrences of incidents affecting specific devices. This allows for tracing the origin of alerts back to the affected devices.\n\n3. **Alert Characteristics**:\n   - Each incident label often includes a count indicating the number of occurrences (e.g., \"CLOUD_ANOMALY(34)\" suggests there are 34 instances of this anomaly). This quantitative information is key for assessing the severity or frequency of events.\n\n4. **Appearance**:\n   - The dark background enhances visibility of the nodes and connections, aiding in the analysis of potential security threats.\n\nOverall, this graph serves as a visualization tool for cybersecurity professionals to monitor, analyze, and respond to various security incidents detected in their network infrastructure.");
        return explanation;
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Explain the given image which contains a graph of security issue detected in a network. The devices are represented by red squares and incidents represented by circles" },
              {
                type: "image_url",
                image_url: {
                  detail: 'auto',
                  url: imageData,
                },
              },
            ],
          },
        ],
      });
      console.log(response.choices[0]);
      console.log(imageData);
      return response.choices[0].message.content;
    } catch (err) { }
  };

  const captureImage = () => {
    const selectedSVG = d3.select('svg');
    const serializer = new XMLSerializer();

    if (!selectedSVG) return;

    let style = "\n";
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      const rules = sheet.cssRules;
      if (rules) {
        for (let j = 0; j < rules.length; j++) {
          style += (rules[j].cssText + '\n');
        }
      }
    }

    selectedSVG.insert('defs', ':first-child');
    d3.select('svg defs')
      .append('style')
      .attr('type', 'text/css')
      .html(style);

    const svgStr = window.btoa(unescape(encodeURIComponent(serializer.serializeToString(selectedSVG.node() as Element))));
    const image = new Image();
    image.src = 'data:image/svg+xml;base64,' + svgStr;

    console.log(image.src);
    const canvasElement = document.createElement('canvas');
    const canvasContext = canvasElement.getContext('2d');
    const { height, width } = graphContainerRef?.current?.getBoundingClientRect() ?? { height: 0, width: 0 };

    canvasElement.height = height;
    canvasElement.width = width;

    image.onload = async () => {
      canvasContext?.drawImage(image, 0, 0);
      const imageData = canvasElement.toDataURL('image/png');
      if (imageContainerRef.current) {
        imageContainerRef.current.innerHTML = '';
        // imageContainerRef.current.appendChild(
        //   canvasElement
        // );
      }
      const gptAnswer = await getSummary(imageData, false);
      setGraphSummary(gptAnswer ?? '');
    }
  }

  const toggleInfoPanel = (toState: boolean) => {
    setChatOpen(toState);
    if (toState) {
      captureImage();
    }
  }

  const toggleHandler = (state: boolean) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => { event.stopPropagation(); toggleInfoPanel(state); }

  return (
    <div style={{ border: '1px solid whitesmoke', borderRadius: '4px', minWidth: '200px', padding: '6px', position: 'absolute', top: 20, left: 20, backgroundColor: '#5f5f5f' }}>
      <div style={{ border: '1px solid white', borderRadius: '4px', cursor: 'pointer', padding: '10px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 100 }} onClick={toggleHandler(true)}>
        <span>{'Explain this?'}</span>
        {chatOpen && <span onClick={toggleHandler(false)}>{'X'}</span>}
      </div>
      {chatOpen && <div ref={imageContainerRef} style={{ border: '1px solid black', alignItems: 'center' }}></div>}
      {chatOpen && <pre style={{ maxWidth: '600px', overflow: 'auto' }}>{graphSummary}</pre>}
    </div >
  );
}