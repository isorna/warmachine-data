import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UnitDataService } from '../unit-data.service';

@Component({
  selector: 'app-faction-form',
  imports: [CommonModule, RouterModule],
  templateUrl: './faction-form.component.html',
  styleUrl: './faction-form.component.css'
})
export class FactionFormComponent {
  factionId: string | null = null;
  isLoading: boolean = true; // To manage loading state
  factionData: any = [];

  constructor(
    private unitDataService: UnitDataService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.route.paramMap.subscribe(params => {
      const factionId = params.get('faction');
      if (factionId) {
        this.factionId = factionId;
        this.unitDataService.getFactionData(`${this.factionId}.json`).then((observable) => {
          observable.subscribe(data => {
            if (data && Object.keys(data).length > 0) {
              console.log(`faction form component: Got faction data for ${this.factionId}`, data);
              // data is an object, convert it to an array
              this.factionData = Object.values(data);
            } else {
              console.warn(`No data found for ${this.factionId}, or data is empty. Initializing with default structure.`);
              this.factionData = [];
            }
          });
        });
        this.isLoading = false;
      } else {
        this.factionId = null;
        // this.initializeNewUnitData();
        // this.prepareUnitDataForDisplay();
        this.isLoading = false;
      }
    });
  }
}
