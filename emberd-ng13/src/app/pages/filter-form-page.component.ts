import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BundleLoaderService } from '../bundle-loader.service';
import { saveFailedMessage } from './save-failed';

@Component({
  selector: 'app-filter-form-page',
  templateUrl: './filter-form-page.component.html'
})
export class FilterFormPageComponent implements OnInit {
  ready = false;
  id: string | null = null;
  mode = 'create';
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private bundle: BundleLoaderService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.mode = this.id ? 'edit' : 'create';
    this.bundle.load().then(() => { this.ready = true; });
  }

  onFailed(error: any): void {
    this.error = saveFailedMessage(error);
  }

  back(): void {
    this.router.navigate(['/filters']);
  }
}
