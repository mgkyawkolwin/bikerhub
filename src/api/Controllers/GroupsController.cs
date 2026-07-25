using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;
using BikerHub.Exceptions;
using System.Net;
using System.Text.Json;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : BaseController
{
    private readonly IGroupService _groupService;
    private readonly ILogger<GroupsController> _logger;

    public GroupsController(IGroupService groupService, ILogger<GroupsController> logger) : base(logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetGroups()
    {
        try
        {
            _logger.LogDebug("CALLED: GetGroups()");
            var groups = await _groupService.GetGroupsAsync();
            return Ok(new { Success = true, Data = groups });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupById(int id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetGroupById({GroupId})", id);
            var group = await _groupService.GetGroupByIdAsync(id);
            if (group is null)
            {
                return NotFound(new { Success = false, Message = "Group not found." });
            }

            return Ok(new { Success = true, Data = group });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateGroup(CreateGroupDto dto)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateGroup(CreateGroupDto: {Dto})", JsonSerializer.Serialize(dto));
            var group = await _groupService.CreateGroupAsync(dto);
            return Ok(new { Success = true, Data = group });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
