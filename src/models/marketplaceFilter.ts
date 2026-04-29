import type { BikeType } from './bikeType';

export type MarketplaceFilterProps = {
  make?: string;
  model?: string;
  modelYear?: string;
  priceMin?: number;
  priceMax?: number;
  cc?: string;
  type?: BikeType;
  location?: string;
};

export class MarketplaceFilter implements MarketplaceFilterProps {
  make?: string;
  model?: string;
  modelYear?: string;
  priceMin?: number;
  priceMax?: number;
  cc?: string;
  type?: BikeType;
  location?: string;

  constructor(props: MarketplaceFilterProps = {}) {
    Object.assign(this, props);
  }
}
