import Config from "../config/config"

export function View6()
{
  const config = new Config();
  return (
    <div className="min-h-screen mx-10 text-3xl font-bold pt-4 bg-black text-white">
      {/* <h1>Primary Dash</h1> */}
      <iframe className="mt-4 w-full h-[88vh] rounded-md" src={`${config.ServerURL()}:3000/experiment/view6`} />
    </div>
  )
}