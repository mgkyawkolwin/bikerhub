import { Media } from "./media";

export type StolenBikeReport = {
  id?: string;
  make?: string;
  model?: string;
  edition?: string;
  year?: number;
  cc?: number;
  mileage?: string;
  vin?: string;
  type?: string;
  stolenDate?: string | Date;
  description?: string;
  medias?: Media[];
  phone?: string;
  city?: string;
  country?: string;
};
