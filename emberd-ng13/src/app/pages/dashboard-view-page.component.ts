import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BundleLoaderService } from '../bundle-loader.service';

@Component({
  selector: 'app-dashboard-view-page',
  templateUrl: './dashboard-view-page.component.html'
})
export class DashboardViewPageComponent implements OnInit {
  ready = false;
  id: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private bundle: BundleLoaderService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.bundle.load().then(() => { this.ready = true; });
  }

  back(): void {
    this.router.navigate(['/dashboards']);
  }
}
