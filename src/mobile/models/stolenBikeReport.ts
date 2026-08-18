import { Media } from "./media";

export type StolenBikeReport = {
  id?: string;
  make?: string;
  model?: string;
  edition?: string;
  year?: number;
  cc?: number;
  mileage?: number;
  vin?: string;
  type?: string;
  stolenDate?: string | Date;
  description?: string;
  medias?: Media[];
  phone?: string;
  city?: string;
  country?: string;
  reportedById?: string;
  reportedByName?:string;
  createdById?: string;
  createdAtUTC?: string;
  updatedAtUTC?: string;
};
