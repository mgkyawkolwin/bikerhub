import 'reflect-metadata';
import { container } from 'tsyringe';
import { MockServices } from './mockServices';
import { MarketplaceServiceToken } from './marketplaceService';
import { StolenBikeServiceToken } from './stolenBikeService';
import { FavoriteServiceToken } from './favoriteService';
import { LikeServiceToken } from './likeService';
import { RatingServiceToken } from './ratingService';
import { MessageServiceToken } from './messageService';
import { ChatServiceToken } from './chatService';

container.registerSingleton(MarketplaceServiceToken, MockServices);
container.registerSingleton(StolenBikeServiceToken, MockServices);
container.registerSingleton(FavoriteServiceToken, MockServices);
container.registerSingleton(LikeServiceToken, MockServices);
container.registerSingleton(RatingServiceToken, MockServices);
container.registerSingleton(MessageServiceToken, MockServices);
container.registerSingleton(ChatServiceToken, MockServices);

export { container };
