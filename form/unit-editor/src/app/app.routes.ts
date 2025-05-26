import { Routes } from '@angular/router';
import { UnitListComponent } from './unit-list/unit-list.component';
import { UnitFormComponent } from './unit-form/unit-form.component';
import { FactionFormComponent } from './faction-form/faction-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/factions', pathMatch: 'full' },
  { path: 'factions', component: UnitListComponent },
  { path: 'edit/:faction', component: FactionFormComponent },
  { path: 'edit/:faction/:profile', component: UnitFormComponent },
  { path: 'new', component: UnitFormComponent }
];
