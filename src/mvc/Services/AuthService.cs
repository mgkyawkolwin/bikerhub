using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BikerHub.Data;
using BikerHub.Dtos.Auth;
using BikerHub.Dtos;
using BikerHub.Entities;
using BikerHub.Exceptions;
using BikerHub.Models;

namespace BikerHub.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly ILogger<AuthService> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly GoogleAuthSettings _googleAuthSettings;

    public AuthService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher, ILogger<AuthService> logger, JwtSettings jwtSettings, GoogleAuthSettings googleAuthSettings)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _logger = logger;
        _jwtSettings = jwtSettings;
        _googleAuthSettings = googleAuthSettings;
    }

    private string CreateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiresInMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        _logger.LogTrace("RegisterAsync called with email {Email}", dto.Email);
        _logger.LogInformation("Registering user {Email}", dto.Email);

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

        if (await _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            _logger.LogWarning("Registration conflict for email {Email}", dto.Email);
            throw new CustomException("A user with this email already exists.");
        }

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            CreatedAt = DateTime.UtcNow,
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _logger.LogDebug("User entity persisted with id {UserId}", user.Id);

        var token = CreateJwtToken(user);
        var response = new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Name,
                user.Email,
                user.Address,
                user.City,
                user.Rating,
                user.RatingCount,
                user.ProfilePictureUrl,
                token
            )
        );

        _logger.LogInformation("Registration completed for user {UserId}", user.Id);
        _logger.LogTrace("AuthResponseDto: {@Response}", response);

        return response;
    }

    public async Task<AuthResponseDto> SignInAsync(LoginDto dto)
    {
        _logger.LogTrace("SignInAsync called with email {Email}", dto.Email);

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            _logger.LogWarning("Sign-in failed for unknown email {Email}", dto.Email);
            throw new CustomException("Invalid email or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Sign-in failed for email {Email}: invalid password", dto.Email);
            throw new CustomException("Invalid email or password.");
        }

        _logger.LogInformation("User {Email} authenticated successfully", dto.Email);

        var token = CreateJwtToken(user);
        var response = new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Name,
                user.Email,
                user.Address,
                user.City,
                user.Rating,
                user.RatingCount,
                user.ProfilePictureUrl,
                token
            )
        );

        _logger.LogTrace("AuthResponseDto: {@Response}", response);
        return response;
    }

    public async Task<AuthResponseDto> SignInWithGoogleAsync(GoogleLoginDto dto)
    {
        _logger.LogTrace("SignInWithGoogleAsync called");

        var tokenInfo = await ValidateGoogleIdTokenAsync(dto.IdToken);
        if (tokenInfo == null)
        {
            _logger.LogWarning("Google token validation failed.");
            throw new CustomException("Invalid Google sign-in token.");
        }

        if (!string.Equals(tokenInfo.Aud, _googleAuthSettings.ClientId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Google token audience mismatch: {Aud}", tokenInfo.Aud);
            throw new CustomException("Invalid Google sign-in token.");
        }

        if (tokenInfo.Iss != "https://accounts.google.com" && tokenInfo.Iss != "accounts.google.com")
        {
            _logger.LogWarning("Google token issuer mismatch: {Issuer}", tokenInfo.Iss);
            throw new CustomException("Invalid Google sign-in token.");
        }

        if (!bool.TryParse(tokenInfo.EmailVerified, out var emailVerified) || !emailVerified)
        {
            _logger.LogWarning("Google email not verified for token: {Email}", tokenInfo.Email);
            throw new CustomException("Google email must be verified.");
        }

        var normalizedEmail = tokenInfo.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null)
        {
            user = new User
            {
                Name = tokenInfo.Name ?? tokenInfo.Email,
                Email = normalizedEmail,
                ProfilePictureUrl = tokenInfo.Picture,
                CreatedAt = DateTime.UtcNow,
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, Guid.NewGuid().ToString("N"));

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Created new user from Google sign-in: {Email}", user.Email);
        }
        else
        {
            var updated = false;
            if (!string.IsNullOrEmpty(tokenInfo.Name) && user.Name != tokenInfo.Name)
            {
                user.Name = tokenInfo.Name;
                updated = true;
            }
            if (!string.IsNullOrEmpty(tokenInfo.Picture) && user.ProfilePictureUrl != tokenInfo.Picture)
            {
                user.ProfilePictureUrl = tokenInfo.Picture;
                updated = true;
            }

            if (updated)
            {
                _dbContext.Users.Update(user);
                await _dbContext.SaveChangesAsync();
            }
        }

        var token = CreateJwtToken(user);
        var response = new AuthResponseDto(
            token,
            new UserDto(
                user.Id,
                user.Name,
                user.Email,
                user.Address,
                user.City,
                user.Rating,
                user.RatingCount,
                user.ProfilePictureUrl,
                token
            )
        );

        _logger.LogTrace("Google auth response created for {Email}", tokenInfo.Email);
        return response;
    }

    private async Task<GoogleIdTokenInfo?> ValidateGoogleIdTokenAsync(string idToken)
    {
        using var httpClient = new HttpClient();
        var uri = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";
        var tokenInfo = await httpClient.GetFromJsonAsync<GoogleIdTokenInfo>(uri);
        return tokenInfo;
    }

    private sealed record GoogleIdTokenInfo(
        string Aud,
        string Iss,
        string Email,
        string EmailVerified,
        string? Name,
        string? Picture
    );
}
