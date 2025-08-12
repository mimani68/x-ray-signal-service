import { Signal } from "../schemas/signal.schema";

export interface SignalData {
  timestamp: number;
  values: [number, number, number];
}

export interface CreateSignalDto {
  deviceId: string;
  data: Array<[number, [number, number, number]]>;
  time: number;
}

export interface SignalRepositoryInterface {
  bulkCreate(signals: Partial<Signal>[]): Promise<Signal[]>;
  getAll(
    query: Record<string, any>,
    page: number,
    limit: number
  ): Promise<{ data: Signal[]; total: number; page: number; limit: number }>;
  getSingle(id: string): Promise<Signal>;
  deleteBulk(ids: string[]): Promise<number>;
  updateBulk(ids: string[], updateData: Partial<Signal>): Promise<number>;
}
