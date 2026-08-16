export default class Config
{
  private baseUrl: string;
  private url: string;
  private port: string
  constructor () 
  {
    this.port = import.meta.env.VITE_REACT_APP_API_PORT || '5002';
    this.url = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost';
    // Proxied build sets VITE_REACT_APP_API_BASE (e.g. "/api") for same-origin
    // routing through the reverse proxy. Unset = direct absolute URL, so local
    // dev is unchanged (see docs/reverse-proxy-design.md).
    this.baseUrl = import.meta.env.VITE_REACT_APP_API_BASE || (this.url + ':' + this.port);
  }

  // Base for the embedded protostar-neo app: "/graph" when proxied, else :3000.
  public GraphBaseURL()
  {
    return import.meta.env.VITE_REACT_APP_GRAPH_BASE || (this.url + ':3000');
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

  public ApiLogURL()
  {
    return this.baseUrl + '/apilog';
  }

  public CorazaLogURL()
  {
    return this.baseUrl + '/corazalog';
  }

  public ConnectionStatusURL()
  {
    return this.baseUrl + '/connectionstatus';
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

  public SearchAlertsURL()
  {
    return this.baseUrl + '/searchalerts';
  }

  public GetUsersURL()
  {
    return this.baseUrl + '/getusers';
  }

  public GetAllEntitiesURL()
  {
    return this.baseUrl + '/getallentities';
  }

  public GetEntityTypesURL()
  {
    return this.baseUrl + '/getentitytypes';
  }

  public CreateCaseURL()
  {
    return this.baseUrl + '/createcase';
  }

  public GetAllCasesURL()
  {
    return this.baseUrl + '/getallcases';
  }

  public PostCaseCommentURL()
  {
    return this.baseUrl + '/postcasecomment';
  }

  public LoadCaseCommentsURL()
  {
    return this.baseUrl + '/loadcasecomments';
  }

  public CloseCaseURL()
  {
    return this.baseUrl + '/closecase';
  }

  public CreateCasesForAllEntitiesURL()
  {
    return this.baseUrl + '/createcasesforallentities';
  }

  public SetAICommentingURL()
  {
    return this.baseUrl + '/setaicommenting';
  }

  public GetAICommentingURL()
  {
    return this.baseUrl + '/getaicommenting';
  }

  public SaveAlertExplanationURL()
  {
    return this.baseUrl + '/savealertexplanation';
  }

  public GetAlertExplanationsURL()
  {
    return this.baseUrl + '/getalertexplanations';
  }

  public ServerURL()
  {
    return this.url;
  }
}
