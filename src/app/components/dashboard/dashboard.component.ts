import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventModel } from '../../models/event';
import { EventService } from '../../services/event/event.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state/state.service';
import { EventsByDate } from '../../models/eventsByDate';
import { EventUpdateService } from '../../services/event/event-update.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EventCardComponent,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  events: EventModel[] = [];
  eventsByDate: EventsByDate[] = [];
  private eventUpdateSubscription: Subscription = new Subscription();

  constructor(
    private eventService: EventService,
    private stateService: StateService,
    private eventUpdateService: EventUpdateService
  ) {}

  ngOnInit(): void {
    this.getAllEvents();
    this.subscribeToEventUpdates();
  }

  ngOnDestroy(): void {
    this.eventUpdateSubscription.unsubscribe();
  }

  subscribeToEventUpdates(): void {
    this.eventUpdateSubscription = this.eventUpdateService.eventUpdated$.subscribe((eventId) => {
      // console.log('Event updated, refreshing dashboard...', eventId ? `Event ID: ${eventId}` : 'All events');
      this.refreshEvents();
    });
  }

  refreshEvents(): void {
    // Não mostrar loading durante refresh para melhor UX
    this.getAllEventsWithoutLoading();
  }

  getAllEventsWithoutLoading(): void {
    this.eventService.getAllEvents().subscribe({
      next: (response) => {
        this.events = response.data;
        this.groupEventsByDate();
      },
      error: (error) => {
        console.error('Error fetching events:', error);
      }
    });
  }

  getAllEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (response) => {
        this.events = response.data;
        this.groupEventsByDate();
      },
      complete: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.loading = false;
      }
    });
  }

  groupEventsByDate(): void {
    const grouped = this.events.reduce((acc, event) => {
      const date = event.data;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as { [key: string]: EventModel[] });

    this.eventsByDate = Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date,
        displayDate: this.formatDateForDisplay(date),
        events: grouped[date].sort((a, b) => a.horario.localeCompare(b.horario))
      }));
  }

  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Normalizar datas para comparação (apenas dia/mês/ano)
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowNormalized = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (eventDate.getTime() === todayNormalized.getTime()) {
      return 'Hoje - ' + date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });
    } else if (eventDate.getTime() === tomorrowNormalized.getTime()) {
      return 'Amanhã - ' + date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  getEventCountText(count: number): string {
    return count === 1 ? '1 evento' : `${count} eventos`;
  }
}
