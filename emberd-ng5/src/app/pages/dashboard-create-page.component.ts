import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BundleLoaderService } from '../bundle-loader.service';

@Component({
  selector: 'app-dashboard-create-page',
  templateUrl: './dashboard-create-page.component.html'
})
export class DashboardCreatePageComponent implements OnInit {
  ready = false;

  constructor(private router: Router, private bundle: BundleLoaderService) {}

  ngOnInit(): void {
    this.bundle.load().then(() => { this.ready = true; });
  }

  design(id: string): void {
    this.router.navigate(['/dashboards', 'design', id]);
  }

  back(): void {
    this.router.navigate(['/dashboards']);
  }
}
