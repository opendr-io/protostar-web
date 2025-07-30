export default class HelpTextService
{
  constructor() {}

  public AISummaryHelpText()
  {
    let helpText = `Press button to get a summary regarding the data below`;
    return helpText;
  }

  public AIDetailsHelpText()
  {
    let helpText = `Click to get summary of the details pertaining to this alert`;
    return helpText;
  }

  public AskAIHelpText()
  {
    let helpText = `Click to answer question entered in the box above.`;
    return helpText;
  }

  public AddFieldsHelpText()
  {
    let helpText = `Select to add fields. If none appear it means all the fields are displayed.`;
    return helpText;
  }
  
  public RemoveFieldsHelpText()
  {
    let helpText = `Select to remove field from table.`;
    return helpText;
  }

  public EntityHelpText()
  {
    let helpText = `Select to see all the details that make up this entity.`;
    return helpText;
  }

  public EntityDropdownHelpText()
  {
    let helpText = `Select to expand and see other selectable entities.`;
    return helpText;
  }
}