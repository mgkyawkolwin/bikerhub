export default interface FriendRequest {
  id: string;
  fromProfileId: string;
  fromUserId: string;
  fromUserName: string;
  fromDisplayName: string;
  fromProfilePictureUrl?: string;
  fromCoverPhotoUrl?: string;
  fromBio?: string;
  createdAtUTC: string;
}
