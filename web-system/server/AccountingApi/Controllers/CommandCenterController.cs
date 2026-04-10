using AccountingApi.Data;
using AccountingApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace AccountingApi.Controllers;

[ApiController]
[Route("api/command-center")]
public sealed class CommandCenterController : ControllerBase
{
    private readonly AccountingDbContext _db;

    public CommandCenterController(AccountingDbContext db)
    {
        _db = db;
    }

    private (int? userId, string? username) GetCurrentUser()
    {
        var uidClaim = User.FindFirst("uid")?.Value;
        _ = int.TryParse(uidClaim, out var uid);
        var username = User.Identity?.Name;
        return (uid == 0 ? null : uid, username);
    }

    // ── SUPPORT TICKETS ──

    /// <summary>Submit a support ticket (unauthenticated — from login page)</summary>
    [HttpPost("tickets")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitTicket([FromBody] SubmitTicketRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username))
            return BadRequest(new { error = "Username is required." });

        var ticket = new AppSupportTicket
        {
            FromUsername = req.Username.Trim(),
            Message = req.Message?.Trim() ?? "",
            Status = "open",
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.AppSupportTickets.Add(ticket);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Support ticket submitted.", ticketId = ticket.Id });
    }

    /// <summary>List all tickets (superadmin only)</summary>
    [HttpGet("tickets")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> ListTickets()
    {
        var tickets = await _db.AppSupportTickets
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync();

        return Ok(new { data = tickets, count = tickets.Count });
    }

    /// <summary>Resolve a ticket (superadmin only)</summary>
    [HttpPut("tickets/{id}/resolve")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> ResolveTicket(int id, [FromBody] ResolveTicketRequest req)
    {
        var ticket = await _db.AppSupportTickets.FindAsync(id);
        if (ticket == null) return NotFound(new { error = "Ticket not found." });

        var (_, username) = GetCurrentUser();
        ticket.Status = "resolved";
        ticket.ResolvedBy = username;
        ticket.AdminNotes = req.Notes?.Trim();
        ticket.ResolvedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Ticket resolved.", data = ticket });
    }

    /// <summary>Dismiss a ticket (superadmin only)</summary>
    [HttpDelete("tickets/{id}")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> DismissTicket(int id)
    {
        var ticket = await _db.AppSupportTickets.FindAsync(id);
        if (ticket == null) return NotFound(new { error = "Ticket not found." });

        var (_, username) = GetCurrentUser();
        ticket.Status = "dismissed";
        ticket.ResolvedBy = username;
        ticket.ResolvedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Ticket dismissed." });
    }

    // ── ANNOUNCEMENTS ──

    /// <summary>Create a new announcement (superadmin only)</summary>
    [HttpPost("announcements")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });

        var (userId, username) = GetCurrentUser();

        var announcement = new AppAnnouncement
        {
            AuthorId = userId ?? 0,
            AuthorUsername = username ?? "System",
            Title = req.Title.Trim(),
            Body = req.Body?.Trim() ?? "",
            ImageData = req.ImageData,
            Priority = req.Priority ?? "normal",
            TargetType = req.TargetType ?? "all",
            TargetUsersJson = req.TargetUsers != null ? JsonSerializer.Serialize(req.TargetUsers) : null,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = req.ExpiresAtUtc
        };

        _db.AppAnnouncements.Add(announcement);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Announcement published.", data = announcement });
    }

    /// <summary>List all announcements (superadmin view)</summary>
    [HttpGet("announcements")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> ListAnnouncements()
    {
        var announcements = await _db.AppAnnouncements
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync();

        var reactionCounts = await _db.AppAnnouncementReactions
            .GroupBy(r => r.AnnouncementId)
            .Select(g => new { AnnouncementId = g.Key, Count = g.Count() })
            .ToListAsync();

        var countMap = reactionCounts.ToDictionary(r => r.AnnouncementId, r => r.Count);

        var result = announcements.Select(a => new
        {
            a.Id,
            a.AuthorUsername,
            a.Title,
            a.Body,
            HasImage = !string.IsNullOrEmpty(a.ImageData),
            a.Priority,
            a.TargetType,
            TargetUsers = a.TargetUsersJson != null
                ? JsonSerializer.Deserialize<string[]>(a.TargetUsersJson)
                : null,
            a.CreatedAtUtc,
            a.ExpiresAtUtc,
            ReactionCount = countMap.GetValueOrDefault(a.Id, 0)
        });

        return Ok(new { data = result });
    }

    /// <summary>Delete an announcement (superadmin only)</summary>
    [HttpDelete("announcements/{id}")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> DeleteAnnouncement(int id)
    {
        var announcement = await _db.AppAnnouncements.FindAsync(id);
        if (announcement == null) return NotFound(new { error = "Announcement not found." });

        // Also delete reactions
        var reactions = await _db.AppAnnouncementReactions.Where(r => r.AnnouncementId == id).ToListAsync();
        _db.AppAnnouncementReactions.RemoveRange(reactions);
        _db.AppAnnouncements.Remove(announcement);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Announcement deleted." });
    }

    /// <summary>Get announcements for the current user (notification bell)</summary>
    [HttpGet("my-announcements")]
    [Authorize]
    public async Task<IActionResult> GetMyAnnouncements()
    {
        var (userId, username) = GetCurrentUser();
        var now = DateTime.UtcNow;

        var query = _db.AppAnnouncements
            .Where(a => a.ExpiresAtUtc == null || a.ExpiresAtUtc > now)
            .OrderByDescending(a => a.CreatedAtUtc);

        var all = await query.ToListAsync();

        // Filter to announcements targeting this user
        var mine = all.Where(a =>
        {
            if (a.TargetType == "all") return true;
            if (a.TargetUsersJson == null) return false;
            try
            {
                var targets = JsonSerializer.Deserialize<string[]>(a.TargetUsersJson);
                return targets?.Any(t => string.Equals(t, username, StringComparison.OrdinalIgnoreCase)) == true;
            }
            catch { return false; }
        }).ToList();

        // Get reaction info
        var announcementIds = mine.Select(a => a.Id).ToList();
        var reactions = await _db.AppAnnouncementReactions
            .Where(r => announcementIds.Contains(r.AnnouncementId))
            .ToListAsync();

        var result = mine.Select(a =>
        {
            var announcementReactions = reactions.Where(r => r.AnnouncementId == a.Id).ToList();
            return new
            {
                a.Id,
                a.AuthorUsername,
                a.Title,
                a.Body,
                a.ImageData,
                a.Priority,
                a.CreatedAtUtc,
                ReactionCount = announcementReactions.Count,
                ReactedByMe = announcementReactions.Any(r => r.UserId == userId),
                ReactedBy = announcementReactions.Select(r => r.Username).ToList()
            };
        });

        return Ok(new { data = result });
    }

    /// <summary>Get full announcement detail</summary>
    [HttpGet("announcements/{id}")]
    [Authorize]
    public async Task<IActionResult> GetAnnouncementDetail(int id)
    {
        var announcement = await _db.AppAnnouncements.FindAsync(id);
        if (announcement == null) return NotFound(new { error = "Announcement not found." });

        var (userId, _) = GetCurrentUser();
        var reactions = await _db.AppAnnouncementReactions
            .Where(r => r.AnnouncementId == id)
            .ToListAsync();

        return Ok(new
        {
            data = new
            {
                announcement.Id,
                announcement.AuthorUsername,
                announcement.Title,
                announcement.Body,
                announcement.ImageData,
                announcement.Priority,
                announcement.CreatedAtUtc,
                ReactionCount = reactions.Count,
                ReactedByMe = reactions.Any(r => r.UserId == userId),
                ReactedBy = reactions.Select(r => new { r.Username, r.ReactionType, r.CreatedAtUtc }).ToList()
            }
        });
    }

    /// <summary>Toggle reaction on an announcement</summary>
    [HttpPost("announcements/{id}/react")]
    [Authorize]
    public async Task<IActionResult> ToggleReaction(int id)
    {
        var announcement = await _db.AppAnnouncements.FindAsync(id);
        if (announcement == null) return NotFound(new { error = "Announcement not found." });

        var (userId, username) = GetCurrentUser();
        if (userId == null) return Unauthorized();

        var existing = await _db.AppAnnouncementReactions
            .FirstOrDefaultAsync(r => r.AnnouncementId == id && r.UserId == userId.Value);

        if (existing != null)
        {
            _db.AppAnnouncementReactions.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { liked = false, message = "Reaction removed." });
        }

        _db.AppAnnouncementReactions.Add(new AppAnnouncementReaction
        {
            AnnouncementId = id,
            UserId = userId.Value,
            Username = username ?? "unknown",
            ReactionType = "like",
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return Ok(new { liked = true, message = "Reaction added." });
    }

    /// <summary>Get open ticket count (for sidebar badge)</summary>
    [HttpGet("tickets/open-count")]
    [Authorize(Roles = "superadmin")]
    public async Task<IActionResult> GetOpenTicketCount()
    {
        var count = await _db.AppSupportTickets.CountAsync(t => t.Status == "open");
        return Ok(new { count });
    }
}

// Request DTOs
public sealed record SubmitTicketRequest(string Username, string? Message);
public sealed record ResolveTicketRequest(string? Notes);
public sealed record CreateAnnouncementRequest(
    string Title,
    string? Body,
    string? ImageData,
    string? Priority,
    string? TargetType,
    string[]? TargetUsers,
    DateTime? ExpiresAtUtc);
