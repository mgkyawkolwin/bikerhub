using System;
using System.ComponentModel.DataAnnotations;

namespace BikerHub.Api.Entities;

public abstract class BaseEntity<TKey>
    where TKey : struct
{
    [Key]
    public TKey Id { get; set; } = default!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public TKey CreatedById { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public TKey UpdatedById { get; set; }
    [Required]
    [ConcurrencyCheck]
    public Guid RowVersion { get; set; } = Guid.NewGuid();
}
