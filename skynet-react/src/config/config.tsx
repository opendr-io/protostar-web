export default class Config
{
  private baseUrl: string;
  private url: string;
  private port: string
  constructor () 
  {
    this.port = import.meta.env.VITE_REACT_APP_API_PORT || '5002';
    this.url = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';
    this.baseUrl = this.url + ':' + this.port;
  }

  public LoginURL()
  {
    return this.baseUrl + '/login';
  }

  public RenewURL()
  {
    return this.baseUrl + '/renew';
  }

  public LogoutURL()
  {
    return this.baseUrl + '/logout';
  }

  public AskLLMURL()
  {
    return this.baseUrl + '/askllm';
  }

  public AskLocalLLMURL()
  {
    return this.baseUrl + '/asklocalllm';
  }

  public UseLocalLLMURL()
  {
    return this.baseUrl + '/setlocallmuse';
  }

  public ShowGraphURL()
  {
    return this.baseUrl + '/showgraph';
  }

  public EntitiesNeoURL()
  {
    return this.baseUrl + '/getentitiesneo';
  }

  public EntityDetailsNeoURL()
  {
    return this.baseUrl + '/entitydetailsneo';
  }

  public RawEntityDetailsURL()
  {
    return this.baseUrl + '/rawentitydetailsneo';
  }

  public GetUsersURL()
  {
    return this.baseUrl + '/getusers';
  }

  public GetAllEntitiesURL()
  {
    return this.baseUrl + '/getallentities';
  }

  public CreateCaseURL()
  {
    return this.baseUrl + '/createcase';
  }

  public GetAllCasesURL()
  {
    return this.baseUrl + '/getallcases';
  }

  public ServerURL()
  {
    return this.url;
  }
}