using System.Security.Claims;
using EmberdPOC.Api.Data;
using EmberdPOC.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EmberdPOC.Api.Endpoints;

public static class SaleEndpoints
{
    public static void MapSaleEndpoints(this WebApplication app)
    {
        var grp = app.MapGroup("/api/sales").WithTags("Sales").RequireAuthorization();

        grp.MapGet("/", async (AppDbContext db) =>
            await db.Sales
                .Include(s => s.Customer)
                .Include(s => s.Items).ThenInclude(i => i.Product)
                .Include(s => s.Payments)
                .OrderByDescending(s => s.SaleDate)
                .Select(s => new
                {
                    s.Id, s.SaleNo, s.SaleDate, s.SubTotalDiscount, s.TotalAmount, s.NetAmount,
                    Customer = new { s.Customer.Id, s.Customer.Name },
                    ItemCount = s.Items.Count,
                    PaymentCount = s.Payments.Count
                })
                .ToListAsync());

        grp.MapGet("/{id}", async (int id, AppDbContext db) =>
        {
            var sale = await db.Sales
                .Include(s => s.Customer)
                .Include(s => s.Items).ThenInclude(i => i.Product)
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.Id == id);
            return sale is null ? Results.NotFound() : Results.Ok(sale);
        });

        grp.MapPost("/", async (CreateSaleRequest req, ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var lastNo = await db.Sales.OrderByDescending(s => s.Id).Select(s => s.SaleNo).FirstOrDefaultAsync();
            var nextNum = 1;
            if (lastNo is not null && int.TryParse(lastNo.Replace("SL-", ""), out var n)) nextNum = n + 1;

            var sale = new Sale
            {
                SaleNo = $"SL-{nextNum:D5}",
                CustomerId = req.CustomerId,
                SaleDate = req.SaleDate,
                SubTotalDiscount = req.SubTotalDiscount,
                CreatedByUserId = userId
            };

            decimal totalAmount = 0;
            foreach (var item in req.Items)
            {
                var product = await db.Products.FindAsync(item.ProductId);
                var unitPrice = product?.Price ?? item.UnitPrice;
                var lineTotal = (item.Qty * unitPrice) - item.Discount;
                sale.Items.Add(new SaleItem
                {
                    ProductId = item.ProductId,
                    Qty = item.Qty,
                    UnitPrice = unitPrice,
                    Discount = item.Discount,
                    LineTotal = lineTotal
                });
                totalAmount += lineTotal;
            }

            sale.TotalAmount = totalAmount;
            sale.NetAmount = totalAmount - req.SubTotalDiscount;

            foreach (var pay in req.Payments)
            {
                sale.Payments.Add(new Payment
                {
                    PaymentMethod = pay.PaymentMethod,
                    Amount = pay.Amount,
                    Reference = pay.Reference
                });
            }

            db.Sales.Add(sale);
            await db.SaveChangesAsync();
            return Results.Created($"/api/sales/{sale.Id}", new { sale.Id, sale.SaleNo });
        });

        grp.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var sale = await db.Sales.FindAsync(id);
            if (sale is null) return Results.NotFound();
            db.Sales.Remove(sale);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}

public record CreateSaleRequest(int CustomerId, DateTime SaleDate, decimal SubTotalDiscount, List<SaleItemRequest> Items, List<PaymentRequest> Payments);
public record SaleItemRequest(int ProductId, decimal Qty, decimal UnitPrice, decimal Discount);
public record PaymentRequest(string PaymentMethod, decimal Amount, string? Reference);
