import 'reflect-metadata';
import { container } from 'tsyringe';
import { MarketplaceDemoService } from './marketplace-demo-service';
import { MarketplaceServiceToken } from './marketplace-service';
import { StolenBikeDemoService } from './stolen-bike-demo-service';
import { StolenBikeServiceToken } from './stolen-bike-service';

container.registerSingleton(MarketplaceServiceToken, MarketplaceDemoService);
container.registerSingleton(StolenBikeServiceToken, StolenBikeDemoService);

export { container };
