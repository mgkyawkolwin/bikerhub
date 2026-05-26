using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BikerHub.Dtos;
using BikerHub.Services;

namespace BikerHub.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet]
    public async Task<IActionResult> GetGroups()
    {
        var groups = await _groupService.GetGroupsAsync();
        return Ok(new { Success = true, Data = groups });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupById(int id)
    {
        var group = await _groupService.GetGroupByIdAsync(id);
        if (group is null)
        {
            return NotFound(new { Success = false, Message = "Group not found." });
        }

        return Ok(new { Success = true, Data = group });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateGroup(CreateGroupDto dto)
    {
        var group = await _groupService.CreateGroupAsync(dto);
        return Ok(new { Success = true, Data = group });
    }
}
