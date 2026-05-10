export default interface Group {
  id: string;
  title: string;
  icon: string;
  description?: string;
  logoUrl?: string;
  coverPhotoUrl?: string;
  isPrivate?: boolean;
  membersCount?: number;
}
