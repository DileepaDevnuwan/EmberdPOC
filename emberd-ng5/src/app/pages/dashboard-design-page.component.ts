import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { BundleLoaderService } from '../bundle-loader.service';

@Component({
  selector: 'app-dashboard-design-page',
  templateUrl: './dashboard-design-page.component.html'
})
export class DashboardDesignPageComponent implements OnInit, OnDestroy {
  ready = false;
  id: string | null = null;
  dashboardMode: number | null = null;
  private sub: { unsubscribe(): void } | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private bundle: BundleLoaderService) {}

  ngOnInit(): void {
    this.bundle.load().then(api => {
      this.dashboardMode = api.mode.update;
      this.sub = this.route.paramMap.subscribe((params: ParamMap) => this.open(params.get('id')));
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  preview(id: string): void {
    this.router.navigate(['/dashboards', 'view', id || this.id]);
  }

  design(id: string): void {
    this.router.navigate(['/dashboards', 'design', id]);
  }

  back(): void {
    this.router.navigate(['/dashboards']);
  }

  private open(id: string | null): void {
    this.ready = false;
    this.id = id;
    setTimeout(() => { this.ready = true; });
  }
}
