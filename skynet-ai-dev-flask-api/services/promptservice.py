from flask import jsonify
class PromptService:
  def details_prompt(self, question, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the following data:" "${details}", answer the 
    following question: "${question}. Answer it as detailed as you can. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt

  def details_summary_prompt(self, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the following data:" "${details}", can you give me a summary of 
    what I need to priortize for this particular entity. Answer it as detailed as you can. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def threat_status_summary(self, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using a summary explanation of the data and what the scores mean. Give a 
    summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each 
    field that you recognize and what kind of data it contains. Suggest possible investigative directions. ${details}. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def threat_status_prompt(self, question, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using this information and based on this data: "${details}" Next, answer 
    the following specific question: "${question}"  and repeat my question to me. When answering explain each field that
    you recognize and what kind of data it contains and suggest possible investigative directions. Answer it as best as you can. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt

  def alert_summary_prompt(self, details, specificDetails):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the data specific to this alert: ${jsonify(specificDetails)} and here's the data for 
    the overall entity: ${jsonify(details)}. As previously mentioned give a summary but coorelate the importance between the alert and the overall entity. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def alert_prompt(self, question, details, specificDetails):
    finalPrompt = f"""Answer the following question in quotes "${question}" on the data and based on what the nature of the activity is. Explain the cybersecurity risks.
    Be verbose and identify fields you recognize. Answer every part of the question that you recognize and which data relates best to it. Suggest possible investigative directions listed in steps. Here
    are the details for the specific alert: "${jsonify(details)}" and here's the information for the overall entity: "${specificDetails}. Make correlations between 
    the two when answering the question. Answer it as best as you can. At the beginning of the response place 
    the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def summary_of_threat_status_summary_prompt(self, details):
    finalPrompt = f"""Can you give me a further summary and explain the security risks and mitigation steps based on this output: ${details}. Answer it as best as you can. At the beginning 
    of the response place the following message: "If you would like a more detailed response you will need to get the pro version of the application. Here's the output for the free version:"""
    return finalPrompt