import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CRUD_STYLES } from '../users/users.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Roles</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ New Role</button>
      </div>
      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editId() ? 'Edit' : 'Create' }} Role</h3>
          <div class="form-row">
            <div class="field"><label>Name</label><input [(ngModel)]="form.name" /></div>
            <div class="field"><label>Description</label><input [(ngModel)]="form.description" /></div>
          </div>
          <div class="actions">
            <button class="btn-primary" (click)="save()">Save</button>
            <button class="btn-secondary" (click)="cancel()">Cancel</button>
          </div>
        </div>
      }
      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
        <tbody>
          @for (r of items(); track r.id) {
            <tr><td>{{ r.name }}</td><td>{{ r.description }}</td>
            <td><button class="btn-sm" (click)="edit(r)">Edit</button> <button class="btn-sm btn-danger" (click)="remove(r.id)">Delete</button></td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [CRUD_STYLES]
})
export class RolesComponent implements OnInit {
  private readonly api = inject(ApiService);
  items = signal<any[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);
  form: any = { name: '', description: '' };

  async ngOnInit() { await this.load(); }
  async load() { this.items.set(await this.api.get('/api/roles')); }
  edit(r: any) { this.editId.set(r.id); this.form = { ...r }; this.showForm.set(true); }
  async save() {
    if (this.editId()) await this.api.put(`/api/roles/${this.editId()}`, this.form);
    else await this.api.post('/api/roles', this.form);
    this.cancel(); await this.load();
  }
  async remove(id: number) { await this.api.delete(`/api/roles/${id}`); await this.load(); }
  cancel() { this.showForm.set(false); this.editId.set(null); this.form = { name: '', description: '' }; }
}
