using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BikerHub.Controllers;

public class BaseController : Controller  // Use a custom name, not ControllerBase
{
    private readonly ILogger<BaseController> _logger;

    public BaseController(ILogger<BaseController> logger)
    {
        _logger = logger;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        // Log the action being executed
        _logger.LogInformation("Executing action: {Action} on {Controller}", 
            context.ActionDescriptor.DisplayName,
            context.Controller.GetType().Name);

        // Check for model binding errors
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => new { 
                    ErrorMessage = e.ErrorMessage, 
                    Exception = e.Exception?.Message 
                })
                .ToList();

            _logger.LogWarning("Model binding errors: {Errors}", 
                System.Text.Json.JsonSerializer.Serialize(errors));
        }

        // Log request details (optional)
        // if (context.HttpContext.Request.ContentLength > 0)
        // {
        //     // Read the request body - be careful as it can only be read once
        //     context.HttpContext.Request.EnableBuffering();
        //     using var reader = new StreamReader(
        //         context.HttpContext.Request.Body, 
        //         Encoding.UTF8, 
        //         leaveOpen: true);
        //     var body = reader.ReadToEnd();
        //     context.HttpContext.Request.Body.Position = 0;
            
        //     _logger.LogDebug("Request body: {Body}", body);
        // }

        base.OnActionExecuting(context);
    }

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Log the action being executed
        _logger.LogInformation("Executing action: {Action} on {Controller}", 
            context.ActionDescriptor.DisplayName,
            context.Controller.GetType().Name);

        // Check for model binding errors
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => new { 
                    ErrorMessage = e.ErrorMessage, 
                    Exception = e.Exception?.Message 
                })
                .ToList();

            _logger.LogWarning("Model binding errors: {Errors}", 
                System.Text.Json.JsonSerializer.Serialize(errors));
        }

        // Log request details (optional)
        // if (context.HttpContext.Request.ContentLength > 0)
        // {
        //     // Read the request body - be careful as it can only be read once
        //     context.HttpContext.Request.EnableBuffering();
        //     using var reader = new StreamReader(
        //         context.HttpContext.Request.Body, 
        //         Encoding.UTF8, 
        //         leaveOpen: true);
        //     var body = reader.ReadToEnd();
        //     context.HttpContext.Request.Body.Position = 0;
            
        //     _logger.LogDebug("Request body: {Body}", body);
        // }

        await base.OnActionExecutionAsync(context, next);
    }

    public override void OnActionExecuted(ActionExecutedContext context)
    {
        // Log after action execution
        if (context.Exception != null)
        {
            _logger.LogError(context.Exception, "Action failed");
        }
        else
        {
            _logger.LogInformation("Action completed successfully");
        }

        base.OnActionExecuted(context);
    }
}