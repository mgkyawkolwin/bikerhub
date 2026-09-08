
export type MarketplaceFilterProps = {
  make?: string;
  model?: string;
  modelYear?: string;
  priceMin?: number;
  priceMax?: number;
  cc?: string;
  type?: string;
  city?: string;
  country?: string;
  userId?: string;
};

export class MarketplaceFilter implements MarketplaceFilterProps {
  make?: string;
  model?: string;
  modelYear?: string;
  priceMin?: number;
  priceMax?: number;
  cc?: string;
  type?: string;
  city?: string;
  country?: string;
  userId?: string;

  constructor(props: MarketplaceFilterProps = {}) {
    Object.assign(this, props);
  }
}
