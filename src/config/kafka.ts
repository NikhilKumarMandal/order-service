import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { MessageBroker } from "../types/broker";


export class kafkaBroker implements MessageBroker{
    private consumer: Consumer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });

        this.consumer = kafka.consumer({groupId: clientId})
    }

    /**
     * connect the consumer
     */

    async connectConsumer() {
        await this.consumer.connect()
    }

    /**
     * disconnect the consumer
     */

    async disconnectConsumer() {
        await this.consumer.disconnect()
    };

    /**
     * 
     */

    async consumeMessage(topics: string[], fromBeginning: boolean = false) {

        await this.consumer.subscribe({ topics, fromBeginning })
        
        await this.consumer.run({
            eachMessage: async ({topic,partition,message}) => {
            console.log({
                value: message.value.toString(),
                partition,
                topic
                })
            }
        })
    }
}
