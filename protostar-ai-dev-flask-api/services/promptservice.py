from pathlib import Path
from flask import jsonify

PROMPT_DIR = Path(__file__).parent.parent.absolute() / 'prompts'

def render(template_name, values):
  # Read on every call rather than caching: Flask runs without the reloader, so this
  # is what lets a prompt edit take effect without restarting the API. An unknown
  # placeholder is left in place so a typo shows up in the prompt rather than
  # silently emptying it.
  text = (PROMPT_DIR / template_name).read_text(encoding='utf-8').strip()
  for key, value in values.items():
    text = text.replace('{{%s}}' % key, str(value))
  return text
class PromptService:
  def details_prompt(self, question, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the following data:" "${details}", answer the 
    following question: "${question}. Answer it as detailed as you can. At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt

  def details_summary_prompt(self, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the following data:" "${details}", can you give me a summary of 
    what I need to priortize for this particular entity. Answer it as detailed as you can. At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def threat_status_summary(self, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using a summary explanation of the data and what the scores mean. Give a 
    summary report on the data and explain what the nature of the activity is. Be verbose and identify fields you recognize. Explain each 
    field that you recognize and what kind of data it contains. Suggest possible investigative directions. ${details}. At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def threat_status_prompt(self, question, details):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using this information and based on this data: "${details}" Next, answer 
    the following specific question: "${question}"  and repeat my question to me. When answering explain each field that
    you recognize and what kind of data it contains and suggest possible investigative directions. Answer it as best as you can. At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt

  def alert_summary_prompt(self, details, specificDetails):
    finalPrompt = f"""Can you explain the security risks and steps for mitigation using the data specific to this alert: ${jsonify(specificDetails)} and here's the data for 
    the overall entity: ${jsonify(details)}. As previously mentioned give a summary but coorelate the importance between the alert and the overall entity. At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def alert_prompt(self, question, details, specificDetails):
    finalPrompt = f"""Answer the following question in quotes "${question}" on the data and based on what the nature of the activity is. Explain the cybersecurity risks.
    Be verbose and identify fields you recognize. Answer every part of the question that you recognize and which data relates best to it. Suggest possible investigative directions listed in steps. Here
    are the details for the specific alert: "${jsonify(details)}" and here's the information for the overall entity: "${specificDetails}. Make correlations between 
    the two when answering the question. Answer it as best as you can. 
    
    At the beginning of the response place 
    the following message: "Generated using the non-prod prompts:" 
    
    Do not forget to
    place this message at the beginning of the output. It's important for the message to be there. As mentioned be detailed with the response but also concise and 
    to the point."""
    return finalPrompt
  
  def summary_of_threat_status_summary_prompt(self, details):
    finalPrompt = f"""Can you give me a further summary and explain the security risks and mitigation steps based on this output: ${details}. Answer it as best as you can. At the beginning 
    of the response place the following message: "Generated using the non-prod prompts:"""
    return finalPrompt
  
  def agent_case_question_prompt(self, question, case_details, comments, telemetry):
    return render('agent-case-question.txt', {
      'question': question, 'case_details': case_details,
      'comments': comments, 'telemetry': telemetry })

  def agent_case_comment_prompt(self, details, case_details):
    return render('agent-case-comment.txt', { 'details': details, 'case_details': case_details })