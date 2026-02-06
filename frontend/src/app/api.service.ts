import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, BehaviorSubject, tap, map, throwError, switchMap } from 'rxjs';

export interface ResumeResource {
  id: number;
  title: string;
  company: string; 
  thumbnailUrl: string;
  pdfUrl: string; 
}

export interface User {
  id?: number;  // User ID from backend
  name: string;
  email: string;
  password?: string; 
  initials: string;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  status: string;
  notes?: string;
  jobDescription?: string;
  aiAnalysis?: string;
  deadline?: string;
}

export interface GuideResource {
  id: number;
  title: string;
  description: string;
  theme: 'pink' | 'purple' | 'blue' | 'cyan' | 'orange' | 'red'; 
  iconPath: string;
  linkUrl: string; 
}

const BACKEND_URL = 'https://jobtrackr-vikn.onrender.com';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private mockResources: ResumeResource[] = [
    {
      id: 1,
      title: 'Project Management Intern',
      company: 'Google',
      // Official Google "G" Logo
      thumbnailUrl: '/assets/google.png', 
      pdfUrl: '/assets/resumes/google-resume.png' 
    },
    {
      id: 2,
      title: 'Software Engineering Intern',
      company: 'KPMG',
      // KPMG Logo
      thumbnailUrl: '/assets/kpmg.png',
      pdfUrl: '/assets/resumes/kpmg-resume.png'
    },
    {
      id: 3,
      title: 'Data Analyst Intern',
      company: 'Deloitte',
      // Deloitte Logo
      thumbnailUrl: '/assets/deloitte.png',
      pdfUrl: '/assets/resumes/deloitte-resume.png'
    },
    {
      id: 4,
      title: 'Frontend Developer Intern',
      company: 'Microsoft',
      // Microsoft Square Logo
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
      pdfUrl: '/assets/resumes/Microsoft-resume.png'
    },
    {
      id: 5,
      title: 'UX Design Intern',
      company: 'Airbnb',
      // Airbnb Logo
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg',
      pdfUrl: '/assets/resumes/airbnb-resume.png'
    },
    {
      id: 6,
      title: 'Cybersecurity Intern',
      company: 'PwC',
      // PwC Logo
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PricewaterhouseCoopers_Logo.svg/1200px-PricewaterhouseCoopers_Logo.svg.png',
      pdfUrl: '/assets/resumes/PWC-resume.png'
    }
  ];

  // Sample job data for new users
  private getSampleJobData() {
    return {
      company: 'Sample Company',
      title: 'Sample Job Application',
      status: 'Applied',
      notes: 'This is a sample job. Edit or delete it to start tracking your own applications!',
      jobDescription: 'This is a sample job description. Click edit to see how it works, or delete it to start fresh with your own job applications.',
      aiAnalysis: null,
      deadline: null
    };
  }

  // Sample resume data for new users
  private getSampleResumeData(): string {
    return `JOHN DOE
Software Engineer
Email: john.doe@email.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 3+ years of expertise in full-stack development. 
Proficient in JavaScript, TypeScript, React, Node.js, and PostgreSQL. Passionate about 
building scalable web applications and solving complex technical challenges.

TECHNICAL SKILLS
• Programming Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Angular, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express.js, RESTful APIs
• Databases: PostgreSQL, MongoDB, MySQL
• Tools: Git, Docker, AWS, CI/CD

PROFESSIONAL EXPERIENCE

Software Engineer | Tech Company Inc. | 2021 - Present
• Developed and maintained full-stack web applications using React and Node.js
• Collaborated with cross-functional teams to deliver high-quality software solutions
• Implemented RESTful APIs handling 10,000+ requests per day
• Reduced application load time by 40% through performance optimization

Junior Developer | StartupXYZ | 2020 - 2021
• Built responsive web interfaces using React and TypeScript
• Participated in agile development processes and code reviews
• Fixed critical bugs and improved application stability

EDUCATION
Bachelor of Science in Computer Science
University Name | 2016 - 2020
GPA: 3.8/4.0

PROJECTS
• JobTrackr - Full-stack job application tracker (React, Node.js, PostgreSQL)
• E-commerce Platform - Built scalable shopping cart system
• Task Management App - Real-time collaboration tool

---
This is a sample resume. Replace it with your own information!`;
  }

  private mockJobList: Job[] = [];
  private nextJobId = 1;
  public jobs$: BehaviorSubject<Job[]>;

  // --- RESUME DATA ---
  private mockMasterResume = 'Paste your resume here...';
  private resume$: BehaviorSubject<string>;

  // --- NEW: USER DATA ---
  // We start with null (no user logged in)
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private mockGuides: GuideResource[] = [
    {
      id: 1,
      title: 'Resume Guide',
      description: 'Learn how to create a resume that gets past applicant tracking systems.',
      theme: 'pink',
      iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
      linkUrl: 'https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/'
    },
    {
      id: 2,
      title: 'Cover Letter Guide',
      description: 'Master the art of writing cover letters that tell your story.',
      theme: 'purple',
      iconPath: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
      linkUrl: 'https://www.uc.edu/news/articles/2024/11/standout-cover-letter-guide.html' 
    },
    {
      id: 3,
      title: 'Interview Guide',
      description: 'Prepare for behavioral and technical interviews with proven strategies.',
      theme: 'blue',
      iconPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z',
      linkUrl: 'https://studentlife.utoronto.ca/wp-content/uploads/Interview-Strategies-Guide.pdf'
    },
    {
      id: 4,
      title: 'LinkedIn Guide',
      description: 'Optimize your profile, build your network, and attract recruiters.',
      theme: 'cyan',
      iconPath: 'M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      linkUrl: 'https://www.linkedin.com/business/sales/blog/profile-best-practices/17-steps-to-a-better-linkedin-profile-in-2017'
    },
    {
      id: 5,
      title: 'Cold Email Guide',
      description: 'Learn templates and tactics for reaching out to hiring managers.',
      theme: 'orange',
      iconPath: 'M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5',
      linkUrl: 'https://carly.substack.com/p/how-to-write-a-cold-email'
    },
    {
      id: 6,
      title: 'Portfolio Guide',
      description: 'Showcase your work effectively to demonstrate your skills.',
      theme: 'red',
      iconPath: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
      linkUrl: 'https://www.wix.com/blog/how-to-make-online-design-portfolio-guide?experiment_id=%5E%5E119cefc7-5e4d-4e47-949f-b91a1674bc1c%5E'
    }
  ];
  
  constructor(private http: HttpClient) {
    // 1. Initialize jobs$ with empty array (backend will populate it)
    this.mockJobList = [];
    this.nextJobId = 1;
    this.jobs$ = new BehaviorSubject<Job[]>([]);  // Start empty!
  
    // 2. Load Resume (keep this - still uses localStorage as backup)
    const savedResume = localStorage.getItem('markhor_resume');
    if (savedResume) {
      this.mockMasterResume = savedResume;
    }
    this.resume$ = new BehaviorSubject<string>(this.mockMasterResume);
  
    // 3. Load User
    const savedUser = localStorage.getItem('markhor_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Validate user object has required fields
        if (user && user.id) {
          this.currentUserSubject.next(user);
        } else {
          console.warn('[ApiService] Invalid user object in localStorage, clearing it');
          localStorage.removeItem('markhor_user');
        }
      } catch (error) {
        console.error('[ApiService] Failed to parse user from localStorage:', error);
        localStorage.removeItem('markhor_user');
      }
    }
  }

  getGuides(): Observable<GuideResource[]> {
    return of(this.mockGuides).pipe(delay(200)); // Simulate fast network call
  }

  private saveState() {
    localStorage.setItem('markhor_jobs', JSON.stringify(this.mockJobList));
    localStorage.setItem('markhor_resume', this.mockMasterResume);
  }

  // --- AUTH METHODS ---

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<{success: boolean, token: string, user: User}>(
      `${BACKEND_URL}/api/auth/login`,
      { email, password }
    ).pipe(
      tap(response => {
        // Ensure user object has id before storing
        if (!response.user || !response.user.id) {
          console.error('[Login] User object missing id:', response.user);
          throw new Error('Invalid user data received from server');
        }
        // Store JWT token for authentication
        localStorage.setItem('markhor_token', response.token);
        this.currentUserSubject.next(response.user);
        localStorage.setItem('markhor_user', JSON.stringify(response.user));
      }),
      map(() => true)
    );
  }

  register(name: string, email: string, password: string): Observable<boolean> {
    return this.http.post<{success: boolean, token: string, user: User}>(
      `${BACKEND_URL}/api/auth/register`,
      { name, email, password }
    ).pipe(
      tap(response => {
        // Ensure user object has id before storing
        if (!response.user || !response.user.id) {
          console.error('[Register] User object missing id:', response.user);
          throw new Error('Invalid user data received from server');
        }
        // Store JWT token for authentication
        localStorage.setItem('markhor_token', response.token);
        this.currentUserSubject.next(response.user);
        localStorage.setItem('markhor_user', JSON.stringify(response.user));
      }),
      map(() => true)
    );
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('markhor_token');  // Clear JWT token
    localStorage.removeItem('markhor_user');
    localStorage.removeItem('markhor_jobs');  // Clear old jobs from localStorage
    // Reset to empty
    this.mockJobList = [];
    this.jobs$.next([]);
  }

  forgotPassword(email: string): Observable<{success: boolean, message: string, resetLink?: string}> {
    return this.http.post<{success: boolean, message: string, resetLink?: string}>(
      `${BACKEND_URL}/api/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(
      `${BACKEND_URL}/api/auth/reset-password`,
      { token, newPassword }
    );
  }

  // --- HELPER: Map backend snake_case to frontend camelCase ---
  private mapJobFromBackend(job: any): Job {
    return {
      id: job.id,
      company: job.company,
      title: job.title,
      status: job.status,
      notes: job.notes,
      jobDescription: job.job_description || job.jobDescription,
      aiAnalysis: job.ai_analysis || job.aiAnalysis,
      deadline: job.deadline
    };
  }

  private mapJobsFromBackend(jobs: any[]): Job[] {
    return jobs.map(job => this.mapJobFromBackend(job));
  }

  // --- EXISTING METHODS (Unchanged) ---

  checkHealth(): Observable<any> {
    return this.http.get<any>(`${BACKEND_URL}/`);
  }

  getJobs():  Observable<Job[]> {
    return this.http.get<any[]>(`${BACKEND_URL}/api/jobs`).pipe(
      map(jobs => this.mapJobsFromBackend(jobs)),
      // Auto-create sample job if user has no jobs
      switchMap(jobs => {
        if (jobs.length === 0) {
          // Create sample job in backend (so it syncs across devices)
          return this.createJob(this.getSampleJobData()).pipe(
            map(sampleJob => [sampleJob])
          );
        }
        return of(jobs);
      }),
      tap(jobs => {
        // Update local state with real data from backend
        this.mockJobList = jobs;
        this.jobs$.next(jobs);
      })
    );
  }

  createJob(jobData: any): Observable<Job> {
    return this.http.post<any>(`${BACKEND_URL}/api/jobs`, jobData).pipe(
      map(job => this.mapJobFromBackend(job)),
      tap(newJob => {
        // Update local state with job returned from backend
        this.mockJobList.push(newJob);
        this.jobs$.next([...this.mockJobList]);
      })
    );
  }

  getResume(): Observable<string> {
    return this.http.get<string>(`${BACKEND_URL}/api/resume`).pipe(
      // Auto-create sample resume if user has no resume
      switchMap(resumeText => {
        if (!resumeText || resumeText.trim() === '') {
          // Create sample resume in backend (so it syncs across devices)
          return this.saveResume(this.getSampleResumeData()).pipe(
            map(() => this.getSampleResumeData())
          );
        }
        return of(resumeText);
      }),
      tap(resumeText => {
        this.mockMasterResume = resumeText;
        this.resume$.next(resumeText);
      })
    );
  }

  saveResume(resumeText: string): Observable<{success: boolean, message: string}> {
    return this.http.post<{success: boolean, message: string}>(
      `${BACKEND_URL}/api/resume`,
      { resumeText }
    ).pipe(
      tap(() => {
        this.mockMasterResume = resumeText;
        this.resume$.next(resumeText);
      })
    );
  }

  deleteJob(id: number): Observable<boolean> {
    return this.http.delete(`${BACKEND_URL}/api/jobs/${id}`).pipe(
      tap(() => {
        const index = this.mockJobList.findIndex(j => j.id === id);
        if (index !== -1) {
          this.mockJobList.splice(index, 1);
          this.jobs$.next([...this.mockJobList]);
        }
      }),
      map(() => true)
    );
  }

  getJob(id: number): Observable<Job | undefined> {
    return this.http.get<any>(`${BACKEND_URL}/api/jobs/${id}`).pipe(
      map(job => job ? this.mapJobFromBackend(job) : undefined)
    );
  }

  updateJob(id: number, updatedData: any): Observable<Job | null> {
    return this.http.put<any>(`${BACKEND_URL}/api/jobs/${id}`, updatedData).pipe(
      map(job => job ? this.mapJobFromBackend(job) : null),
      tap(updatedJob => {
        if (updatedJob) {
          const index = this.mockJobList.findIndex(j => j.id === id);
          if (index !== -1) {
            this.mockJobList[index] = updatedJob;
            this.jobs$.next([...this.mockJobList]);
          }
        }
      })
    );
  }

  getJobStats(): Observable<any> {
    return this.jobs$.pipe(
      map(jobs => {
        return {
          total: jobs.length,
          toApply: jobs.filter(j => j.status === 'To Apply').length,
          applied: jobs.filter(j => j.status === 'Applied').length,
          interviewing: jobs.filter(j => j.status === 'Interviewing').length,
          offers: jobs.filter(j => j.status === 'Offer').length
        };
      })
    );
  }

  generateCoverLetter(jobDescription: string): Observable<{ coverLetter: string }> {
    return this.http.post<{ coverLetter: string }>(
      `${BACKEND_URL}/ai/cover-letter`,
      { jobDescription }
    );
  }
  // Resources (Mock)
  getResources(): Observable<ResumeResource[]> {
    return of(this.mockResources).pipe(delay(300));
  }
}