// dashboard.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import {
  CalendarModule,
  CalendarEvent,
  DateAdapter,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

interface WeeklyAppointmentData {
  week: string;
  total: number;
}

interface Appointment {
  appointment_date: string;              // "YYYY-MM-DD"
  status: 'Approved' | 'Pending' | 'Rejected';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('appointmentsChart', { static: true })
  private chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  // Chart data
  weeklyData: WeeklyAppointmentData[] = [];

  // Calendar data
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];

  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadChartData();
    this.loadAppointments();
  }

  /** Re-fetch both chart and calendar data */
  refresh(): void {
    this.loadChartData();
    this.loadAppointments();
  }

  /** Load weekly summary for Chart.js */
  private loadChartData(): void {
    this.http
      .get<{ success: boolean; data: WeeklyAppointmentData[] }>(
        'http://localhost:5000/api/appointments/weekly-summary-raw/22'
      )
      .subscribe(res => {
        if (!res.success || !res.data.length) {
          console.warn('No weekly summary data');
          return;
        }
        this.weeklyData = res.data;
        this.renderChart();
      });
  }

  /** Render or re-render the Chart.js bar chart */
  private renderChart(): void {
    const labels = this.weeklyData.map(d => d.week);
    const totals = this.weeklyData.map(d => d.total);

    this.chart?.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Appointments',
          data: totals,
          backgroundColor: 'rgba(98, 0, 238, 0.7)',
          borderColor:  'rgba(98, 0, 238, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  /** Load full appointments for the calendar */
  private loadAppointments(): void {
    this.http
      .get<{ success: boolean; data: Appointment[] }>(
        'http://localhost:5000/api/appointments/22'
      )
      .subscribe(res => {
        if (!res.success) {
          console.warn('No appointments data');
          return;
        }
        this.events = res.data.map(a => ({
          start: new Date(a.appointment_date),
          title: a.status,
          cssClass: this.getStatusClass(a.status)
        }));
      });
  }

  /** Map status to a CSS class for coloring */
  private getStatusClass(status: Appointment['status']): string {
    switch (status) {
      case 'Approved': return 'approved-event';
      case 'Pending':  return 'pending-event';
      case 'Rejected': return 'rejected-event';
      default:         return '';
    }
  }

  /** Quick‐stats helpers */
  getTotalAppointments(): number {
    return this.weeklyData.reduce((sum, d) => sum + d.total, 0);
  }

  getAveragePerWeek(): number {
    return this.weeklyData.length
      ? Math.round(this.getTotalAppointments() / this.weeklyData.length)
      : 0;
  }

  getPeakWeek(): string {
    if (!this.weeklyData.length) return '-';
    const peak = this.weeklyData.reduce((prev, curr) =>
      curr.total > prev.total ? curr : prev
    );
    return peak.week;
  }

  getGrowthTrend(): string {
    if (this.weeklyData.length < 2) return 'N/A';
    const first = this.weeklyData[0].total;
    const last  = this.weeklyData[this.weeklyData.length - 1].total;
    return last > first ? 'Upward' : last < first ? 'Downward' : 'Stable';
  }
}
