import { Consumer, EachMessagePayload, Kafka } from "kafkajs";
import { MessageBroker } from "../types/broker";

export class KafkaBroker implements MessageBroker{
    private consumer: Consumer;

    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });

        this.consumer = kafka.consumer({groupId: clientId})
    }

    /**
     * connect the consumer
     */
    async connect() {
        await this.consumer.connect()
    };

    /**
     * disconnect the consumer
     */

    async disconnect() {
        await this.consumer.disconnect()
    };

    /**
     * 
     */

    async messageConsume(topics: string[], fromBeginning: boolean = false) {
        await this.consumer.subscribe({topics,fromBeginning})
        await this.consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message }: EachMessagePayload) => {
                console.log({
                    value: message.value.toString(),
                    topic,
                    partition,
                });
                
            }
        })
    } 

    
} 