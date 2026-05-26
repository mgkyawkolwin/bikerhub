export default class ChatMessage {
    id?: string;
    senderId?: string;
    senderName?: string;
    senderProfilePictureUrl?: string;
    receiverId?: string;
    receiverName?: string;
    receiverProfilePictureUrl?: string;
    textMessage?: string;
    messageDateTimeUTC?: string;
    sent?: boolean = false;
    delivered?: boolean = false;
    read?: boolean = false;
}