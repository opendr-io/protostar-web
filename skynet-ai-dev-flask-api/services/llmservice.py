import configparser
from pathlib import Path
from neo4j import GraphDatabase, RoutingControl
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_perplexity import ChatPerplexity
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

config = configparser.ConfigParser()
config.read(Path(__file__).parent.parent.absolute() / "agentconfig.ini")

class LLMService:
  def __init__(self):
    self.uselocalllm = True
    config.get('Anthropic', 'AnthropicKey')
    self.anthropickey = config.get('Anthropic', 'AnthropicKey')
    self.sonarkey = config.get('Perplexity', 'PerplexityKey')

  def ask_claude(self, question):
    try:
      llm = ChatAnthropic(model=config.get('Anthropic', 'ModelName'), api_key=self.anthropickey)
      result = llm.invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''

  def ask_sonar(self, question):
    llm = ChatPerplexity(model=config.get("Perplexity", "ModelName"), api_key=self.sonarkey)
    result = llm.invoke([HumanMessage(content=question)]).content
    return result
  
  def ask_chat_gpt(self, question):
    pass
  
  def ask_local_llm(self, question):
    # model = LiteLLMModel(model_id="ollama_chat/hermes3:3b", api_base="http://localhost:11434/api/chat", api_key='not-needed', max_tokens=8000)
    # model = OpenAIServerModel(model_id="gemma-3-4b-it-qat", api_base="http://127.0.0.1:1234/v1", api_key="not-needed")
    llm = ChatOpenAI(base_url="http://127.0.0.1:1234/v1", api_key="lm-studio", temperature=0.5)
    result = llm.invoke([HumanMessage(content=question)]).content
    return result
