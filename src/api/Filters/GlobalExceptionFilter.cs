using Microsoft.AspNetCore.Mvc.Filters;

namespace BikerHub.Api.Filters;

public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;

    public GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        // Log the exception
        _logger.LogError(context.Exception, 
            "Exception occurred: {Message}", 
            context.Exception.Message);
    }
}