import configparser
from pathlib import Path
from marshmallow import Schema, fields, validate, pre_load, post_load
from neo4j import GraphDatabase, RoutingControl
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_perplexity import ChatPerplexity
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.chains.conversation.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.chat_history import InMemoryChatMessageHistory

config = configparser.ConfigParser()
config.read(Path(__file__).parent.parent.absolute() / "agentconfig.ini")

class LLMService:
  def __init__(self):
    self.memory = []
    self.llmkey = config.get('General', 'OpenRouterKey')
    self.llmapiroute = config.get('General', 'OpenRouterURL')
    self.llm = {
      'chatgpt': ChatOpenAI(model=config.get("OpenAI", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute, temperature=0, max_tokens=None, timeout=None, max_retries=2),
      'claude': ChatOpenAI(model=config.get("Anthropic", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute),
      'sonar': ChatOpenAI(model=config.get("Perplexity", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute),
      'lmstudio': ChatOpenAI(model=config.get("LMStudio", "ModelName"), base_url="http://127.0.0.1:1234/v1", api_key="lm-studio", temperature=0.5)
    }
    self.memory.append(MemorySaver())

  def ask_claude(self, question):
    try:
      result = self.llm['claude'].invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''

  def ask_sonar(self, question):
    try:
      result = self.llm['sonar'].invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''
  
  def ask_chat_gpt(self, question):
    try:
      result = self.llm['chatgpt'].invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''
  
  def ask_local_llm(self, question):
    try:
      result = self.llm['lmstudio'].invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''

  def case_investigation(self, chat, model, case):
    try:
      result = self.llm[model].invoke([HumanMessage(content=chat)]).content
      return result
    except Exception as e:
      print(e)
      return ''