import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllNotifications } from './all-notifications';

describe('AllNotifications', () => {
  let component: AllNotifications;
  let fixture: ComponentFixture<AllNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllNotifications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllNotifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
