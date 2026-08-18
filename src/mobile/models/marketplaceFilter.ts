
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

  constructor(props: MarketplaceFilterProps = {}) {
    Object.assign(this, props);
  }
}
