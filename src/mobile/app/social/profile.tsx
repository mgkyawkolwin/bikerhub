import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, View, RefreshControl, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { useAuthContext } from '@/hooks/use-auth-context';
import type SocialProfile from '@/models/socialProfile';
import type Post from '@/models/post';
import type Comment from '@/models/comment';
import SocialPostCard from '@/components/socialPostCard';
import SocialCommentModal from '@/components/socialCommentModal';
import PopupMenu from '@/components/popupMenu';
import SnackBar from '@/components/snackbar';
import { SocialServiceClient, SocialServiceToken } from '@/services/socialService';

export default function SocialProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const { authUser } = useAuthContext();
  const socialSerivce = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [photoMenuTarget, setPhotoMenuTarget] = useState<'cover' | 'profile' | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToCommentAuthor, setReplyToCommentAuthor] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isProfileUploading, setIsProfileUploading] = useState(false);

  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const isOwnProfile = Boolean(userId && authUser?.id === userId);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileResult, postsResult] = await Promise.all([
        socialSerivce.getProfileById(userId),
        socialSerivce.getPostsByUser(userId, 1, 20),
      ]);
      if (!profileResult.ok || !postsResult.ok) {
        SnackBar.Error('Failed to load profile');
        return;
      }
      const profileData = await profileResult.json();
      const postsData = await postsResult.json();
      if (!profileData.success && !postsData.success) {
        SnackBar.Error('Failed to load profile or posts');
      }
      console.debug('Profile data:', profileData);
      console.debug('Posts data:', postsData);
      setProfile(profileData.data ?? null);
      setPosts(postsData.data.items ?? []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, socialSerivce]);

  const loadComments = useCallback(
    async (postId: string) => {
      setCommentsLoading(true);
      try {
        const response = await socialSerivce.getComments(postId);
        if (!response.ok) {
          SnackBar.Error('Failed to load comments.');
          return;
        }

        const result = await response.json();
        if (!result.success) {
          SnackBar.Error(result.message || 'Failed to load comments.');
          return;
        }

        setComments(result.data ?? []);
      } catch (error) {
        console.error('Failed to load comments:', error);
        SnackBar.Error('Failed to load comments.');
      } finally {
        setCommentsLoading(false);
      }
    },
    [socialSerivce],
  );

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setReplyToCommentId(null);
    setReplyToCommentAuthor(null);
    setCommentInput('');
    await loadComments(postId);
  };

  const closeComments = () => {
    setSelectedPostId(null);
    setReplyToCommentId(null);
    setReplyToCommentAuthor(null);
    setCommentInput('');
    setComments([]);
  };

  const handleDeletePost = async (postId?: string) => {
    if (!postId) return;

    try {
      const response = await socialSerivce.deletePost(postId);
      if (!response.ok) {
        SnackBar.Error('Unable to delete post.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to delete post.');
        return;
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      if (selectedPostId === postId) {
        closeComments();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      SnackBar.Error('Unable to delete post.');
    }
  };

  const handleSharePost = (postId?: string) => {
    if (!postId) return;

    void router.push({ pathname: '/social/create', params: { shareUrl: `bikerhub://posts/${postId}` } });
  };

  const handleConfirmDeletePost = (postId?: string) => {
    if (!postId) return;

    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void handleDeletePost(postId) },
    ]);
  };

  const handleOpenPostMenu = (postId?: string) => {
    if (!postId) return;

    setActiveMenuPostId(postId);
  };

  const clearReply = () => {
    setReplyToCommentId(null);
    setReplyToCommentAuthor(null);
  };

  const getFileName = (uri: string) => {
    const parts = uri.split('/');
    return parts[parts.length - 1] ?? `file-${Date.now()}`;
  };

  const getMimeType = (uri: string) => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'heic':
        return 'image/heic';
      default:
        return 'application/octet-stream';
    }
  };

  const requestLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      SnackBar.Error('Photo library permission is required to upload profile photos.');
      return false;
    }
    return true;
  }, []);

  const requestCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      SnackBar.Error('Camera permission is required to take a profile photo.');
      return false;
    }
    return true;
  }, []);

  const pickImageFromSource = useCallback(async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      if (!(await requestCamera())) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      const imageResult = result as ImagePicker.ImagePickerResult;
      if (imageResult.canceled || !imageResult.assets?.[0]?.uri) {
        return null;
      }

      return imageResult.assets[0].uri;
    }

    if (!(await requestLibrary())) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    const imageResult = result as ImagePicker.ImagePickerResult;
    if (imageResult.canceled || !imageResult.assets?.[0]?.uri) {
      return null;
    }

    return imageResult.assets[0].uri;
  }, [requestCamera, requestLibrary]);

  const handleUploadPhotoFromSource = useCallback(
    async (target: 'cover' | 'profile', source: 'camera' | 'gallery') => {
      if (!isOwnProfile) return;

      const uri = await pickImageFromSource(source);
      if (!uri) return;

      if (target === 'cover') {
        setIsCoverUploading(true);
      } else {
        setIsProfileUploading(true);
      }

      try {
        const response = target === 'cover'
          ? await socialSerivce.uploadProfileCoverPhoto({ uri, name: getFileName(uri), type: getMimeType(uri) })
          : await socialSerivce.uploadProfilePhoto({ uri, name: getFileName(uri), type: getMimeType(uri) });

        if (!response.ok) {
          const errorResult = await response.json().catch(() => null);
          throw new Error(errorResult?.message || `${target === 'cover' ? 'Cover' : 'Profile'} photo upload failed.`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || `${target === 'cover' ? 'Cover' : 'Profile'} photo upload failed.`);
        }

        setProfile(result.data);
        SnackBar.Success(`${target === 'cover' ? 'Cover' : 'Profile'} photo updated.`);
      } catch (error) {
        console.error(`Failed to upload ${target} photo:`, error);
        SnackBar.Error(`Unable to upload ${target} photo. Please try again.`);
      } finally {
        if (target === 'cover') {
          setIsCoverUploading(false);
        } else {
          setIsProfileUploading(false);
        }
      }
    },
    [isOwnProfile, pickImageFromSource, socialSerivce],
  );

  const handleUploadCoverPhoto = useCallback(() => {
    if (!isOwnProfile) return;
    setPhotoMenuTarget('cover');
  }, [isOwnProfile]);

  const handleUploadProfilePhoto = useCallback(() => {
    if (!isOwnProfile) return;
    setPhotoMenuTarget('profile');
  }, [isOwnProfile]);

  const handleSelectPhotoSource = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (!photoMenuTarget) return;
      const target = photoMenuTarget;
      setPhotoMenuTarget(null);
      await handleUploadPhotoFromSource(target, source);
    },
    [handleUploadPhotoFromSource, photoMenuTarget],
  );

  const handleDeletePhoto = useCallback(
    async (target: 'cover' | 'profile') => {
      try {
        const response =
          target === 'cover'
            ? await socialSerivce.deleteProfileCoverPhoto()
            : await socialSerivce.deleteProfilePhoto();

        if (!response.ok) {
          SnackBar.Error('Unable to delete photo.');
          return;
        }

        const result = await response.json();
        if (!result.success) {
          SnackBar.Error(result.message || 'Unable to delete photo.');
          return;
        }

        setProfile(result.data);
      } catch {
        SnackBar.Error('Unable to delete photo.');
      }
    },
    [socialSerivce],
  );

  const handleConfirmDeletePhoto = useCallback(
    (target: 'cover' | 'profile') => {
      if (!target) return;

      Alert.alert(
        'Delete photo',
        `Are you sure you want to delete this ${target === 'cover' ? 'cover' : 'profile'} photo?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => void handleDeletePhoto(target) },
        ],
      );
    },
    [handleDeletePhoto],
  );

  const handleViewPhoto = useCallback(
    (target: 'cover' | 'profile') => {
      if (!profile) return;

      const photoUrl = target === 'cover' ? profile.coverPhotoUrl : profile.profilePhotoUrl;
      if (!photoUrl) return;

      setPhotoMenuTarget(null);
      void router.push(
        `/social/photoViewer?url=${encodeURIComponent(photoUrl)}&title=${encodeURIComponent(
          target === 'cover' ? 'Cover Photo' : 'Profile Photo',
        )}`,
      );
    },
    [profile, router],
  );

  const photoMenuItems = useMemo(() => {
    if (!photoMenuTarget || !profile) return [];

    const hasPhoto = photoMenuTarget === 'cover' ? Boolean(profile.coverPhotoUrl) : Boolean(profile.profilePhotoUrl);
    const items: Array<{ label: string; onPress: () => void; destructive?: boolean }> = [];

    if (hasPhoto) {
      items.push({ label: 'View Photo', onPress: () => handleViewPhoto(photoMenuTarget) });
      items.push({ label: 'Delete Photo', destructive: true, onPress: () => handleConfirmDeletePhoto(photoMenuTarget) });
    }

    items.push({ label: 'Take Photo', onPress: () => handleSelectPhotoSource('camera') });
    items.push({ label: 'Choose From Gallery', onPress: () => handleSelectPhotoSource('gallery') });
    items.push({ label: 'Cancel', onPress: () => setPhotoMenuTarget(null) });

    return items;
  }, [photoMenuTarget, profile, handleViewPhoto, handleConfirmDeletePhoto, handleSelectPhotoSource]);

  const handleCommentSubmit = async () => {
    if (!selectedPostId || !commentInput.trim()) {
      return;
    }

    try {
      const response = await socialSerivce.createComment(
        selectedPostId,
        commentInput.trim(),
        replyToCommentId,
      );

      if (!response.ok) {
        SnackBar.Error('Unable to post comment.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to post comment.');
        return;
      }

      setCommentInput('');
      setReplyToCommentId(null);
      setReplyToCommentAuthor(null);
      await loadComments(selectedPostId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === selectedPostId
            ? { ...post, commentCount: (post.commentCount ?? 0) + 1 }
            : post,
        ),
      );
    } catch (error) {
      console.error('Failed to submit comment:', error);
      SnackBar.Error('Unable to post comment.');
    }
  };

  const handleDeleteComment = async (commentId?: string) => {
    if (!selectedPostId || !commentId) {
      return;
    }

    try {
      const response = await socialSerivce.deleteComment(selectedPostId, commentId);
      if (!response.ok) {
        SnackBar.Error('Unable to delete comment.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to delete comment.');
        return;
      }

      const deletedCount = typeof result.data === 'number' ? result.data : 1;
      await loadComments(selectedPostId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === selectedPostId
            ? { ...post, commentCount: Math.max(0, (post.commentCount ?? deletedCount) - deletedCount) }
            : post,
        ),
      );
    } catch (error) {
      console.error('Failed to delete comment:', error);
      SnackBar.Error('Unable to delete comment.');
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyToCommentId(commentId);
    setReplyToCommentAuthor(authorName);
  };

  const handleFriendRequest = async () => {
    if (!userId || !profile) {
      return;
    }

    try {
      if (profile.isFriend) {
        const response = await socialSerivce.removeFriend(userId);
        if (!response.ok) {
          SnackBar.Error('Unable to unfriend user.');
          return;
        }

        const responseJson = await response.json();
        if (!responseJson.success) {
          SnackBar.Error(responseJson.message || 'Unable to unfriend user.');
          return;
        }

        setProfile(responseJson.data);
        SnackBar.Success('Friend removed.');
        return;
      }

      if (profile.isFriendRequestPending) {
        const response = await socialSerivce.cancelFriendRequest(userId);
        if (!response.ok) {
          SnackBar.Error('Unable to cancel friend request.');
          return;
        }

        const responseJson = await response.json();
        if (!responseJson.success) {
          SnackBar.Error(responseJson.message || 'Unable to cancel friend request.');
          return;
        }

        setProfile(responseJson.data);
        SnackBar.Success('Friend request cancelled.');
        return;
      }

      const response = await socialSerivce.sendFriendRequest(userId);
      if (!response.ok) {
        SnackBar.Error('Unable to send friend request.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Unable to send friend request.');
        return;
      }

      setProfile(responseJson.data);
      SnackBar.Success('Friend request sent.');
    } catch (error) {
      console.error('Failed to update friend request:', error);
      SnackBar.Error(
        profile.isFriend
          ? 'Unable to unfriend user.'
          : profile.isFriendRequestPending
          ? 'Unable to cancel friend request.'
          : 'Unable to send friend request.',
      );
    }
  };

  const handleFollowersPress = () => {
    if (!userId) return;
    void router.push({ pathname: './followers', params: { userId } });
  };

  const handleFollowingPress = () => {
    if (!userId) return;
    void router.push({ pathname: './following', params: { userId } });
  };

  const handleEditSocialLinks = () => {
    void router.push('/social/socialLinks');
  };

  const handleToggleFollow = async () => {
    if (!userId || !profile) {
      return;
    }

    try {
      const response = profile.isFollowing
        ? await socialSerivce.unfollowUser(userId)
        : await socialSerivce.followUser(userId);

      if (!response.ok) {
        SnackBar.Error(profile.isFollowing ? 'Unable to unfollow user.' : 'Unable to follow user.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || (profile.isFollowing ? 'Unable to unfollow user.' : 'Unable to follow user.'));
        return;
      }

      setProfile(responseJson.data);
    } catch (error) {
      console.error('Failed to update follow status:', error);
      SnackBar.Error(profile.isFollowing ? 'Unable to unfollow user.' : 'Unable to follow user.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const renderPost = ({ item }: { item: Post }) => (
    <SocialPostCard
      post={item}
      onAuthorPress={() => router.push({ pathname: '/social/profile', params: { userId: item.createdByUserId ?? '' } })}
      onToggleLove={() => {}}
      onOpenComments={(postId) => void openComments(postId ?? '')}
      onSharePress={() => handleSharePost(item.id)}
      onMenuPress={item.createdByUserId === authUser?.id ? () => void handleOpenPostMenu(item.id) : undefined}
    />
  );

  if (!userId) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color={colors.secondaryText} />
          <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>
            User not found
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingState}>
          <Text style={{ color: colors.secondaryText }}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top, paddingHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Profile
        </Text>
        <TouchableOpacity hitSlop={14}>
          <MaterialIcons name="more-horiz" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          profile ? (
            <>
<TouchableOpacity
                disabled={!isOwnProfile || isCoverUploading}
                onPress={handleUploadCoverPhoto}
                style={styles.coverTouchable}
                activeOpacity={0.9}
              >
                {profile.coverPhotoUrl ? (
                  <Image source={{ uri: profile.coverPhotoUrl }} style={styles.coverImage} />
                ) : (
                  <View style={[styles.coverImage, styles.coverPlaceholder, { backgroundColor: colors.border }]}> 
                    <MaterialIcons name="photo" size={48} color={colors.secondaryText} />
                  </View>
                )}
                {isOwnProfile ? (
                  <View style={[styles.coverEditBadge, { backgroundColor: colors.card }]}> 
                    <MaterialIcons name={isCoverUploading ? 'hourglass-top' : 'photo-camera'} size={20} color={colors.accent} />
                  </View>
                ) : null}
              </TouchableOpacity>

              <View style={styles.profileContainer}>
                {/* Row 1: Avatar + Name + Social Icons */}
                <View style={styles.avatarNameRow}>
                  <TouchableOpacity
                    disabled={!isOwnProfile || isProfileUploading}
                    onPress={handleUploadProfilePhoto}
                    style={styles.avatarTouchable}
                    activeOpacity={0.85}
                  >
                    {profile.avatarUrl ? (
                      <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.border }]}> 
                        <MaterialIcons name="person" size={32} color={colors.secondaryText} />
                      </View>
                    )}
                    {isOwnProfile ? (
                      <View style={[styles.avatarEditBadge, { backgroundColor: colors.card }]}> 
                        <MaterialIcons name={isProfileUploading ? 'hourglass-top' : 'photo-camera'} size={18} color={colors.accent} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.nameAndSocial}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.profileName, { color: colors.text }]}>
                        {profile.displayName}
                      </Text>
                      {!isOwnProfile ? (
                        <TouchableOpacity
                          style={[styles.friendButton, { borderColor: colors.border }]}
                          activeOpacity={0.85}
                          onPress={handleFriendRequest}
                        >
                          <MaterialIcons
                            name={profile.isFriend ? 'person-off' : profile.isFriendRequestPending ? 'person-remove' : 'person-add'}
                            size={18}
                            color={colors.accent}
                          />
                          <Text style={[styles.friendButtonText, { color: colors.accent }]}> 
                            {profile.isFriend
                              ? 'Unfriend'
                              : profile.isFriendRequestPending
                                ? 'Cancel Friend Request'
                                : 'Add Friend'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      {/* <TouchableOpacity style={styles.shareButton} activeOpacity={0.8} onPress={() => { }}>
                        <MaterialIcons name="share" size={18} color={colors.accent} />
                        <Text style={[styles.shareButtonText, { color: colors.accent }]}>Share</Text>
                      </TouchableOpacity> */}
                    </View>
                    {(profile.socialLinks?.length > 0 || isOwnProfile) && (
                      <View style={styles.socialLinksRow}>
                        {profile.socialLinks?.length > 0 ? (
                          <View style={styles.socialIconRow}>
                            {profile.socialLinks.map((link) => (
                              <TouchableOpacity
                                key={link.platform}
                                style={styles.socialIconButton}
                                activeOpacity={0.7}
                                onPress={() => { }}
                              >
                                <MaterialIcons name={mapPlatformIcon(link.platform)} size={16} color={colors.accent} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.noSocialText, { color: colors.secondaryText }]}>Add social links</Text>
                        )}
                        {isOwnProfile ? (
                          <TouchableOpacity
                            style={styles.editSocialButton}
                            activeOpacity={0.7}
                            onPress={handleEditSocialLinks}
                          >
                            <MaterialIcons name="edit" size={18} color={colors.accent} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    )}
                  </View>
                </View>

                {/* Row 2: Bio */}
                {profile.bio ? (
                  <Text style={[styles.profileBio, { color: colors.secondaryText }]}>
                    {profile.bio}
                  </Text>
                ) : null}

                {/* Row 3: Followers, Following, Follow Button */}
                <View style={styles.statsAndFollowRow}>
                  <View style={styles.statsContainer}>
                    <TouchableOpacity style={styles.statItem} activeOpacity={0.8} onPress={handleFollowersPress}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {profile.followersCount}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.accent }]}>
                        Followers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} activeOpacity={0.8} onPress={handleFollowingPress}>
                      <Text style={[styles.statValue, { color: colors.text }]}> 
                        {profile.followingCount}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.accent }]}> 
                        Following
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {!isOwnProfile ? (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={[styles.followButton, { backgroundColor: colors.accent }]}
                        activeOpacity={0.85}
                        onPress={handleToggleFollow}
                      >
                        <Text style={styles.followButtonText}>
                          {profile.isFollowing ? 'Unfollow' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.messageButton, { borderColor: colors.accent }]} activeOpacity={0.85}>
                        <Text style={[styles.messageButtonText, { color: colors.accent }]}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
                {/* Row 4: 5 Stats - Garages, Rides, Distance, Duration, Elevation */}
                <View style={[styles.fiveStatsGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                  {/* Garages */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="garage" size={24} color={colors.accent} />
                    <Text style={[styles.fiveStatValue, { color: colors.text }]}>
                      {profile.garageCount}
                    </Text>
                    <Text style={[styles.fiveStatLabel, { color: colors.secondaryText }]}>
                      Garages
                    </Text>
                  </View>

                  {/* Rides */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="pedal-bike" size={24} color={colors.accent} />
                    <Text style={[styles.fiveStatValue, { color: colors.text }]}>
                      {profile.ridesCount}
                    </Text>
                    <Text style={[styles.fiveStatLabel, { color: colors.secondaryText }]}>
                      Rides
                    </Text>
                  </View>

                  {/* Distance */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="straighten" size={24} color={colors.accent} />
                    <Text style={[styles.fiveStatValue, { color: colors.text }]}>
                      {profile.rideDistance}
                    </Text>
                    <Text style={[styles.fiveStatLabel, { color: colors.secondaryText }]}>
                      Distance
                    </Text>
                  </View>

                  {/* Duration */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="schedule" size={24} color={colors.accent} />
                    <Text style={[styles.fiveStatValue, { color: colors.text }]}>
                      {profile.rideDuration}
                    </Text>
                    <Text style={[styles.fiveStatLabel, { color: colors.secondaryText }]}>
                      Duration
                    </Text>
                  </View>

                  {/* Elevation */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="terrain" size={24} color={colors.accent} />
                    <Text style={[styles.fiveStatValue, { color: colors.text }]}>
                      {profile.rideElevation}
                    </Text>
                    <Text style={[styles.fiveStatLabel, { color: colors.secondaryText }]}>
                      Elevation
                    </Text>
                  </View>
                </View>
                <View style={styles.profileActionRow}>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/social/garage', params: { userId } })}
                  >
                    <MaterialIcons name="garage" size={20} color={colors.text} />
                    <Text style={[styles.profileActionLabel, { color: colors.text }]}>Garages</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileActionButton} activeOpacity={0.8} onPress={() => router.push({ pathname: '/ride/list', params: { userId } })}>
                    <MaterialIcons name="pedal-bike" size={20} color={colors.text} />
                    <Text style={[styles.profileActionLabel, { color: colors.text }]}>Rides</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileActionButton} activeOpacity={0.8} onPress={() => router.push({ pathname: '/ride/plans', params: { userId } })}>
                    <MaterialIcons name="playlist-add" size={20} color={colors.text} />
                    <Text style={[styles.profileActionLabel, { color: colors.text }]}>Plans</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/social/listing', params: { userId } })}
                  >
                    <MaterialIcons name="storefront" size={20} color={colors.text} />
                    <Text style={[styles.profileActionLabel, { color: colors.text }]}>Listing</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Posts Header */}
              <View style={styles.postsHeader}>
                <Text style={[styles.postsTitle, { color: colors.text }]}>Posts</Text>
                <Text style={[styles.postsCount, { color: colors.secondaryText }]}>{posts?.length}</Text>
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          !loading && posts?.length === 0 && profile ? (
            <View style={styles.emptyPosts}>
              <MaterialIcons name="post-add" size={48} color={colors.secondaryText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText, marginTop: 12 }]}>
                No posts yet
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 12,
          gap: 12,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      />

      <SocialCommentModal
        visible={selectedPostId !== null}
        comments={comments}
        commentsLoading={commentsLoading}
        replyToCommentAuthor={replyToCommentAuthor}
        commentInput={commentInput}
        onClose={closeComments}
        onClearReply={clearReply}
        onReply={handleReply}
        onDeleteComment={handleDeleteComment}
        onCommentInputChange={setCommentInput}
        onCommentSubmit={handleCommentSubmit}
      />
      <PopupMenu
        visible={activeMenuPostId !== null}
        onClose={() => setActiveMenuPostId(null)}
        items={[
          {
            label: 'Share',
            onPress: () => handleSharePost(activeMenuPostId ?? undefined),
          },
          {
            label: 'Delete',
            destructive: true,
            onPress: () => handleConfirmDeletePost(activeMenuPostId ?? undefined),
          },
          {
            label: 'Cancel',
            onPress: () => setActiveMenuPostId(null),
          },
        ]}
      />
      <PopupMenu
        visible={photoMenuTarget !== null}
        onClose={() => setPhotoMenuTarget(null)}
        items={photoMenuItems}
      />
    </View>
  );
}

function mapPlatformIcon(platform: string): keyof typeof MaterialIcons.glyphMap {
  const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    facebook: 'facebook',
    instagram: 'camera-alt',
    youtube: 'play-circle',
    telegram: 'telegram',
    x: 'alternate-email',
    tiktok: 'music-note',
    web: 'language',
  };
  return icons[platform] || 'link';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  coverTouchable: {
    position: 'relative',
  },
  coverEditBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Row 1: Avatar + Name + Social Icons
  avatarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameAndSocial: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  friendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialIconRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  editSocialButton: {
    padding: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  noSocialText: {
    fontSize: 13,
    fontWeight: '500',
  },
  socialIconButton: {
    padding: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Row 2: Bio
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  // Row 3: Followers, Following, Follow Button
  statsAndFollowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  statLabel: {
    fontSize: 13,
  },
  followButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  marketplaceButton: {
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  profileActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  profileActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Row 4: 5 Stats Grid
  fiveStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  fiveStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  fiveStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  fiveStatLabel: {
    fontSize: 11,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  postsCount: {
    fontSize: 14,
  },
  postCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  singleImage: {
    width: '100%',
    height: 220,
  },
  multiImage: {
    width: '48%',
    height: 140,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    marginLeft: 4,
  },
  postShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
