using System;
using System.ComponentModel.DataAnnotations;

namespace BikerHub.Entities;

public abstract class EntityBase<TKey>
    where TKey : struct
{
    [Key]
    public TKey Id { get; set; } = default!;

    public DateTime CreatedAtUTC { get; set; } = DateTime.UtcNow;
    public TKey CreatedById { get; set; }
    public DateTime UpdatedAtUTC { get; set; }
    public TKey UpdatedById { get; set; }
}
