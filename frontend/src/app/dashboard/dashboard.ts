import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service'; 
import { CommonModule } from '@angular/common'; 
import { JobListComponent } from '../job-list/job-list'; 
import { Observable } from 'rxjs'; // <-- Import Observable

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    JobListComponent 
  ], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  
  healthStatus: string = 'Checking...';
  stats$: Observable<any> | undefined; // <-- NEW: Observable for stats
  
  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // 1. Load jobs from backend first (this populates jobs$)
    this.apiService.getJobs().subscribe();

    // 2. Load Stats (reads from jobs$ observable)
    this.stats$ = this.apiService.getJobStats();

    // 3. Check Health
    this.apiService.checkHealth().subscribe({
      next: (response: any) => {
        this.healthStatus = `Online`;
      },
      error: (err: any) => {
        this.healthStatus = `Offline`;
      }
    });
  }
}