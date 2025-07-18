// dashboard.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

// angular-calendar imports
import {
  CalendarModule,
  CalendarView,
  CalendarEvent,
  DateAdapter,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

interface Appointment {
  appointment_date: string;   // "YYYY-MM-DD"
  status: 'Approved'|'Pending'|'Rejected';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('appointmentsChart', { static: true })
  private chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  // for Chart.js:
  weeklyData: { week: string; total: number }[] = [];

  // for calendar:
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];

  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadChartData();
    this.loadAppointments();
  }

  private loadChartData() {
    this.http
      .get<{ success: boolean; data: { week: string; total: number }[] }>(
        `http://localhost:5000/api/appointments/weekly-summary-raw/22`
      )
      .subscribe(res => {
        if (!res.success) return;
        this.weeklyData = res.data;
        const labels = res.data.map(d => d.week);
        const totals = res.data.map(d => d.total);
        this.chart?.destroy();
        this.chart = new Chart(this.chartRef.nativeElement, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Appointments',
              data: totals,
              backgroundColor: 'rgba(98,0,238,0.7)',
              borderColor: 'rgba(98,0,238,1)',
              borderWidth: 1
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
      });
  }

  private loadAppointments() {
    this.http
      .get<{ success: boolean; data: Appointment[] }>(
        `http://localhost:5000/api/appointments/22`
      )
      .subscribe(res => {
        if (!res.success) return;
        this.events = res.data.map(a => ({
          start: new Date(a.appointment_date),
          title: a.status,
          cssClass: this.getStatusClass(a.status)
        }));
      });
  }

  private getStatusClass(status: Appointment['status']) {
    switch (status) {
      case 'Approved': return 'approved-event';
      case 'Pending':  return 'pending-event';
      case 'Rejected': return 'rejected-event';
      default:         return '';
    }
  }

  refresh() {
    this.loadChartData();
    this.loadAppointments();
  }

  // … your four stat getters (getTotalAppointments(), etc.) …
}
