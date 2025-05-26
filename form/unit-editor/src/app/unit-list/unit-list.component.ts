import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // For async pipe and *ngFor
import { Router, RouterModule } from '@angular/router'; // Import RouterModule for routerLink
import { Observable, of } from 'rxjs';
import { UnitDataService } from '../unit-data.service';

@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule here
  templateUrl: './unit-list.component.html',
  styleUrls: ['./unit-list.component.css']
})
export class UnitListComponent implements OnInit {
  unitFiles$: Observable<string[]> = of([]);

  constructor(
    private unitDataService: UnitDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.unitFiles$ = this.unitDataService.listUnitFiles();
  }

  selectUnit(fileName: string): void {
    console.log('Selected unit:', fileName);
    this.router.navigate(['/edit', fileName]);
  }

  createNewUnit(): void {
    console.log('Navigating to create new unit');
    this.router.navigate(['/new']);
  }

  deleteUnit(fileName: string): void {
    // Add a confirmation dialog before deleting
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      console.log('Deleting unit:', fileName);
      this.unitDataService.deleteUnitFile(fileName).subscribe({ // Assuming deleteUnitFile returns an Observable
        next: () => {
          console.log(`${fileName} deleted successfully`);
          // Refresh the list after deletion
          this.unitFiles$ = this.unitDataService.listUnitFiles();
        },
        error: (err) => {
          console.error(`Error deleting ${fileName}`, err);
          // Optionally, display an error message to the user
        }
      });
    }
  }
}
