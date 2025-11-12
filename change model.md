**Change Default Model**

To change the model you would like to run, go to the skynet-ai-dev-flask-api.py in the skynet-ai-dev-flask-api directory.

In this file go to the ask_llm() method which should be on line 83 and in this method on line 87 change llmservice.ask_claude(question) (This is the default) to any of the following:
* llmservice.ask_sonar(question)
* llmservice.ask_sonar(question)
* llmservice.ask_chat_gpt(question)
* llmservice.ask_claude(question)
