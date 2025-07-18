import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

// Angular Material calendar
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface WeeklyAppointmentData { /*…as before…*/ }
interface Appointment {
  id: number;
  player_id: number;
  health_officer_id: string;
  appointment_date: string;    // "YYYY-MM-DD"
  appointment_time: string;    // "HH:mm:ss"
  reason: string;
  action: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    /* plus any other modules you need (FormsModule, etc.) */
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('appointmentsChart', { static: true })
  private chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  weeklyData: WeeklyAppointmentData[] = [];
  appointments: Appointment[] = [];
  private statusMap = new Map<string, Appointment['status']>();

  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadChart();
    this.loadAppointments();
  }

  /** your existing chart loader… */
  private loadChart() { /*…*/ }

  /** new: load raw appointments for the calendar */
  private loadAppointments() {
    const url = `http://localhost:5000/api/appointments/22`;
    this.http.get<{ success: boolean; data: Appointment[] }>(url)
      .subscribe(res => {
        if (!res.success) return;
        this.appointments = res.data;
        this.statusMap.clear();
        for (const a of this.appointments) {
          this.statusMap.set(a.appointment_date, a.status);
        }
      });
  }

  /** tells <mat-calendar> which CSS class to apply on each date cell */
  dateClass = (d: Date) => {
    const iso = d.toISOString().slice(0,10);      // "YYYY-MM-DD"
    const status = this.statusMap.get(iso);
    return status ? status.toLowerCase() + '-date' : '';
  }

  /** your stats getters… */
  getTotalAppointments(): number { /*…*/ }
  getAveragePerWeek(): number        { /*…*/ }
  getPeakWeek(): string             { /*…*/ }
  getGrowthTrend(): string          { /*…*/ }
}
