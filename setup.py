import configparser
from pathlib import Path
import initbase
import inittls

config = configparser.ConfigParser()
config.read(Path(__file__).parent.absolute() / "secureconfig.ini")

tls = config.get('General', 'TLS')

if(tls == "False"):
  initbase.run()
else:
  inittls.run()