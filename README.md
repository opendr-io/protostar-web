![Alt text](protostar-logo.jpg)

# Getting Started with the Skynet Project Web UI

If you have not yet set up the data layer, see this doc which covers setup of the entire project: (https://github.com/cyberdyne-ventures/skynet-data/blob/main/SETUP.md)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## How to run the project (if you have an existing data layer)
In the project directory, you can run:
### Create `.env` file
In the root directroy of the project create `.env` file with the following env variables
```
REACT_APP_USERNAME="<neo4jusername>"protostar
REACT_APP_PASSWORD="<neo4jpassword>"
REACT_APP_DB_URL="http://localhost:7474/db/neo4j"
```
Replace username and password with the relevant values
The DB URL should be set to the public IP where DB is hosted
The Frontend should be running on the same IP as the DB (on different ports)
protostar
### `npm i`
### `npm start`
This runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
protost