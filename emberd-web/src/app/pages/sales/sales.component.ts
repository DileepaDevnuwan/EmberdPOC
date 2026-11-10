import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { CRUD_STYLES } from '../master/users/users.component';

interface SaleItem { productId: number; productName: string; qty: number; unitPrice: number; discount: number; lineTotal: number; }
interface PaymentLine { paymentMethod: string; amount: number; reference: string; }

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="page">
      <div class="header">
        <h2>Sales</h2>
        <button class="btn-primary" (click)="newSale()">+ New Sale</button>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>New Sale</h3>
          <div class="form-row">
            <div class="field">
              <label>Customer</label>
              <select [(ngModel)]="sale.customerId">
                <option [ngValue]="0">-- Select Customer --</option>
                @for (c of customers(); track c.id) { <option [ngValue]="c.id">{{ c.name }} ({{ c.code }})</option> }
              </select>
            </div>
            <div class="field"><label>Sale Date</label><input [(ngModel)]="sale.saleDate" type="date" /></div>
          </div>

          <h4>Items</h4>
          <div class="item-row form-row" style="align-items:end;">
            <div class="field">
              <label>Product</label>
              <select [(ngModel)]="newItem.productId" (ngModelChange)="onProductSelect($event)">
                <option [ngValue]="0">-- Select --</option>
                @for (p of products(); track p.id) { <option [ngValue]="p.id">{{ p.name }} ({{ p.price | number:'1.2-2' }})</option> }
              </select>
            </div>
            <div class="field" style="max-width:80px;"><label>Qty</label><input [(ngModel)]="newItem.qty" type="number" min="1" /></div>
            <div class="field" style="max-width:100px;"><label>Unit Price</label><input [(ngModel)]="newItem.unitPrice" type="number" /></div>
            <div class="field" style="max-width:100px;"><label>Discount</label><input [(ngModel)]="newItem.discount" type="number" /></div>
            <button class="btn-primary" style="height:34px;" (click)="addItem()">Add</button>
          </div>

          @if (items().length) {
            <table style="margin-bottom:1rem;">
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>Line Total</th><th></th></tr></thead>
              <tbody>
                @for (item of items(); track $index) {
                  <tr><td>{{ item.productName }}</td><td>{{ item.qty }}</td><td>{{ item.unitPrice | number:'1.2-2' }}</td>
                  <td>{{ item.discount | number:'1.2-2' }}</td><td>{{ item.lineTotal | number:'1.2-2' }}</td>
                  <td><button class="btn-sm btn-danger" (click)="removeItem($index)">X</button></td></tr>
                }
              </tbody>
            </table>
          }

          <div class="form-row">
            <div class="field" style="max-width:200px;">
              <label>Sub-Total Discount</label>
              <input [(ngModel)]="sale.subTotalDiscount" type="number" />
            </div>
            <div style="padding-top:20px; font-weight:bold;">
              Total: {{ totalAmount() | number:'1.2-2' }} | Net: {{ netAmount() | number:'1.2-2' }}
            </div>
          </div>

          <h4>Payments</h4>
          <div class="form-row" style="align-items:end;">
            <div class="field">
              <label>Method</label>
              <select [(ngModel)]="newPay.paymentMethod">
                <option value="Cash">Cash</option><option value="Card">Card</option><option value="BankTransfer">Bank Transfer</option>
              </select>
            </div>
            <div class="field" style="max-width:120px;"><label>Amount</label><input [(ngModel)]="newPay.amount" type="number" /></div>
            <div class="field"><label>Reference</label><input [(ngModel)]="newPay.reference" /></div>
            <button class="btn-primary" style="height:34px;" (click)="addPayment()">Add</button>
          </div>
          @if (payments().length) {
            <table style="margin-bottom:1rem;">
              <thead><tr><th>Method</th><th>Amount</th><th>Reference</th><th></th></tr></thead>
              <tbody>
                @for (p of payments(); track $index) {
                  <tr><td>{{ p.paymentMethod }}</td><td>{{ p.amount | number:'1.2-2' }}</td><td>{{ p.reference }}</td>
                  <td><button class="btn-sm btn-danger" (click)="removePayment($index)">X</button></td></tr>
                }
              </tbody>
            </table>
            <div style="font-weight:bold; margin-bottom:.5rem;">
              Paid: {{ paidTotal() | number:'1.2-2' }} | Balance: {{ balance() | number:'1.2-2' }}
            </div>
          }

          <div class="actions">
            <button class="btn-primary" (click)="saveSale()" [disabled]="balance() > 0.01">Save Sale</button>
            <button class="btn-secondary" (click)="showForm.set(false)">Cancel</button>
          </div>
        </div>
      }

      <table>
        <thead><tr><th>Sale No</th><th>Customer</th><th>Date</th><th>Items</th><th>Net Amount</th></tr></thead>
        <tbody>
          @for (s of sales(); track s.id) {
            <tr><td>{{ s.saleNo }}</td><td>{{ s.customer.name }}</td><td>{{ s.saleDate | date:'yyyy-MM-dd' }}</td>
            <td>{{ s.itemCount }}</td><td>{{ s.netAmount | number:'1.2-2' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [CRUD_STYLES]
})
export class SalesComponent implements OnInit {
  private readonly api = inject(ApiService);

  sales = signal<any[]>([]);
  customers = signal<any[]>([]);
  products = signal<any[]>([]);
  showForm = signal(false);
  items = signal<SaleItem[]>([]);
  payments = signal<PaymentLine[]>([]);

  sale = { customerId: 0, saleDate: new Date().toISOString().split('T')[0], subTotalDiscount: 0 };
  newItem: SaleItem = { productId: 0, productName: '', qty: 1, unitPrice: 0, discount: 0, lineTotal: 0 };
  newPay: PaymentLine = { paymentMethod: 'Cash', amount: 0, reference: '' };

  totalAmount = computed(() => this.items().reduce((s, i) => s + i.lineTotal, 0));
  netAmount = computed(() => this.totalAmount() - this.sale.subTotalDiscount);
  paidTotal = computed(() => this.payments().reduce((s, p) => s + p.amount, 0));
  balance = computed(() => this.netAmount() - this.paidTotal());

  async ngOnInit() {
    this.sales.set(await this.api.get('/api/sales'));
    this.customers.set(await this.api.get('/api/customers'));
    this.products.set(await this.api.get('/api/products'));
  }

  newSale() { this.showForm.set(true); this.items.set([]); this.payments.set([]); this.sale = { customerId: 0, saleDate: new Date().toISOString().split('T')[0], subTotalDiscount: 0 }; }

  onProductSelect(id: number) {
    const p = this.products().find(x => x.id === id);
    if (p) { this.newItem.unitPrice = p.price; this.newItem.productName = p.name; }
  }

  addItem() {
    if (!this.newItem.productId || this.newItem.qty <= 0) return;
    const lineTotal = (this.newItem.qty * this.newItem.unitPrice) - this.newItem.discount;
    this.items.update(arr => [...arr, { ...this.newItem, lineTotal }]);
    this.newItem = { productId: 0, productName: '', qty: 1, unitPrice: 0, discount: 0, lineTotal: 0 };
  }

  removeItem(i: number) { this.items.update(arr => arr.filter((_, idx) => idx !== i)); }

  addPayment() {
    if (this.newPay.amount <= 0) return;
    this.payments.update(arr => [...arr, { ...this.newPay }]);
    this.newPay = { paymentMethod: 'Cash', amount: 0, reference: '' };
  }

  removePayment(i: number) { this.payments.update(arr => arr.filter((_, idx) => idx !== i)); }

  async saveSale() {
    const body = {
      customerId: this.sale.customerId,
      saleDate: this.sale.saleDate,
      subTotalDiscount: this.sale.subTotalDiscount,
      items: this.items().map(i => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount })),
      payments: this.payments()
    };
    await this.api.post('/api/sales', body);
    this.showForm.set(false);
    this.sales.set(await this.api.get('/api/sales'));
  }
}
