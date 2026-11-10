import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export const CRUD_STYLES = `
  .page { }
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
  h2 { margin:0; color:#1a1a2e; }
  .form-card { background:#fff; padding:1.5rem; border-radius:8px; margin-bottom:1rem; box-shadow:0 1px 4px rgba(0,0,0,.1); }
  .form-row { display:flex; gap:1rem; margin-bottom:.75rem; flex-wrap:wrap; }
  .field { flex:1; min-width:200px; }
  .field label { display:block; margin-bottom:4px; font-weight:500; font-size:13px; color:#555; }
  .field input, .field select { width:100%; padding:6px 10px; border:1px solid #d9d9d9; border-radius:4px; font-size:14px; box-sizing:border-box; }
  .checkbox { margin-right:1rem; font-size:14px; }
  .actions { display:flex; gap:.5rem; margin-top:.5rem; }
  table { width:100%; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.1); border-collapse:collapse; }
  th { background:#fafafa; padding:10px 12px; text-align:left; font-size:13px; color:#666; border-bottom:1px solid #eee; }
  td { padding:8px 12px; font-size:14px; border-bottom:1px solid #f0f0f0; }
  .btn-primary { background:#1890ff; color:#fff; border:none; padding:6px 16px; border-radius:4px; cursor:pointer; font-size:14px; }
  .btn-secondary { background:#f0f0f0; color:#333; border:none; padding:6px 16px; border-radius:4px; cursor:pointer; font-size:14px; }
  .btn-sm { padding:3px 10px; font-size:12px; border:1px solid #d9d9d9; background:#fff; border-radius:3px; cursor:pointer; }
  .btn-danger { color:#ff4d4f; border-color:#ff4d4f; }
  h3 { margin:0 0 1rem; }
  h4 { margin:0 0 .5rem; width:100%; }
`;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Users</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ New User</button>
      </div>

      @if (showForm()) {
        <div class="form-card">
          <h3>{{ editId() ? 'Edit' : 'Create' }} User</h3>
          <div class="form-row">
            <div class="field"><label>Username</label><input [(ngModel)]="form.username" [disabled]="!!editId()" /></div>
            <div class="field"><label>Full Name</label><input [(ngModel)]="form.fullName" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Email</label><input [(ngModel)]="form.email" /></div>
            <div class="field"><label>Password</label><input [(ngModel)]="form.password" type="password" /></div>
          </div>
          <div class="form-row">
            <h4>Assign Roles</h4>
            @for (role of roles(); track role.id) {
              <label class="checkbox"><input type="checkbox" [checked]="selectedRoles().includes(role.id)" (change)="toggleRole(role.id)" /> {{ role.name }}</label>
            }
          </div>
          <div class="actions">
            <button class="btn-primary" (click)="save()">Save</button>
            <button class="btn-secondary" (click)="cancel()">Cancel</button>
          </div>
        </div>
      }

      <table>
        <thead><tr><th>Username</th><th>Full Name</th><th>Email</th><th>Roles</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.username }}</td><td>{{ u.fullName }}</td><td>{{ u.email }}</td>
              <td>{{ u.roles.join(', ') }}</td><td>{{ u.isActive ? 'Yes' : 'No' }}</td>
              <td><button class="btn-sm" (click)="edit(u)">Edit</button> <button class="btn-sm btn-danger" (click)="remove(u.id)">Delete</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [CRUD_STYLES]
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);
  selectedRoles = signal<number[]>([]);
  form: any = { username: '', fullName: '', email: '', password: '' };

  async ngOnInit() { await this.load(); this.roles.set(await this.api.get('/api/roles')); }

  async load() { this.users.set(await this.api.get('/api/users')); }

  edit(u: any) {
    this.editId.set(u.id);
    this.form = { username: u.username, fullName: u.fullName, email: u.email, password: '', isActive: u.isActive };
    this.selectedRoles.set([]); // would need role ids
    this.showForm.set(true);
  }

  toggleRole(id: number) {
    const cur = this.selectedRoles();
    this.selectedRoles.set(cur.includes(id) ? cur.filter(r => r !== id) : [...cur, id]);
  }

  async save() {
    if (this.editId()) {
      await this.api.put(`/api/users/${this.editId()}`, { ...this.form, isActive: this.form.isActive ?? true });
      if (this.selectedRoles().length) await this.api.post(`/api/users/${this.editId()}/roles`, { roleIds: this.selectedRoles() });
    } else {
      const created: any = await this.api.post('/api/users', this.form);
      if (created?.id && this.selectedRoles().length) await this.api.post(`/api/users/${created.id}/roles`, { roleIds: this.selectedRoles() });
    }
    this.cancel();
    await this.load();
  }

  async remove(id: number) { await this.api.delete(`/api/users/${id}`); await this.load(); }

  cancel() { this.showForm.set(false); this.editId.set(null); this.form = { username: '', fullName: '', email: '', password: '' }; this.selectedRoles.set([]); }
}
