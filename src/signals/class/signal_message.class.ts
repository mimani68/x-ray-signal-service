import { MessageHandler } from "../interfaces/message_handler.interface";

export class SignalMessageHandler implements MessageHandler {
  private signalModel: any;
  private queueName: string;

  constructor(signalModel: any, queueName: string) {
    this.signalModel = signalModel;
    this.queueName = queueName;
  }

  async handleMessage(msg: any): Promise<void> {
    const content = JSON.parse(msg.content.toString());
    
    if (!content || Object.keys(content).length === 0) {
      throw new Error("Missing content in message");
    }

    const deviceId = Object.keys(content)[0];
    const signalData = content[deviceId];
    
    if (!signalData?.data || !signalData?.time) {
      throw new Error("Invalid signal data structure");
    }

    const signal = new this.signalModel({
      deviceId,
      data: signalData.data,
      time: signalData.time
    });
    
    await signal.save();
    console.log(`Successfully processed signal, DeviceID=${deviceId}`);
  }
}