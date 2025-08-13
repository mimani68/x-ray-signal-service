export interface MessageHandler {
  handleMessage(msg: any): Promise<void>;
}