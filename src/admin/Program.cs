using BikerHub.Admin.Components;
using BikerHub.Data;
using BikerHub.Entities;
using BikerHub.Models;
using BikerHub.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebApplication.CreateBuilder(args);


var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from configuration.");
var googleAuthSettings = builder.Configuration.GetSection("GoogleAuth").Get<GoogleAuthSettings>()
    ?? throw new InvalidOperationException("GoogleAuth section is missing from configuration.");

builder.Services.AddLocalization(options => options.ResourcesPath = "");

// Minio settings and storage service
var minioSettings = builder.Configuration.GetSection("Minio").Get<MinioSettings>();
if (minioSettings is not null)
{
    builder.Services.Configure<MinioSettings>(builder.Configuration.GetSection("Minio"));
    builder.Services.AddScoped<IStorageService, MinioStorageService>();
}

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(googleAuthSettings);
builder.Services.AddSingleton<ToastService>();
builder.Services.AddSingleton<DialogService>();
builder.Services.AddFluentUIComponents();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.Parse("8.0.32-mysql")));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IChallengeService, ChallengeService>();
builder.Services.AddScoped<IStorageService, MinioStorageService>();
builder.Services.AddScoped<IPasswordHasher<UserEntity>, PasswordHasher<UserEntity>>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/auth/signin";
        options.AccessDeniedPath = "/auth/signin";
        options.Cookie.Name = "bikerhub.admin.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });
builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();
// builder.Services.AddCascadingValue(sp => 
//     sp.GetRequiredService<IHttpContextAccessor>().HttpContext);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();
app.UseStaticFiles();

// Localization configuration
var supportedCultures = new[] { "en-US", "my-MM" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseRequestLocalization(localizationOptions);
app.UseAntiforgery();

// app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();


app.MapGet("/Culture/Set", (string culture, string redirectUri, HttpContext httpContext) =>
{
    Console.WriteLine($"Culture set to: {culture}, Redirect URI: {redirectUri}");
    if (!string.IsNullOrEmpty(culture))
    {
        var cookieValue = CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(culture));

        httpContext.Response.Cookies.Append(
            CookieRequestCultureProvider.DefaultCookieName,
            cookieValue,
            new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1), IsEssential = true }
        );
    }

    // Convert absolute URLs back to local relative paths, or fallback to "/"
    string target = "/";
    
    if (!string.IsNullOrEmpty(redirectUri))
    {
        // Uri.TryCreate extracts just the Path and Query if a full absolute URL was passed
        if (Uri.TryCreate(redirectUri, UriKind.RelativeOrAbsolute, out var parsedUri))
        {
            target = parsedUri.IsAbsoluteUri ? parsedUri.PathAndQuery : redirectUri;
        }
    }

    // Standard Redirect safely accepts both local and absolute URLs
    return Results.Redirect(target);
});

app.Run();

