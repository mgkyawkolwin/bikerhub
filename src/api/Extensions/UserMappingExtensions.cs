using Microsoft.EntityFrameworkCore;
using BikerHub.Api.Data;
using BikerHub.Api.Dtos;
using BikerHub.Api.Entities;

namespace BikerHub.Api.Extensions;

public static class UserMappingExtensions
{
    public static IQueryable<UserDto> ProjectToDto(this IQueryable<UserEntity> baseQuery, AppDbContext dbContext)
    {
        return from u in baseQuery
               select new UserDto
               {
                   Id = u.Id,
                   DisplayName = u.DisplayName,
                   UserName = u.UserName,
                   Email = u.Email,
                   Address = u.Address,
                   City = u.City,
                   Rating = u.Rating,
                   RatingCount = u.RatingCount,
                   ProfilePictureUrl = u.ProfilePictureUrl,
                   Phone = u.Phone,
                   Token = null
               };
    }

    public static UserDto ToDto(this UserEntity entity)
    {
        if (entity is null) return null!;

        return new UserDto
        {
            Id = entity.Id,
            DisplayName = entity.DisplayName,
            UserName = entity.UserName,
            Email = entity.Email,
            Address = entity.Address,
            City = entity.City,
            Rating = entity.Rating,
            RatingCount = entity.RatingCount,
            ProfilePictureUrl = entity.ProfilePictureUrl,
            Phone = entity.Phone,
            Token = null
        };
    }
}
