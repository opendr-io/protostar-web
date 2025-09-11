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
from langchain.chains.conversation.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.chat_history import InMemoryChatMessageHistory

config = configparser.ConfigParser()
config.read(Path(__file__).parent.parent.absolute() / "agentconfig.ini")

class LLMService:
  def __init__(self):
    self.uselocalllm = True
    self.llmkey = config.get('General', 'OpenRouterKey')
    self.llmapiroute = config.get('General', 'OpenRouterURL')
    self.memory = MemorySaver()

  def ask_claude(self, question):
    try:
      llm = ChatOpenAI(model=config.get("Anthropic", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute)
      result = llm.invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''

  def ask_sonar(self, question):
    try:
      llm = ChatPerplexity(model=config.get("Perplexity", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute)
      result = llm.invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''
  
  def ask_chat_gpt(self, question):
    try:
      llm = llm = ChatOpenAI(model=config.get("OpenAI", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute, temperature=0, max_tokens=None, timeout=None, max_retries=2)
      result = llm.invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''
  
  def ask_local_llm(self, question):
    try:
      llm = ChatOpenAI(base_url="http://127.0.0.1:1234/v1", api_key="lm-studio", temperature=0.5)
      result = llm.invoke([HumanMessage(content=question)]).content
      return result
    except Exception as e:
      print(e)
      return ''
    
  def chat_with_claude(self, chat):
    try:
      llm = ChatOpenAI(model=config.get("Anthropic", "ModelName"), openai_api_key=self.llmkey, openai_api_base=self.llmapiroute)
      result = llm.invoke([HumanMessage(content=chat)]).content
      return result
    except Exception as e:
      print(e)
      return ''