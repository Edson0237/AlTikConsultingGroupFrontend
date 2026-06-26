import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VisaColumn {
  id: string;
  label: string;
  color: string;
}

interface VisaApplication {
  id: number;
  initials: string;
  name: string;
  company: string;
  visaType: string;
  duration: string;
  entries: string;
  status: string;
}

@Component({
  selector: 'app-bussiness-visa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bussiness-visa.component.html',
  styleUrl: './bussiness-visa.component.scss'
})
export class BussinessVisaComponent {

  columns: VisaColumn[] = [
    { id: 'nouveau',  label: 'Nouveau',   color: '#0057E8' },
    { id: 'en-cours', label: 'En cours',  color: '#FF9500' },
    { id: 'approuve', label: 'Approuvé',  color: '#00C853' },
    { id: 'rejete',   label: 'Rejeté',    color: '#FF0019' },
  ];

  applications: VisaApplication[] = [
    { id: 1, initials: 'JM', name: 'Jean Mballa',   company: 'Camtel SA',        visaType: 'B-1',     duration: '6 mois', entries: 'Multiple', status: 'nouveau' },
    { id: 2, initials: 'AK', name: 'Aïcha Kana',     company: 'Bocom Industries', visaType: 'B-2',     duration: '3 mois', entries: 'Simple',   status: 'en-cours' },
    { id: 3, initials: 'PT', name: 'Paul Tchoumi',   company: 'Eneo Group',       visaType: 'B-1/B-2', duration: '1 an',   entries: 'Multiple', status: 'approuve' },
    { id: 4, initials: 'SN', name: 'Sarah Ngono',    company: 'MTN Cameroun',     visaType: 'B-1',     duration: '6 mois', entries: 'Simple',   status: 'rejete' },
  ];

  searchQuery = '';
  showFilters = false;
  selectedApp: VisaApplication | null = null;

  /** Used in the header subtitle: "{{ totalApplications }} en cours" */
  get totalApplications(): number {
    return this.applications.filter(app => app.status === 'en-cours').length;
  }

  toggleFilter(): void {
    this.showFilters = !this.showFilters;
  }

  onSearch(): void {
    // filteredApps() reads searchQuery live on every render,
    // so there's nothing extra to do here — hook left in place
    // in case debounced/server-side search is added later.
  }

  filteredApps(columnId: string): VisaApplication[] {
    const query = this.searchQuery.trim().toLowerCase();
    return this.applications.filter(app => {
      if (app.status !== columnId) return false;
      if (!query) return true;
      return (
        app.name.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query) ||
        app.visaType.toLowerCase().includes(query)
      );
    });
  }

  openDetail(app: VisaApplication): void {
    this.selectedApp = app;
  }

  closeDetail(): void {
    this.selectedApp = null;
  }

  changeStatus(app: VisaApplication, columnId: string): void {
    app.status = columnId;
  }

  addToColumn(columnId: string): void {
    this.newApplication(columnId);
  }

  newApplication(status: string = this.columns[0]?.id ?? 'nouveau'): void {
    const nextId = this.applications.length
      ? Math.max(...this.applications.map(a => a.id)) + 1
      : 1;

    const app: VisaApplication = {
      id: nextId,
      initials: 'NN',
      name: 'Nouvelle demande',
      company: '—',
      visaType: 'B-1',
      duration: '—',
      entries: '—',
      status,
    };

    this.applications.push(app);
    this.selectedApp = app; // open it straight into the detail modal for editing
  }
}