using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using BikerHub.Api.Data;
using BikerHub.Api.Entities;
using BikerHub.Api.Models;
using BikerHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;
using BikerHub.Api.Filters;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from configuration.");
var googleAuthSettings = builder.Configuration.GetSection("GoogleAuth").Get<GoogleAuthSettings>()
    ?? throw new InvalidOperationException("GoogleAuth section is missing from configuration.");

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(googleAuthSettings);

// Minio settings and storage service
var minioSettings = builder.Configuration.GetSection("Minio").Get<MinioSettings>();
if (minioSettings is not null)
{
    builder.Services.Configure<MinioSettings>(builder.Configuration.GetSection("Minio"));
    builder.Services.AddScoped<IStorageService, MinioStorageService>();
}
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
    };
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllersWithViews(options =>
{
    // Add the global exception filter
    options.Filters.Add<GlobalExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
// System Services
builder.Services.AddHttpContextAccessor();

// Custom Services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.Parse("8.0.32-mysql")));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBlogService, BlogService>();
builder.Services.AddScoped<IChallengeService, ChallengeService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IConfigService, ConfigService>();
builder.Services.AddScoped<ILookUpService, LookUpService>();
builder.Services.AddScoped<IDirectoryService, DirectoryService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IMarketplaceService, MarketplaceService>();
builder.Services.AddScoped<IGarageBikeService, GarageBikeService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<INewsService, NewsService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IRideService, RideService>();
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<IStolenBikeService, StolenBikeService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IPasswordHasher<UserEntity>, PasswordHasher<UserEntity>>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    // This prevents MVC from automatically returning 400 before your action runs
    options.SuppressModelStateInvalidFilter = true;
});
// builder.Services.Configure<JsonOptions>(options =>
// {
//     options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
//     options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
//     options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
// });

var app = builder.Build();
// auto migration for development environment
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();
app.MapControllers();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
