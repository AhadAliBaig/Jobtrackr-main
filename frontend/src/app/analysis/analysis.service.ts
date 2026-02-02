import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalysisRequest {
  job_description: string;
  resume_text: string;
  use_ai: boolean;
}

export interface AnalysisResponse {
  match_score: number;
  missing_skills: string[];
  matched_skills: string[];
  summary: string;
  keyword_density: number;
  ai_suggestions: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private apiUrl = 'https://jobtrackr-vikn.onrender.com/ai/analyze';

  constructor(private http: HttpClient) {}

  analyzeResume(data: AnalysisRequest): Observable<AnalysisResponse> {
    return this.http.post<AnalysisResponse>(this.apiUrl, data);
  }
}