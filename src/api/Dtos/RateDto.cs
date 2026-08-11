using System;
using System.ComponentModel.DataAnnotations;

namespace BikerHub.Dtos;

public sealed class RateDto
{
    public Guid EntityId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }
}
