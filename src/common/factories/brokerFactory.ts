import config from "config";
import { MessageBroker } from "../../types/broker";
import { kafkaBroker } from "../../config/kafka";

let broker: MessageBroker | null = null;

export const createMessageBroker = (): MessageBroker => {
  console.log("connecting to kafka broker...");
  const brokerUrl = config.get("kafka.broker");

  if (!brokerUrl) {
    throw new Error("Kafka broker URL is not configured. Please set kafka.broker in your config file.");
  }

  if (!broker) {
  broker = new kafkaBroker("order-service", [brokerUrl] as string[]);
  }
  return broker
};