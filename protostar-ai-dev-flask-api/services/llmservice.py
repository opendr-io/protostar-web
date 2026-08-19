import logging
import configparser
from logging.handlers import RotatingFileHandler
from pathlib import Path

logger = logging.getLogger('llm')

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
# Assembled prompts go to their own file rather than api.log: they embed whole
# entity tables and would bury everything else. propagate=False keeps the bodies
# out of the root handler. Off unless [Logging] LogPrompts is set; no handler is
# attached when disabled, so no log file is created.
logprompts = config.getboolean('Logging', 'LogPrompts', fallback=False)
promptlogger = logging.getLogger('prompts')
promptlogger.propagate = False
promptlogger.setLevel(logging.INFO)
if logprompts and not promptlogger.handlers:
  _promptlogdir = Path(__file__).parent.parent.absolute() / "logs"
  _promptlogdir.mkdir(exist_ok=True)
  _prompthandler = RotatingFileHandler(_promptlogdir / "prompts.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding='utf-8')
  # prompts are multi-line, so entries need a visible rule or they run together
  _prompthandler.setFormatter(logging.Formatter('%(asctime)s %(message)s\n' + '=' * 90))
  promptlogger.addHandler(_prompthandler)

class LLMService:
  def __init__(self):
    self.uselocalllm = True
    config.get('Anthropic', 'AnthropicKey')
    self.anthropickey = config.get('Anthropic', 'AnthropicKey')
    self.sonarkey = config.get('Perplexity', 'PerplexityKey')

  def content_to_text(self, content):
    # langchain .content is str OR a list of content blocks, depending on the model response
    if isinstance(content, list):
      return ''.join(block.get('text', '') if isinstance(block, dict) else str(block) for block in content)
    return content

  def ask_claude(self, question):
    try:
      if logprompts:
        promptlogger.info('[claude]\n\n%s\n', question)
      llm = ChatAnthropic(model=config.get('Anthropic', 'ModelName'), api_key=self.anthropickey)
      result = llm.invoke([HumanMessage(content=question)]).content
      return self.content_to_text(result)
    except Exception as e:
      logger.error(e)
      return ''

  def ask_sonar(self, question):
    try:
      if logprompts:
        promptlogger.info('[sonar]\n\n%s\n', question)
      llm = ChatPerplexity(model=config.get("Perplexity", "ModelName"), api_key=self.sonarkey)
      result = llm.invoke([HumanMessage(content=question)]).content
      return self.content_to_text(result)
    except Exception as e:
      logger.error(e)
      return ''
  
  def ask_chat_gpt(self, question):
    pass
  
  def ask_local_llm(self, question):
    # model = LiteLLMModel(model_id="ollama_chat/hermes3:3b", api_base="http://localhost:11434/api/chat", api_key='not-needed', max_tokens=8000)
    # model = OpenAIServerModel(model_id="gemma-3-4b-it-qat", api_base="http://127.0.0.1:1234/v1", api_key="not-needed")
    try:
      if logprompts:
        promptlogger.info('[local]\n\n%s\n', question)
      llm = ChatOpenAI(base_url="http://127.0.0.1:1234/v1", api_key="lm-studio", temperature=0.5)
      result = llm.invoke([HumanMessage(content=question)]).content
      return self.content_to_text(result)
    except Exception as e:
      logger.error(e)
      return ''