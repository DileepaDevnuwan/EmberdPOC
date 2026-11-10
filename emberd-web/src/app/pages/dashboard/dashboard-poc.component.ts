import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-poc',
  standalone: true,
  template: `
    <div class="page">
      <h2>Dashboard (npm Package Integration)</h2>
      <div class="info-card">
        <p><strong>This page will integrate the <code>&#64;osos-dashboard/ui</code> npm package.</strong></p>
        <p>To use the dashboard components:</p>
        <ol>
          <li>Install: <code>npm install &#64;osos-dashboard/ui</code> from Nexus registry</li>
          <li>Import the dashboard modules (DashboardBuilderPage, DashboardViewerPage)</li>
          <li>Provide a <code>DashboardPageHost</code> implementation that connects to the backend API</li>
          <li>The components are input/output only — all API calls go through the host interface</li>
        </ol>
        <p>Configuration: <code>external: true</code> shows Data Connectors, hides OwnDataset.<br/>
           ERP sets <code>external: false</code>.</p>
        <div class="note">
          <strong>POC Proof:</strong> This same npm package works with .NET, PHP, or Java backends.
          Only the host implementation changes — the dashboard UI stays the same.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page h2 { color:#1a1a2e; margin-bottom:1rem; }
    .info-card { background:#fff; padding:1.5rem; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,.1); max-width:700px; }
    .info-card p { margin:0 0 .75rem; line-height:1.6; }
    .info-card ol { margin:0 0 1rem; padding-left:1.5rem; }
    .info-card li { margin-bottom:.5rem; }
    code { background:#f0f2f5; padding:2px 6px; border-radius:3px; font-size:13px; }
    .note { background:#e6f7ff; border-left:3px solid #1890ff; padding:.75rem 1rem; border-radius:4px; margin-top:1rem; }
  `]
})
export class DashboardPocComponent {}
