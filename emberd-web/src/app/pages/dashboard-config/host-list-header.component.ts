import { Component, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/** The product's own list header: its title, search box and Add button, in its own look. */
@Component({
  selector: 'app-host-list-header',
  imports: [ReactiveFormsModule],
  template: `
    <div class="host-header">
      <h2>{{ title() }}</h2>
      <div class="tools">
        <input type="search" placeholder="Search..." [formControl]="searchControl" />
        @if (addLabel()) {
          <button type="button" (click)="add.emit()">+ {{ addLabel() }}</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .host-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; background:#fff; border-radius:8px; padding:12px 16px; margin-bottom:12px; }
    h2 { margin:0; font-size:18px; color:#1a1a2e; }
    .tools { display:flex; gap:8px; }
    input { padding:6px 10px; border:1px solid #ccd; border-radius:6px; min-width:220px; }
    button { background:#0f3460; color:#fff; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; }
  `],
})
export class HostListHeaderComponent {
  readonly title = input.required<string>();
  readonly addLabel = input<string>('');
  readonly searchChange = output<string>();
  readonly add = output<void>();

  readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(text => this.searchChange.emit(text.trim()));
  }
}
