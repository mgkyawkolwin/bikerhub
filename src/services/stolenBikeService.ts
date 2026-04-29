import type { StolenBikeReport } from '@/models/stolenBikeReport';

export const StolenBikeServiceToken = Symbol('StolenBikeService');

export interface StolenBikeService {
  createReport(report: StolenBikeReport): Promise<StolenBikeReport>;
  getReports(): Promise<StolenBikeReport[]>;
  getReportById(id: string): Promise<StolenBikeReport | undefined>;
}
