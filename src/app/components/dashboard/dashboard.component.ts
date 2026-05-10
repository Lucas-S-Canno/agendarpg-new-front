import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { EventModelV2 } from '../../models/event.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { EventsByDate } from '../../models/eventsByDate';
import { EventUpdateService } from '../../services/event/event-update.service';
import { Subscription } from 'rxjs';
import { EventApiService } from '../../services/event/event-api.service';

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
  events: EventModelV2[] = [];
  eventsByDate: EventsByDate[] = [];
  private eventUpdateSubscription: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private eventApiService: EventApiService,
    private eventUpdateService: EventUpdateService
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

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
    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        this.events = this.filterUpcomingEvents(response.data ?? []);
        this.groupEventsByDate();
      },
      error: (error) => {
        console.error('Error fetching events:', error);
      }
    });
  }

  getAllEvents(): void {
    this.eventApiService.getEvents().subscribe({
      next: (response) => {
        this.events = this.filterUpcomingEvents(response.data ?? []);
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

  private filterUpcomingEvents(events: EventModelV2[]): EventModelV2[] {
    const now = Date.now();
    return events.filter((event) => new Date(event.inicio).getTime() >= now);
  }

  groupEventsByDate(): void {
    const grouped = this.events.reduce((acc, event) => {
      const date = event.inicio.split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as { [key: string]: EventModelV2[] });

    this.eventsByDate = Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date,
        displayDate: this.formatDateForDisplay(date),
        events: grouped[date].sort((a, b) => a.inicio.localeCompare(b.inicio))
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
