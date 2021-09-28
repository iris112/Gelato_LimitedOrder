import dotenv from "dotenv";
dotenv.config({});
import * as http from "http";
import { createApp, debugLog } from "./Common/app";

const PORT = process.env.PORT || 8000;
const server: http.Server = http.createServer(createApp());
server.listen(PORT, () => {
  debugLog(`Server is running on ${PORT}`);  
});