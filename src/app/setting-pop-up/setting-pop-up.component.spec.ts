import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingPopUpComponent } from './setting-pop-up.component';

describe('SettingPopUpComponent', () => {
  let component: SettingPopUpComponent;
  let fixture: ComponentFixture<SettingPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingPopUpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
