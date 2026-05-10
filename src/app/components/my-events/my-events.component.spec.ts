import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { MyEventsComponent } from './my-events.component';
import { EventApiService } from '../../services/event/event-api.service';
import { EventUpdateService } from '../../services/event/event-update.service';
import { StateService } from '../../services/state/state.service';

describe('MyEventsComponent', () => {
  let component: MyEventsComponent;
  let fixture: ComponentFixture<MyEventsComponent>;

  beforeEach(async () => {
    const updates$ = new Subject<string | void>();

    await TestBed.configureTestingModule({
      imports: [MyEventsComponent],
      providers: [
        { provide: EventApiService, useValue: { getEvents: () => of({ statusCode: 200, data: [] }) } },
        { provide: EventUpdateService, useValue: { eventUpdated$: updates$.asObservable() } }
        ,{ provide: StateService, useValue: { userData: { id: 1 } } }
        ,{ provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
