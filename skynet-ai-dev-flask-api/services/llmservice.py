import os
from neo4j import GraphDatabase, RoutingControl
from smolagents import OpenAIServerModel, ToolCallingAgent, HfApiModel, CodeAgent, MultiStepAgent, LiteLLMModel

class LLMService:
  def __init__(self):
    self.uselocalllm = True
    self.anthropickey = ''
    self.sonarkey = ''

  def ask_claude(self, question):
    try:
      model = LiteLLMModel(model_id="anthropic/claude-3-5-sonnet-latest", api_key=self.anthropickey, max_tokens=8000)
      info = [{"role": "user", "content": question}]
      result = model(info).content
      return result
    except Exception as e:
      print(e)
      return ''

  def ask_sonar(self, question):
    model = LiteLLMModel(model="anthropic/claude-3-5-sonnet-latest", api_key=self.anthropickey, max_tokens=8000)
    info = [{"role": "user", "content": question}]
    result = model(info).content
    return result
  
  def ask_chat_gpt(self, question):
    pass
  
  def ask_local_llm(self, question):
    # model = LiteLLMModel(model_id="ollama_chat/hermes3:3b", api_base="http://localhost:11434/api/chat", api_key='not-needed', max_tokens=8000)
    model = OpenAIServerModel(model_id="gemma-3-4b-it-qat", api_base="http://127.0.0.1:1234/v1", api_key="not-needed")
    info = [{"role": "user", "content": question}]
    result = model(info).content
    # agent = ToolCallingAgent(name="LocalLLMAgent", model=model, tools=[], max_steps=1)
    # agent = CodeAgent(name="LocalLLMAgent", model=model, tools=[], max_steps=1)
    # agent = MultiStepAgent(name="LocalLLMAgent", model=model, tools=[], max_steps=1)
    # result = agent.run(question)
    # model = lmstudio.llm('hermes-3-llama-3.2-3b')
    # result = model.respond(question).content
    return result