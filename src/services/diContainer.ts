import 'reflect-metadata';
import { container } from 'tsyringe';
import { MockMarketPlaceService } from './marketPlaceServiceMock';
import { MockAuthService } from './authServiceMock';
import { MockMessageService } from './messageServiceMock';
import { MockChatService } from './chatServiceMock';
import { MockNewsService } from './newsServiceMock';
import { MockBlogService } from './blogServiceMock';
import { MarketplaceServiceToken } from './marketplaceService';
import { StolenBikeServiceToken } from './stolenBikeService';
import { MessageServiceToken } from './messageService';
import { NewsServiceToken } from './newsService';
import { BlogServiceToken } from './blogService';
import { ChatServiceToken } from './chatService';
import { AuthServiceToken } from './authService';
import { UserServiceToken } from './userService';

container.registerSingleton(MarketplaceServiceToken, MockMarketPlaceService);
container.registerSingleton(StolenBikeServiceToken, MockMarketPlaceService);
container.registerSingleton(MessageServiceToken, MockMessageService);
container.registerSingleton(NewsServiceToken, MockNewsService);
container.registerSingleton(BlogServiceToken, MockBlogService);
container.registerSingleton(ChatServiceToken, MockChatService);
container.registerSingleton(AuthServiceToken, MockAuthService);
container.registerSingleton(UserServiceToken, MockMarketPlaceService);

export { container };
