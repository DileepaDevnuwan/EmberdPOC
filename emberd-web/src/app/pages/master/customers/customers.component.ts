import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CRUD_STYLES } from '../users/users.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Customers</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ New Customer</button>
      </div>
      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editId() ? 'Edit' : 'Create' }} Customer</h3>
          <div class="form-row">
            <div class="field"><label>Code</label><input [(ngModel)]="form.code" /></div>
            <div class="field"><label>Name</label><input [(ngModel)]="form.name" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Phone</label><input [(ngModel)]="form.phone" /></div>
            <div class="field"><label>Email</label><input [(ngModel)]="form.email" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Address</label><input [(ngModel)]="form.address" /></div>
          </div>
          <div class="actions">
            <button class="btn-primary" (click)="save()">Save</button>
            <button class="btn-secondary" (click)="cancel()">Cancel</button>
          </div>
        </div>
      }
      <table>
        <thead><tr><th>Code</th><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead>
        <tbody>
          @for (c of items(); track c.id) {
            <tr><td>{{ c.code }}</td><td>{{ c.name }}</td><td>{{ c.phone }}</td><td>{{ c.email }}</td>
            <td><button class="btn-sm" (click)="edit(c)">Edit</button> <button class="btn-sm btn-danger" (click)="remove(c.id)">Delete</button></td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [CRUD_STYLES]
})
export class CustomersComponent implements OnInit {
  private readonly api = inject(ApiService);
  items = signal<any[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: any = { code: '', name: '', phone: '', email: '', address: '' };

  async ngOnInit() { await this.load(); }
  async load() { this.items.set(await this.api.get('/api/customers')); }
  edit(c: any) { this.editId.set(c.id); this.form = { ...c }; this.showForm.set(true); }
  async save() {
    if (this.editId()) await this.api.put(`/api/customers/${this.editId()}`, this.form);
    else await this.api.post('/api/customers', this.form);
    this.cancel(); await this.load();
  }
  async remove(id: number) { await this.api.delete(`/api/customers/${id}`); await this.load(); }
  cancel() { this.showForm.set(false); this.editId.set(null); this.form = { code: '', name: '', phone: '', email: '', address: '' }; }
}
