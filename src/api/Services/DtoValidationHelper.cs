using System.Net.Mail;
using BikerHub.Exceptions;

namespace BikerHub.Services;

public static class DtoValidationHelper
{
    public static void ValidateRequiredString(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new CustomException($"{fieldName} is required.");
        }
    }

    public static void ValidateGuid(Guid? value, string fieldName)
    {
        if (value == null || value == Guid.Empty)
        {
            throw new CustomException($"{fieldName} is required.");
        }
    }

    public static void ValidateEmail(string? email, string fieldName = "Email")
    {
        ValidateRequiredString(email, fieldName);

        try
        {
            _ = new MailAddress(email!.Trim());
        }
        catch
        {
            throw new CustomException("Invalid email format.");
        }
    }
}
