import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UnitDataService } from '../unit-data.service';

@Component({
  selector: 'app-faction-form',
  imports: [CommonModule, RouterModule],
  templateUrl: './faction-form.component.html',
  styleUrl: './faction-form.component.css'
})
export class FactionFormComponent {
  factionId: string | null = null;
  factionData: any = [];
  factionData$: Observable<any[]> = of([]);

  constructor(
    private unitDataService: UnitDataService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async params => {
      const factionId = params.get('faction');
      if (factionId) {
        this.factionId = factionId;
        this.factionData$ = await this.unitDataService.getFactionData(`${this.factionId}.json`);
      } else {
        this.factionId = null;
      }
    });
  }

  selectUnit(unitId: string): void {
    console.log('Selected unit:', unitId);
    this.router.navigate(['/edit', this.factionId, unitId]);
  }

  deleteUnit(unitId: string): void {
    // Add a confirmation dialog before deleting
    if (confirm(`Are you sure you want to delete ${unitId}?`)) {
      console.log('Deleting unit:', unitId);
      this.unitDataService.deleteUnitFile(unitId).subscribe({ // Assuming deleteUnitFile returns an Observable
        next: async () => {
          console.log(`${unitId} deleted successfully`);
          // Refresh the list after deletion
          this.factionData$ = await this.unitDataService.getFactionData(`${this.factionId}.json`);
        },
        error: (err) => {
          console.error(`Error deleting ${unitId}`, err);
          // Optionally, display an error message to the user
        }
      });
    }
  }
}
