export default class ChatHead
{
  id: string = '';
  textMessage?: string;
  latestMediaContentType?: string;
  messageDateTimeUTC: string = '';
  unreadCount: number = 0;
  friendId: string = '';
  friendName: string = '';
  friendProfilePictureUrl: string = '';
}