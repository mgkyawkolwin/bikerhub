using Microsoft.EntityFrameworkCore;
using BikerHub.Entities;

namespace BikerHub.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<BikerHub.Entities.DirectoryEntity> Directories => Set<BikerHub.Entities.DirectoryEntity>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<BikeListing> BikeListings => Set<BikeListing>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<News> News => Set<News>();
    public DbSet<BikerHub.Entities.RouteEntity> Routes => Set<BikerHub.Entities.RouteEntity>();
    public DbSet<RideEntity> Rides => Set<RideEntity>();
    public DbSet<SocialPostEntity> Posts => Set<SocialPostEntity>();
    public DbSet<SocialProfileEntity> SocialProfiles => Set<SocialProfileEntity>();
    public DbSet<SocialPostLikeEntity> SocialPostLikes => Set<SocialPostLikeEntity>();
    public DbSet<SocialPostCommentEntity> SocialPostComments => Set<SocialPostCommentEntity>();
    public DbSet<SocialPostMediaEntity> PostMedia => Set<SocialPostMediaEntity>();
    public DbSet<StolenBikeReport> StolenBikeReports => Set<StolenBikeReport>();
    public DbSet<FriendRequestEntity> FriendRequests => Set<FriendRequestEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SocialProfileEntity>(entity =>
        {
            entity.HasOne(profile => profile.User)
                .WithMany()
                .HasForeignKey(profile => profile.UserId)
                .OnDelete(DeleteBehavior.Cascade);

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
                        .OnDelete(DeleteBehavior.Cascade),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.Cascade),
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
                        .OnDelete(DeleteBehavior.Cascade),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.Cascade),
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
                        .OnDelete(DeleteBehavior.Cascade),
                    join => join
                        .HasOne<SocialProfileEntity>()
                        .WithMany()
                        .HasForeignKey("SocialProfileId")
                        .OnDelete(DeleteBehavior.Cascade),
                    join =>
                    {
                        join.HasKey("SocialProfileId", "FriendUserId");
                        join.ToTable("SocialProfileFriends");
                    });
        });

        modelBuilder.Entity<SocialPostEntity>(entity =>
        {
            entity
                .HasMany(post => post.Media)
                .WithOne(media => media.Post)
                .HasForeignKey(media => media.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
