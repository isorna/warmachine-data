import { Routes } from '@angular/router';
import { UnitListComponent } from './unit-list/unit-list.component';
import { UnitFormComponent } from './unit-form/unit-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/units', pathMatch: 'full' },
  { path: 'units', component: UnitListComponent },
  { path: 'edit/:fileName', component: UnitFormComponent },
  { path: 'new', component: UnitFormComponent }
];
