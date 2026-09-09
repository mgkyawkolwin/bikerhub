using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<BlogEntity> Blogs => Set<BlogEntity>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChallengeParticipantEntity> ChallengeParticipants => Set<ChallengeParticipantEntity>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<BikerHub.Api.Entities.DirectoryEntity> Directories => Set<BikerHub.Api.Entities.DirectoryEntity>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<BikeListingEntity> BikeListings => Set<BikeListingEntity>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<News> News => Set<News>();
    public DbSet<BikerHub.Api.Entities.RouteEntity> Routes => Set<BikerHub.Api.Entities.RouteEntity>();
    public DbSet<RideEntity> Rides => Set<RideEntity>();
    public DbSet<PlanEntity> Plans => Set<PlanEntity>();
    public DbSet<SocialPostEntity> Posts => Set<SocialPostEntity>();
    public DbSet<SocialProfileEntity> SocialProfiles => Set<SocialProfileEntity>();
    public DbSet<SocialPostLikeEntity> SocialPostLikes => Set<SocialPostLikeEntity>();
    public DbSet<SocialPostCommentEntity> SocialPostComments => Set<SocialPostCommentEntity>();
    public DbSet<SocialPostMediaEntity> PostMedia => Set<SocialPostMediaEntity>();
    public DbSet<StolenBikeReportEntity> StolenBikeReports => Set<StolenBikeReportEntity>();
    public DbSet<FriendRequestEntity> FriendRequests => Set<FriendRequestEntity>();
    public DbSet<LookUpEntity> LookUps => Set<LookUpEntity>();
    public DbSet<GarageBikeEntity> GarageBikes => Set<GarageBikeEntity>();
    public DbSet<MediaEntity> Medias => Set<MediaEntity>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<FavoriteEntity> Favorites => Set<FavoriteEntity>();
    public DbSet<RatingEntity> Ratings => Set<RatingEntity>();
    public DbSet<LikeEntity> Likes => Set<LikeEntity>();
    public DbSet<GarageBikeServiceHistoryEntity> GarageBikeServiceHistory => Set<GarageBikeServiceHistoryEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SocialProfileEntity>(entity =>
        {
            entity.HasOne(profile => profile.User)
                .WithMany()
                .HasForeignKey(profile => profile.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Followers relationship - SocialProfile has many User followers
            entity
                .HasMany(profile => profile.Followers)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "SocialProfileFollowers",
                    join => join
                        .HasOne<UserEntity>()
                        .WithMany()
                        .HasForeignKey("FollowerUserId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join =>
                    {
                        join.HasKey("SocialProfileId", "FollowerUserId");
                        join.ToTable("SocialProfileFollowers");
                    });

            // Following relationship - SocialProfile follows many Users
            entity
                .HasMany(profile => profile.Following)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "SocialProfileFollowing",
                    join => join
                        .HasOne<UserEntity>()
                        .WithMany()
                        .HasForeignKey("FollowingUserId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join =>
                    {
                        join.HasKey("SocialProfileId", "FollowingUserId");
                        join.ToTable("SocialProfileFollowing");
                    });

            // Friends relationship - SocialProfile has many User friends
            entity
                .HasMany(profile => profile.Friends)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "SocialProfileFriends",
                    join => join
                        .HasOne<UserEntity>()
                        .WithMany()
                        .HasForeignKey("FriendUserId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.NoAction),
                    join =>
                    {
                        join.HasKey("SocialProfileId", "FriendUserId");
                        join.ToTable("SocialProfileFriends");
                    });
        });

        modelBuilder.Entity<SocialPostEntity>(entity =>
        {
            entity
                .HasMany(post => post.Medias)
                .WithOne(media => media.Post)
                .HasForeignKey(media => media.PostId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChallengeParticipantEntity>(entity =>
        {
            entity.HasIndex(participant => new { participant.ChallengeId, participant.UserId })
                .IsUnique();

            entity.HasOne(participant => participant.Challenge)
                .WithMany(challenge => challenge.Participants)
                .HasForeignKey(participant => participant.ChallengeId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(participant => participant.User)
                .WithMany()
                .HasForeignKey(participant => participant.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<GarageBikeServiceHistoryEntity>(entity =>
        {
            entity.HasOne(history => history.GarageBike)
                .WithMany()
                .HasForeignKey(history => history.GarageBikeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(history => new { history.GarageBikeId, history.ServiceType, history.ServiceDate });
        });
    }
}
