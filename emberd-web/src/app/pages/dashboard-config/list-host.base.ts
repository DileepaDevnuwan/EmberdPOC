import { HttpParams } from '@angular/common/http';
import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { TableAction } from '@osos/core/enums';
import type { TableEmitData } from '@osos/core/models';
import { Observable } from 'rxjs';
import type { EmbedPage } from '@osos-dashboard/ui/data-access';

/** Shared list-host logic: loads a page of rows from Dashboard.Web, search, paging, view and delete. */
export abstract class ListHostBase<T> {
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly destroyRef = inject(DestroyRef);

  readonly rows = signal<T[]>([]);
  readonly count = signal(0);
  readonly pageEvent = signal<PageEvent>({ pageIndex: 0, pageSize: 10, length: 0 });
  readonly userFilters = [];
  #search = '';

  protected abstract fetch(params: HttpParams): Observable<EmbedPage<T>>;
  protected abstract remove(id: string): Observable<unknown>;
  /** Text columns the host's search box looks in. */
  protected abstract readonly searchFields: string[];

  load(): void {
    const page = this.pageEvent();
    let params = new HttpParams().set('$top', page.pageSize).set('$skip', page.pageIndex * page.pageSize).set('$count', true);
    if (this.#search) {
      // Same OData shape the ERP list search sends: contains(tolower(field), 'text') or ...
      const text = this.#search.toLowerCase().replace(/'/g, "''");
      params = params.set('$filter', this.searchFields.map(f => `contains(tolower(${f}), '${text}')`).join(' or '));
    }
    this.fetch(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.rows.set(r.items ?? []);
          this.count.set(r.count ?? 0);
        },
        error: () => this.rows.set([]),
      });
  }

  search(text: string | undefined): void {
    this.#search = text ?? '';
    this.pageEvent.update(p => ({ ...p, pageIndex: 0 }));
    this.load();
  }

  /** The host's Add button: open the package's create page. */
  add(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  changePage(event: PageEvent): void {
    this.pageEvent.set(event);
    this.load();
  }

  handleUserEvents({ type, id }: TableEmitData): void {
    if (type === TableAction.View) {
      this.router.navigate([id], { relativeTo: this.route });
    } else if (type === TableAction.Delete && confirm('Delete this record?')) {
      this.remove(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    }
  }
}
