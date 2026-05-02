export const ConfigServiceToken = Symbol('ConfigService');

export interface ConfigService {
  getBusinessTypes(): Promise<string[]>;
  getCities(): Promise<string[]>;
  getStateDivisions(): Promise<string[]>;
}
