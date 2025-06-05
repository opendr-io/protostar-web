export default class Config
{
  constructor () {}

  public LoginURL()
  {
    return 'http://192.168.1.31:5002/login';
  }

  public RenewURL()
  {
    return 'http://192.168.1.31:5002/renew';
  }

  public LogoutURL()
  {
    return 'http://192.168.1.31:5002/logout';
  }

  public AskLLMURL()
  {
    return 'http://192.168.1.31:5002/askllm';
  }

  public AskLocalLLMURL()
  {
    return 'http://192.168.1.31:5002/asklocalllm';
  }

  public UseLocalLLMURL()
  {
    return 'http://192.168.1.31:5002/setlocallmuse';
  }

  public ShowGraphURL()
  {
    return 'http://192.168.1.31:5002/showgraph';
  }

  public EntitiesNeoURL()
  {
    return 'http://192.168.1.31:5002/getentitiesneo';
  }

  public EntityDetailsNeoURL()
  {
    return 'http://192.168.1.31:5002/entitydetailsneo';
  }

  public RawEntityDetailsURL()
  {
    return 'http://192.168.1.31:5002/rawentitydetailsneo';
  }
}