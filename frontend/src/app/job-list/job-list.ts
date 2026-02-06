import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Job } from '../api.service'; 
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, catchError, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-list.html',
  styleUrls: ['./job-list.scss']
})
export class JobListComponent implements OnInit {
  
  public filteredJobs$: Observable<Job[]>;
  public visibleAnalysisId: number | null = null;

  // Filters
  public searchTerm$ = new BehaviorSubject<string>('');
  public statusFilter$ = new BehaviorSubject<string>('All');

  constructor(private apiService: ApiService, private router: Router) {
    
    this.filteredJobs$ = combineLatest([
      this.apiService.getJobs().pipe(startWith([])), // Ensure it starts with empty array if API is slow
      this.searchTerm$,
      this.statusFilter$
    ]).pipe(
      // Debugging: Log the data coming in
      
      map(([jobs, searchTerm, status]) => {
        // 1. Safety Check: Ensure jobs is an array
        if (!jobs || !Array.isArray(jobs)) return [];

        let filtered = jobs;

        // 2. Filter by Status
        if (status && status !== 'All') {
          filtered = filtered.filter(j => j.status === status);
        }

        // 3. Filter by Search Term
        if (searchTerm && searchTerm.trim() !== '') {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(j => 
            (j.company && j.company.toLowerCase().includes(lowerTerm)) || 
            (j.title && j.title.toLowerCase().includes(lowerTerm))
          );
        }

        return filtered;
      }),
      // Error Handling: If something breaks, return empty array so app doesn't crash
      catchError(err => {
        console.error('Error in Job Filter:', err);
        return [];
      })
    );
  }

  ngOnInit(): void { }

  // --- Filters ---
  onSearchChange(term: string) {
    this.searchTerm$.next(term);
  }

  onStatusChange(status: string) {
    this.statusFilter$.next(status);
  }

  // --- Actions ---
  toggleAnalysis(jobId: number) {
    this.visibleAnalysisId = (this.visibleAnalysisId === jobId) ? null : jobId;
  }

  onEdit(jobId: number) {
    this.router.navigate(['/edit-job', jobId]);
  }

  onDelete(jobId: number) {
    if(confirm('Are you sure you want to delete this application?')) {
      this.apiService.deleteJob(jobId).subscribe();
    }
  }

  onAnalyzeJob(job: Job) {
    this.router.navigate(['/analysis'], { 
      state: { jobDescription: job.jobDescription } 
    });
  }
}