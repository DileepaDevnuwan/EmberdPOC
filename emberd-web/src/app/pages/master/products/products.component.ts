import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CRUD_STYLES } from '../users/users.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="header">
        <h2>Products</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ New Product</button>
      </div>
      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editId() ? 'Edit' : 'Create' }} Product</h3>
          <div class="form-row">
            <div class="field"><label>Code</label><input [(ngModel)]="form.code" /></div>
            <div class="field"><label>Name</label><input [(ngModel)]="form.name" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Price</label><input [(ngModel)]="form.price" type="number" /></div>
            <div class="field"><label>Active</label><select [(ngModel)]="form.isActive"><option [ngValue]="true">Yes</option><option [ngValue]="false">No</option></select></div>
          </div>
          <div class="actions">
            <button class="btn-primary" (click)="save()">Save</button>
            <button class="btn-secondary" (click)="cancel()">Cancel</button>
          </div>
        </div>
      }
      <table>
        <thead><tr><th>Code</th><th>Name</th><th>Price</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          @for (p of items(); track p.id) {
            <tr><td>{{ p.code }}</td><td>{{ p.name }}</td><td>{{ p.price | number:'1.2-2' }}</td><td>{{ p.isActive ? 'Yes' : 'No' }}</td>
            <td><button class="btn-sm" (click)="edit(p)">Edit</button> <button class="btn-sm btn-danger" (click)="remove(p.id)">Delete</button></td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [CRUD_STYLES]
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  items = signal<any[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: any = { code: '', name: '', price: 0, isActive: true };

  async ngOnInit() { await this.load(); }
  async load() { this.items.set(await this.api.get('/api/products')); }
  edit(p: any) { this.editId.set(p.id); this.form = { ...p }; this.showForm.set(true); }
  async save() {
    if (this.editId()) await this.api.put(`/api/products/${this.editId()}`, this.form);
    else await this.api.post('/api/products', this.form);
    this.cancel(); await this.load();
  }
  async remove(id: number) { await this.api.delete(`/api/products/${id}`); await this.load(); }
  cancel() { this.showForm.set(false); this.editId.set(null); this.form = { code: '', name: '', price: 0, isActive: true }; }
}
