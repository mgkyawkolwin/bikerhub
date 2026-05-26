import type { StolenBikeReport } from '@/models/stolenBikeReport';
import type { StolenBikeService } from './stolenBikeService';

const REPORTS: StolenBikeReport[] = [];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class StolenBikeDemoService implements StolenBikeService {
  async createReport(report: StolenBikeReport) {
    const newReport: StolenBikeReport = {
      ...report,
      id: generateId(),
      reportedAt: new Date().toISOString(),
    };

    REPORTS.unshift(newReport);
    return newReport;
  }

  async getReports() {
    return [...REPORTS];
  }

  async getReportById(id: string) {
    return REPORTS.find((item) => item.id === id);
  }
}
