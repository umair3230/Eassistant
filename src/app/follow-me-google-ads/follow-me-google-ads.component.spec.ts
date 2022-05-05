import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowMeGoogleAdsComponent } from './follow-me-google-ads.component';

describe('FollowMeGoogleAdsComponent', () => {
  let component: FollowMeGoogleAdsComponent;
  let fixture: ComponentFixture<FollowMeGoogleAdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FollowMeGoogleAdsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowMeGoogleAdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
