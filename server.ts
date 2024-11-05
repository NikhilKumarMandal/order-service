import app from "./src/app";
import config from "config";
import logger from "./src/config/logger";
import connectDB from "./src/config/db";
import { MessageBroker } from "./src/types/broker";
import { createMessageBroker } from "./src/common/factories/brokerFaxctory";

const startServer = async () => {
  const PORT = config.get("server.port") || 5503;
  let broker: MessageBroker | null = null;
  try {
    await connectDB();
    broker = createMessageBroker()
    await broker.connect()
    await broker.messageConsume(['product'],false)
    app
      .listen(PORT, () => console.log(`Listening on port ${PORT}`))
      .on("error", (err) => {
        console.log("err", err.message);
        process.exit(1);
      });
  } catch (err) {
    logger.error("Error happened: ", err.message);
    // if (broker) {
    //   broker.disconnect()
    // }
    process.exit(1);
  }
};

void startServer();
