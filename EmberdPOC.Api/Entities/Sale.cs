namespace EmberdPOC.Api.Entities;

public class Sale
{
    public int Id { get; set; }
    public string SaleNo { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public DateTime SaleDate { get; set; }
    public decimal SubTotalDiscount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal NetAmount { get; set; }
    public int CreatedByUserId { get; set; }
    public ICollection<SaleItem> Items { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}

public class SaleItem
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal LineTotal { get; set; }
}

public class Payment
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // Cash, Card, BankTransfer
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
}
