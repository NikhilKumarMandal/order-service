export interface MessageBroker{
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    messageConsume: (topics: string[], fromBeginning: boolean) => Promise<void>;
}