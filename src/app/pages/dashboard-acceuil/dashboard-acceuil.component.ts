import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-acceuil',
  imports: [SidebarComponent, CommonModule,HeaderComponent, RouterOutlet],
  templateUrl: './dashboard-acceuil.component.html',
  styleUrl: './dashboard-acceuil.component.scss',
})
export class DashboardAcceuilComponent { }


