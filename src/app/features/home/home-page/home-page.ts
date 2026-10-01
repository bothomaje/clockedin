import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DashboardRow {
  company: string;
  role: string;
  chipLabel: string;
  chipClass: string;
  next: string;
  divider: boolean;
}

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  rows: DashboardRow[] = [
    {
      company: 'Acme',
      role: 'Marketing Coordinator',
      chipLabel: 'Offer Received',
      chipClass: 'clk-chip--success',
      next: 'Offer expires Oct 12',
      divider: true,
    },
    {
      company: 'Northstar',
      role: 'Software Engineer',
      chipLabel: 'Interview',
      chipClass: 'clk-chip--signal',
      next: 'Interview scheduled for Oct 8',
      divider: true,
    },
    {
      company: 'Liberty Studio',
      role: 'Graphic Designer',
      chipLabel: 'Applied',
      chipClass: '',
      next: 'Application under review',
      divider: true,
    },
  ];
}
