import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationV2Component } from './location_v2.component';

describe('LocationV2Component', () => {
  let component: LocationV2Component;
  let fixture: ComponentFixture<LocationV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
