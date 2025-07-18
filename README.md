import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

interface WeeklyAppointmentData {
  week: string;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: WeeklyAppointmentData[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // make sure you have CommonModule if needed for *ngIf, etc.
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('appointmentsChart', { static: true })
  private chartRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  // → holds the latest raw data
  weeklyData: WeeklyAppointmentData[] = [];

  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.loadChart();
  }

  refresh() {
    this.loadChart();
  }

  private loadChart() {
    const url = `http://localhost:5000/api/appointments/weekly-summary-raw/22`;
    this.http.get<ApiResponse>(url).subscribe(res => {
      if (!res.success || !res.data.length) {
        console.warn('No data for chart');
        return;
      }

      // store for stats
      this.weeklyData = res.data;

      const labels = res.data.map(d => d.week);
      const totals = res.data.map(d => d.total);

      // destroy previous instance
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
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    });
  }

  // → total of all appointments
  getTotalAppointments(): number {
    return this.weeklyData
      .reduce((sum, d) => sum + d.total, 0);
  }

  // → average per week, rounded
  getAveragePerWeek(): number {
    if (!this.weeklyData.length) return 0;
    return Math.round(
      this.getTotalAppointments() / this.weeklyData.length
    );
  }

  // → the week label with the highest total
  getPeakWeek(): string {
    if (!this.weeklyData.length) return '-';
    const peak = this.weeklyData
      .reduce((prev, curr) => curr.total > prev.total ? curr : prev);
    return peak.week;
  }

  // → simple trend: compare first vs. last week
  getGrowthTrend(): string {
    if (this.weeklyData.length < 2) return 'N/A';
    const first = this.weeklyData[0].total;
    const last  = this.weeklyData[this.weeklyData.length - 1].total;
    if (last > first) return 'Upward';
    if (last < first) return 'Downward';
    return 'Stable';
  }
}
